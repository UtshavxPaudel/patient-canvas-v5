// Vercel-compatible server with Redis KV storage
// This version persists all data to Redis for permanent storage
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Redis client setup
let redisClient = null;
let redisConnected = false;

const getRedisClient = async () => {
  if (redisClient && redisConnected) {
    return redisClient;
  }

  try {
    if (!process.env.REDIS_URL) {
      console.log('⚠️  No REDIS_URL found, using in-memory storage');
      return null;
    }

    redisClient = createClient({ 
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('❌ Redis reconnection failed after 3 attempts');
            return new Error('Redis connection failed');
          }
          return retries * 100;
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      redisConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    redisConnected = false;
    return null;
  }
};

// Simple in-memory list of SSE clients
const sseClients = new Set();

// Helper function to broadcast SSE messages
const broadcastSSE = (message) => {
  const eventType = message.event || 'new-item';
  const data = { ...message };
  delete data.event; // Remove event from data payload
  
  for (const client of sseClients) {
    try {
      client.write(`event: ${eventType}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_) {}
  }
};

// SSE endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (res.flushHeaders) res.flushHeaders();

  res.write('event: connected\n');
  res.write('data: "ok"\n\n');

  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: ${Date.now()}\n\n`);
    } catch (_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    try { res.end(); } catch (_) {}
  });
});

// Load board items from Redis or source data
const loadBoardItems = async () => {
  try {
    const redis = await getRedisClient();
    
    if (redis && redisConnected) {
      // Try to get from Redis first
      const cachedData = await redis.get('board:items');
      if (cachedData) {
        console.log('📦 Loaded items from Redis');
        return JSON.parse(cachedData);
      }
    }

    // Fall back to source data file
    console.log('📂 Loading from source data file...');
    const sourceDataPath = path.join(__dirname, '..', 'src', 'data', 'boardItems.json');
    const sourceData = await fs.readFile(sourceDataPath, 'utf8');
    const items = JSON.parse(sourceData);
    
    // Save to Redis for future use
    if (redis && redisConnected) {
      await redis.set('board:items', JSON.stringify(items));
      console.log('💾 Cached items to Redis');
    }
    
    return items;
  } catch (error) {
    console.error('Error loading board items:', error);
    return [];
  }
};

// Save board items to Redis
const saveBoardItems = async (items) => {
  try {
    const redis = await getRedisClient();
    if (redis && redisConnected) {
      await redis.set('board:items', JSON.stringify(items));
      console.log(`💾 Saved ${items.length} items to Redis`);
      return true;
    } else {
      console.log('⚠️  Redis not available, items will not persist');
      return false;
    }
  } catch (error) {
    console.error('Error saving board items:', error);
    return false;
  }
};

// GET /api/board-items - Get all board items
app.get('/api/board-items', async (req, res) => {
  try {
    const items = await loadBoardItems();
    res.json(items);
  } catch (error) {
    console.error('Error loading board items:', error);
    res.status(500).json({ error: 'Failed to load board items' });
  }
});

// POST /api/board-items - Create a new board item
app.post('/api/board-items', async (req, res) => {
  try {
    const { type, componentType, x, y, width, height, content, color, rotation, ehrData } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }
    
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let defaultWidth, defaultHeight, defaultColor, defaultContent;
    
    if (type === 'component') {
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
      defaultWidth = type === 'text' ? 200 : type === 'ehr' ? 550 : 150;
      defaultHeight = type === 'text' ? 100 : type === 'ehr' ? 450 : 150;
      defaultColor = type === 'sticky' ? '#ffeb3b' : type === 'ehr' ? '#e8f5e8' : '#2196f3';
      defaultContent = type === 'text' ? 'Double click to edit' : type === 'ehr' ? 'EHR Data' : '';
    }
    
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
    
    const items = await loadBoardItems();
    items.push(newItem);
    await saveBoardItems(items);
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating board item:', error);
    res.status(500).json({ error: 'Failed to create board item' });
  }
});

// POST /api/todos - Create a todo (saved to Redis)
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, todo_items } = req.body || {};

    if (!title || !Array.isArray(todo_items)) {
      return res.status(400).json({
        error: 'title (string) and todo_items (array) are required'
      });
    }

    const todos = todo_items.map((t) => {
      if (typeof t === 'string') return { text: t, status: 'todo' };
      if (t && typeof t.text === 'string') return { text: t.text, status: t.status || 'todo' };
      return { text: String(t), status: 'todo' };
    });

    const calculateTodoHeight = (todos, description) => {
      const baseHeight = 80;
      const itemHeight = 35;
      const descriptionHeight = description ? 20 : 0;
      const padding = 20;
      const totalItems = todos.length;
      const contentHeight = baseHeight + (totalItems * itemHeight) + descriptionHeight + padding;
      return Math.min(Math.max(contentHeight, 200), 600);
    };

    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const dynamicHeight = calculateTodoHeight(todos, description);
    
    const newItem = {
      id,
      type: 'todo',
      x: Math.random() * 8000 + 100,
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

    const items = await loadBoardItems();
    items.push(newItem);
    const saved = await saveBoardItems(items);

    if (!saved) {
      console.warn('⚠️  Todo created but not persisted to Redis');
    }

    // Broadcast via SSE
    const payload = { event: 'new-item', item: newItem, timestamp: new Date().toISOString(), action: 'created' };
    broadcastSSE(payload);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating todo item:', error);
    res.status(500).json({ error: 'Failed to create todo item' });
  }
});

// POST /api/agents - Create agent result
app.post('/api/agents', async (req, res) => {
  try {
    const { title, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        error: 'title (string) and content (string) are required'
      });
    }

    const calculateHeight = (content) => {
      const baseHeight = 80;
      const lineHeight = 20;
      const maxWidth = 520;
      const estimatedLines = Math.ceil(content.length / (maxWidth / 12));
      const contentHeight = Math.max(estimatedLines * lineHeight, 100);
      return Math.min(baseHeight + contentHeight, 800);
    };

    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const dynamicHeight = calculateHeight(content);
    
    const newItem = {
      id,
      type: 'agent',
      x: Math.random() * 8000 + 100,
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

    const items = await loadBoardItems();
    items.push(newItem);
    await saveBoardItems(items);

    const payload = { event: 'new-item', item: newItem, timestamp: new Date().toISOString(), action: 'created' };
    broadcastSSE(payload);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating agent item:', error);
    res.status(500).json({ error: 'Failed to create agent item' });
  }
});

// POST /api/lab-results - Create lab result
app.post('/api/lab-results', async (req, res) => {
  try {
    const { parameter, value, unit, status, range, trend } = req.body || {};

    if (!parameter || !value || !unit || !status || !range) {
      return res.status(400).json({
        error: 'parameter, value, unit, status, and range are required'
      });
    }

    const validStatuses = ['optimal', 'warning', 'critical'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'status must be one of: optimal, warning, critical'
      });
    }

    if (!range.min || !range.max || range.min >= range.max) {
      return res.status(400).json({
        error: 'range must have valid min and max values where min < max'
      });
    }

    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const newItem = {
      id,
      type: 'lab-result',
      x: Math.random() * 8000 + 100,
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

    const items = await loadBoardItems();
    items.push(newItem);
    await saveBoardItems(items);

    broadcastSSE({ event: 'new-item', item: newItem, timestamp: new Date().toISOString(), action: 'created' });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating lab result:', error);
    res.status(500).json({ error: 'Failed to create lab result' });
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
    
    items[itemIndex] = {
      ...items[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await saveBoardItems(items);
    
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

// POST /api/components - Create dashboard component
app.post('/api/components', async (req, res) => {
  try {
    const { componentType, x, y, width, height, props } = req.body;

    if (!componentType) {
      return res.status(400).json({ error: 'componentType is required' });
    }

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

    const items = await loadBoardItems();
    items.push(newItem);
    await saveBoardItems(items);

    broadcastSSE({ event: 'new-item', item: newItem, timestamp: new Date().toISOString(), action: 'created' });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

// POST /api/focus - Focus item
app.post('/api/focus', (req, res) => {
  const { objectId } = req.body;
  
  if (!objectId) {
    return res.status(400).json({ error: 'objectId is required' });
  }
  
  console.log(`🎯 Focus request: ${objectId}`);
  
  const payload = { objectId, timestamp: new Date().toISOString() };
  broadcastSSE({ event: 'focus-item', ...payload });
  
  res.json({ 
    success: true, 
    message: `Focusing on item: ${objectId}`,
    objectId
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  const redis = await getRedisClient();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    storage: redisConnected ? 'redis' : 'fallback',
    redis: redisConnected ? 'connected' : 'disconnected'
  });
});

// Export for Vercel
module.exports = app;

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  });
}
