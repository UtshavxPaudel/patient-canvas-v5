const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory list of SSE clients
const sseClients = new Set();

// Helper function to broadcast SSE messages
const broadcastSSE = (message) => {
  for (const client of sseClients) {
    try {
      client.write('event: new-item\n');
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (_) {}
  }
};

// SSE endpoint to push focus events to the frontend
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Allow CORS for SSE explicitly if proxying is not used
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Flush headers immediately
  if (res.flushHeaders) res.flushHeaders();

  // Initial event to confirm connection
  res.write('event: connected\n');
  res.write('data: "ok"\n\n');

  sseClients.add(res);

  // Keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: ${Date.now()}\n\n`);
    } catch (_) {
      // Ignore write errors, cleanup will remove the client
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    try { res.end(); } catch (_) {}
  });
});

// Data file path - use the source data file with detailed patient info
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'boardItems.json');

// Ensure data directory exists
const ensureDataDirectory = async () => {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Load board items from file
const loadBoardItems = async () => {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing data file, using default data');
    return [
      {
        "id": "ehr-item-1",
        "type": "ehr",
        "x": 3200,
        "y": 3200,
        "width": 550,
        "height": 450,
        "content": "EHR Data",
        "color": "#e8f5e8",
        "rotation": 0,
        "ehrData": {
          "encounter_id": "enc_2025_03_18_rheum_001",
          "source_system": "OracleHealth EHR",
          "patient": {
            "id": "pt_000392",
            "mrn": "MRN-7342291",
            "name": "John McAllister",
            "dob": "1972-06-22",
            "age": 52,
            "sex": "Male"
          },
          "encounter_metadata": {
            "date": "2025-03-18",
            "time": "10:30",
            "type": "Outpatient",
            "clinic": "Rheumatology Clinic A",
            "location": "Summit Medical Center, 4F",
            "clinician": "Dr. Elizabeth Hayes",
            "specialty": "Rheumatology",
            "visit_reason": "RA disease activity reassessment and methotrexate monitoring"
          }
        }
      }
    ];
  }
};

// Save board items to file
const saveBoardItems = async (items) => {
  try {
    await ensureDataDirectory();
    await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Error saving board items:', error);
    throw error;
  }
};

// Collision detection function
const checkCollision = (item1, item2) => {
  // Two rectangles overlap if they don't satisfy any of these conditions:
  // 1. item1 is completely to the left of item2
  // 2. item1 is completely to the right of item2  
  // 3. item1 is completely above item2
  // 4. item1 is completely below item2
  
  const noCollision = (
    item1.x + item1.width <= item2.x ||  // item1 is completely to the left
    item2.x + item2.width <= item1.x ||  // item1 is completely to the right
    item1.y + item1.height <= item2.y || // item1 is completely above
    item2.y + item2.height <= item1.y    // item1 is completely below
  );
  
  const hasCollision = !noCollision;
  
  if (hasCollision) {
    console.log(`💥 Collision detected: Item1(${item1.x},${item1.y},${item1.width},${item1.height}) vs Item2(${item2.x},${item2.y},${item2.width},${item2.height})`);
  }
  
  return hasCollision;
};

// Find non-overlapping position for new item
const findNonOverlappingPosition = (newItem, existingItems) => {
  const padding = 20; // Minimum gap between items
  const maxAttempts = 50; // Prevent infinite loops
  let attempts = 0;
  
  // Start with the original position
  let testX = newItem.x;
  let testY = newItem.y;
  
  // If no position specified, start at a random location
  if (!newItem.x || !newItem.y) {
    testX = Math.random() * 8000 + 100;
    testY = Math.random() * 7000 + 100;
  }
  
  console.log(`🔍 Checking collision for new item at (${testX}, ${testY}) with ${existingItems.length} existing items`);
  
  // Log all existing items for debugging
  existingItems.forEach((item, index) => {
    console.log(`  Existing item ${index}: ${item.id} at (${item.x}, ${item.y}) size (${item.width}, ${item.height})`);
  });
  
  while (attempts < maxAttempts) {
    let hasCollision = false;
    let collidingItem = null;
    
    // Check collision with all existing items
    for (const existingItem of existingItems) {
      const testItem = {
        x: testX,
        y: testY,
        width: newItem.width,
        height: newItem.height
      };
      
      if (checkCollision(testItem, existingItem)) {
        console.log(`⚠️  Collision detected with existing item ${existingItem.id} at (${existingItem.x}, ${existingItem.y})`);
        hasCollision = true;
        collidingItem = existingItem;
        break;
      }
    }
    
    // If no collision found, use this position
    if (!hasCollision) {
      console.log(`✅ No collision found, using position (${testX}, ${testY})`);
      return { x: testX, y: testY };
    }
    
    // Move to next position (below existing items)
    // Strategy: Find the bottom-most item and place below it
    let maxBottom = 0;
    for (const existingItem of existingItems) {
      const bottom = existingItem.y + existingItem.height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    }
    
    // Place below the bottom-most item with padding
    testY = maxBottom + padding;
    
    console.log(`📍 Moving to position below bottom-most item: (${testX}, ${testY})`);
    
    // If we're too far down, try a new random X position
    if (testY > 8000) {
      testX = Math.random() * 8000 + 100;
      testY = Math.random() * 7000 + 100;
      console.log(`🔄 Canvas too crowded, trying new random position: (${testX}, ${testY})`);
    }
    
    attempts++;
  }
  
  // If we couldn't find a non-overlapping position, use the last calculated position
  console.log(`⚠️  Could not find non-overlapping position after ${attempts} attempts, using fallback position (${testX}, ${testY})`);
  return { x: testX, y: testY };
};

// Helper function to update height in source data file
const updateSourceDataHeight = async (itemId, newHeight) => {
  try {
    const sourceDataPath = path.join(__dirname, 'src', 'data', 'boardItems.json');
    const sourceData = await fs.readFile(sourceDataPath, 'utf8');
    const sourceItems = JSON.parse(sourceData);
    
    const itemIndex = sourceItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      sourceItems[itemIndex].height = newHeight;
      await fs.writeFile(sourceDataPath, JSON.stringify(sourceItems, null, 2));
      console.log(`📏 Updated height for item ${itemId} in source data: ${newHeight}px`);
    }
  } catch (error) {
    console.log('Could not update source data height:', error.message);
  }
};

// GET /api/board-items - Get all board items (merged from both sources)
app.get('/api/board-items', async (req, res) => {
  try {
    // Load items from backend storage
    const backendItems = await loadBoardItems();
    
    // Load items from source data
    const sourceDataPath = path.join(__dirname, 'src', 'data', 'boardItems.json');
    let sourceItems = [];
    try {
      const sourceData = await fs.readFile(sourceDataPath, 'utf8');
      sourceItems = JSON.parse(sourceData);
    } catch (error) {
      console.log('Source data not found, using only backend items');
    }
    
    // Merge items, avoiding duplicates by ID
    const sourceIds = new Set(sourceItems.map(item => item.id));
    const uniqueBackendItems = backendItems.filter(item => !sourceIds.has(item.id));
    const mergedItems = [...sourceItems, ...uniqueBackendItems];
    
    console.log(`📊 Merged board items: ${sourceItems.length} source + ${uniqueBackendItems.length} unique backend = ${mergedItems.length} total`);
    
    res.json(mergedItems);
  } catch (error) {
    console.error('Error loading board items:', error);
    res.status(500).json({ error: 'Failed to load board items' });
  }
});

// POST /api/board-items - Create a new board item
app.post('/api/board-items', async (req, res) => {
  try {
    const { type, componentType, x, y, width, height, content, color, rotation, ehrData } = req.body;
    
    // Validate required fields
    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }
    
    // Generate unique ID
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set default values based on type
    let defaultWidth, defaultHeight, defaultColor, defaultContent;
    
    if (type === 'component') {
      // Component-specific defaults
      switch (componentType) {
        case 'PatientContext':
          defaultWidth = 1600;
          defaultHeight = 300;
          break;
        case 'EncounterTimeline':
          defaultWidth = 1600;
          defaultHeight = 400;
          break;
        case 'AdverseEventAnalytics':
          defaultWidth = 1600;
          defaultHeight = 500;
          break;
        case 'LabTable':
        case 'LabChart':
        case 'DifferentialDiagnosis':
          defaultWidth = 520;
          defaultHeight = 400;
          break;
        default:
          defaultWidth = 600;
          defaultHeight = 400;
      }
      defaultColor = '#ffffff';
      defaultContent = content || {};
    } else {
      // Legacy item types
      defaultWidth = type === 'text' ? 200 : type === 'ehr' ? 550 : 150;
      defaultHeight = type === 'text' ? 100 : type === 'ehr' ? 450 : 150;
      defaultColor = type === 'sticky' ? '#ffeb3b' : type === 'ehr' ? '#e8f5e8' : '#2196f3';
      defaultContent = type === 'text' ? 'Double click to edit' : type === 'ehr' ? 'EHR Data' : '';
    }
    
    // Create new board item
    const newItem = {
      id,
      type,
      componentType: componentType || undefined,
      x: x || Math.random() * 8000 + 100,
      y: y || Math.random() * 7000 + 100,
      width: width || defaultWidth,
      height: height || defaultHeight,
      content: content || defaultContent,
      color: color || defaultColor,
      rotation: rotation || 0,
      ehrData: type === 'ehr' ? (ehrData || {}) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Load existing items and add new one
    const existingItems = await loadBoardItems();
    const updatedItems = [...existingItems, newItem];
    
    // Save updated items
    await saveBoardItems(updatedItems);
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating board item:', error);
    res.status(500).json({ error: 'Failed to create board item' });
  }
});

// PUT /api/board-items/:id - Update a board item
app.put('/api/board-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const items = await loadBoardItems();
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Board item not found' });
    }
    
    // Update the item
    items[itemIndex] = {
      ...items[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await saveBoardItems(items);
    
    // If height was updated, also update the source data file
    if (updates.height !== undefined) {
      await updateSourceDataHeight(id, updates.height);
    }
    
    res.json(items[itemIndex]);
  } catch (error) {
    console.error('Error updating board item:', error);
    res.status(500).json({ error: 'Failed to update board item' });
  }
});

// DELETE /api/board-items/:id - Delete a board item
app.delete('/api/board-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const items = await loadBoardItems();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) {
      return res.status(404).json({ error: 'Board item not found' });
    }
    
    await saveBoardItems(filteredItems);
    
    res.json({ message: 'Board item deleted successfully' });
  } catch (error) {
    console.error('Error deleting board item:', error);
    res.status(500).json({ error: 'Failed to delete board item' });
  }
});

// POST /api/todos - Create a new TODO board item
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, todo_items } = req.body || {};

    if (!title || !Array.isArray(todo_items)) {
      return res.status(400).json({
        error: 'title (string) and todo_items (array) are required'
      });
    }

    // Normalize todo items: accept strings or { text, status }
    const normalizeStatus = (s) => (['todo', 'in_progress', 'done'].includes((s || '').toLowerCase()) ? s.toLowerCase() : 'todo');
    const todos = todo_items.map((t) => {
      if (typeof t === 'string') return { text: t, status: 'todo' };
      if (t && typeof t.text === 'string') return { text: t.text, status: normalizeStatus(t.status) };
      return { text: String(t), status: 'todo' };
    });

    // Calculate dynamic height based on todo items
    const calculateTodoHeight = (todos, description) => {
      const baseHeight = 80; // Header + padding
      const itemHeight = 35; // Height per todo item
      const descriptionHeight = description ? 20 : 0; // Extra height for description
      const padding = 20; // Bottom padding
      
      const totalItems = todos.length;
      const contentHeight = baseHeight + (totalItems * itemHeight) + descriptionHeight + padding;
      
      return Math.min(Math.max(contentHeight, 200), 600); // Min 200px, max 600px
    };

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const dynamicHeight = calculateTodoHeight(todos, description);
    const newItem = {
      id,
      type: 'todo',
      x: Math.random() * 8000 + 100, // Default position
      y: Math.random() * 7000 + 100,
      width: 420,
      height: dynamicHeight,
      content: 'Todo List',
      color: '#ffffff',
      rotation: 0,
      todoData: {
        title,
        description: description || '',
        todos,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items for collision detection
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for collision detection`);
    
    // Find non-overlapping position
    const finalPosition = findNonOverlappingPosition(newItem, existingItems);
    newItem.x = finalPosition.x;
    newItem.y = finalPosition.y;
    
    console.log(`📍 Positioned new TODO item at (${newItem.x}, ${newItem.y}) to avoid collisions`);

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE (new-item)
    const payload = { item: newItem, timestamp: new Date().toISOString(), action: 'created' };
    for (const client of sseClients) {
      try {
        client.write('event: new-item\n');
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (_) {}
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating todo item:', error);
    res.status(500).json({ error: 'Failed to create todo item' });
  }
});

// POST /api/agents - Create a new agent result item
app.post('/api/agents', async (req, res) => {
  try {
    const { title, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        error: 'title (string) and content (string) are required'
      });
    }

    // Calculate dynamic height based on content
    const calculateHeight = (content) => {
      const baseHeight = 80; // Header + padding
      const lineHeight = 20; // Approximate line height
      const maxWidth = 520; // Container width
      
      // Estimate lines based on content length and width
      const estimatedLines = Math.ceil(content.length / (maxWidth / 12)); // 12px char width
      const contentHeight = Math.max(estimatedLines * lineHeight, 100); // Minimum 100px
      
      return Math.min(baseHeight + contentHeight, 800); // Cap at 800px
    };

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const dynamicHeight = calculateHeight(content);
    const newItem = {
      id,
      type: 'agent',
      x: Math.random() * 8000 + 100, // Default position
      y: Math.random() * 7000 + 100,
      width: 520,
      height: dynamicHeight,
      content: content,
      color: '#ffffff',
      rotation: 0,
      agentData: {
        title,
        markdown: content,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items for collision detection
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for collision detection`);
    
    // Find non-overlapping position
    const finalPosition = findNonOverlappingPosition(newItem, existingItems);
    newItem.x = finalPosition.x;
    newItem.y = finalPosition.y;
    
    console.log(`📍 Positioned new AGENT item at (${newItem.x}, ${newItem.y}) to avoid collisions`);

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE (new-item)
    const payload = { item: newItem, timestamp: new Date().toISOString(), action: 'created' };
    for (const client of sseClients) {
      try {
        client.write('event: new-item\n');
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (_) {}
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating agent item:', error);
    res.status(500).json({ error: 'Failed to create agent item' });
  }
});

// POST /api/lab-results - Create a new lab result board item
app.post('/api/lab-results', async (req, res) => {
  try {
    const { parameter, value, unit, status, range, trend } = req.body || {};

    if (!parameter || !value || !unit || !status || !range) {
      return res.status(400).json({
        error: 'parameter, value, unit, status, and range are required'
      });
    }

    // Validate status
    const validStatuses = ['optimal', 'warning', 'critical'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'status must be one of: optimal, warning, critical'
      });
    }

    // Validate range
    if (!range.min || !range.max || range.min >= range.max) {
      return res.status(400).json({
        error: 'range must have valid min and max values where min < max'
      });
    }

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newItem = {
      id,
      type: 'lab-result',
      x: Math.random() * 8000 + 100, // Default position
      y: Math.random() * 7000 + 100,
      width: 400,
      height: 280,
      content: parameter,
      color: '#ffffff',
      rotation: 0,
      labResultData: {
        parameter,
        value,
        unit,
        status,
        range,
        trend: trend || 'stable',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items for collision detection
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for collision detection`);
    
    // Find non-overlapping position
    const finalPosition = findNonOverlappingPosition(newItem, existingItems);
    newItem.x = finalPosition.x;
    newItem.y = finalPosition.y;
    
    console.log(`📍 Positioned new LAB RESULT item at (${newItem.x}, ${newItem.y}) to avoid collisions`);

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE (new-item)
    const sseMessage = {
      type: 'new-item',
      item: newItem
    };
    broadcastSSE(sseMessage);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating lab result:', error);
    res.status(500).json({ error: 'Failed to create lab result' });
  }
});

// POST /api/components - Create a new dashboard component
app.post('/api/components', async (req, res) => {
  try {
    const { componentType, x, y, width, height, props } = req.body;

    if (!componentType) {
      return res.status(400).json({
        error: 'componentType is required'
      });
    }

    // Set default dimensions based on component type
    let defaultWidth, defaultHeight;
    switch (componentType) {
      case 'PatientContext':
        defaultWidth = 1600;
        defaultHeight = 300;
        break;
      case 'EncounterTimeline':
        defaultWidth = 1600;
        defaultHeight = 400;
        break;
      case 'AdverseEventAnalytics':
        defaultWidth = 1600;
        defaultHeight = 500;
        break;
      case 'LabTable':
      case 'LabChart':
      case 'DifferentialDiagnosis':
        defaultWidth = 520;
        defaultHeight = 400;
        break;
      default:
        defaultWidth = 600;
        defaultHeight = 400;
    }

    const id = `dashboard-item-${componentType.toLowerCase()}-${Date.now()}`;
    
    const newItem = {
      id,
      type: 'component',
      componentType,
      x: x || Math.random() * 8000 + 100,
      y: y || Math.random() * 7000 + 100,
      width: width || defaultWidth,
      height: height || defaultHeight,
      content: {
        title: componentType,
        props: props || {}
      },
      color: '#ffffff',
      rotation: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items for collision detection
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for collision detection`);
    
    // Find non-overlapping position
    const finalPosition = findNonOverlappingPosition(newItem, existingItems);
    newItem.x = finalPosition.x;
    newItem.y = finalPosition.y;
    
    console.log(`📍 Positioned new ${componentType} component at (${newItem.x}, ${newItem.y})`);

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE
    const payload = { item: newItem, timestamp: new Date().toISOString(), action: 'created' };
    for (const client of sseClients) {
      try {
        client.write('event: new-item\n');
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (_) {}
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

// POST /api/focus - Focus on a specific canvas item
app.post('/api/focus', (req, res) => {
  const { objectId } = req.body;
  
  if (!objectId) {
    return res.status(400).json({ 
      error: 'objectId is required' 
    });
  }
  
  console.log(`🎯 Focus request: ${objectId}`);
  
  // Broadcast focus event to all connected SSE clients
  const payload = { objectId, timestamp: new Date().toISOString() };
  for (const client of sseClients) {
    try {
      client.write('event: focus-item\n');
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (_) {
      // Ignore write errors for stale clients
    }
  }
  
  // Return success
  res.json({ 
    success: true, 
    message: `Focusing on item: ${objectId}`,
    objectId
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;

// Start server (only in local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  });
}
