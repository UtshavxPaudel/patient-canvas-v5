# 🎯 Focus System Analysis & Enhancement Plan

## 📋 Current Focus System Architecture

### 1. **Data Structure** (How Focus Works Now)

#### SSE Event Flow:
```
Voice AI (api2.medforce-ai.com) 
    ↓ POST
/api/focus endpoint (Vercel)
    ↓ SSE broadcast
Canvas (React App)
    ↓ Centers viewport
Item (Entire component)
```

#### Focus Event Data Structure:
```json
{
  "event": "focus-item",
  "objectId": "dashboard-item-patientcontext-1234",
  "timestamp": "2025-10-15T08:00:00.000Z"
}
```

#### Current API Endpoint (`/api/focus`):
```javascript
POST /api/focus
Body: {
  "objectId": "dashboard-item-patientcontext-1234"
}

Response: {
  "success": true,
  "message": "Focusing on item: dashboard-item-patientcontext-1234",
  "objectId": "dashboard-item-patientcontext-1234"
}
```

### 2. **How Focus Currently Works**

#### Step 1: Voice Command Received
```
User says: "Focus on patient context"
api2.medforce-ai.com receives voice
ai2.medforce-ai.com maps to item ID
```

#### Step 2: API Call
```javascript
// Voice server sends:
POST https://board-v4-working.vercel.app/api/focus
{
  "objectId": "dashboard-item-1759853783245-patient-context"
}
```

#### Step 3: SSE Broadcast
```javascript
// server-redis.js broadcasts:
broadcastSSE({ 
  event: 'focus-item',
  objectId: 'dashboard-item-1759853783245-patient-context',
  timestamp: new Date().toISOString()
});
```

#### Step 4: Canvas Receives & Animates
```typescript
// App.tsx receives SSE:
es.addEventListener('focus-item', (event) => {
  const data = JSON.parse(event.data);
  handleFocusRequest({ objectId: data.objectId });
});

// Canvas centers on item:
centerOnItem(itemId, finalZoom = 0.8, duration = 3000);
```

#### Step 5: Three-Phase Animation
```
Phase 1 (1s): Zoom out to 30% of current zoom
Phase 2 (1s): Pan to center item
Phase 3 (1s): Zoom in to 80% (0.8 scale)
```

---

## ❌ Current Limitations (RED - Current Focus Level)

### Problem 1: **Whole Item Focus Only**
```
✅ Can focus: "dashboard-item-patientcontext-1234"
❌ Cannot focus: "diagnosis section inside patient context"
❌ Cannot focus: "medication timeline entry"
❌ Cannot focus: "specific lab result"
```

### Problem 2: **No Sub-Element Targeting**
```javascript
// Current structure:
{
  "id": "dashboard-item-patientcontext-1234",
  "type": "component",
  "componentType": "PatientContext",
  "content": {
    "props": {
      "patientData": {
        "patient": { ... },
        "medication_timeline": [ ... ],  // ❌ Can't focus here
        "allergies": [ ... ]              // ❌ Can't focus here
      }
    }
  }
}
```

### Problem 3: **Fixed Zoom Level**
```javascript
// Always zooms to 0.8 (80%)
centerOnItem(itemId, 0.8, 3000);
// Too far out for small elements
```

---

## ✅ Enhanced Focus System (GREEN - Desired Focus Level)

### Solution Architecture

#### 1. **Sub-Element Addressing System**
```json
{
  "objectId": "dashboard-item-patientcontext-1234",
  "subElement": "medications.methotrexate",
  "zoom": 1.5,
  "highlight": true,
  "duration": 2000
}
```

#### 2. **Hierarchical ID System**
```
Format: {itemId}#{section}.{subsection}.{element}

Examples:
- "dashboard-item-patientcontext-1234#patient.name"
- "dashboard-item-patientcontext-1234#medications.methotrexate"
- "dashboard-item-encountertimeline-456#encounter_1.diagnosis"
- "dashboard-item-patientcontext-1234#allergies.penicillin"
```

#### 3. **Enhanced API Endpoint**
```javascript
POST /api/focus
{
  "objectId": "dashboard-item-patientcontext-1234",
  "subElement": "medications.methotrexate",
  "focusOptions": {
    "zoom": 1.5,           // Higher zoom for precision
    "highlight": true,     // Highlight the sub-element
    "duration": 2000,      // Animation duration
    "scrollIntoView": true // Scroll within container if needed
  }
}
```

---

## 🔧 Implementation Plan

### Phase 1: **Add Sub-Element Data Attributes**

#### Update BoardItem.tsx to add data-attributes:
```tsx
// Patient Context component
const PatientContext = ({ data }) => (
  <Container>
    <Section data-focus-id="patient">
      <Name data-focus-id="patient.name">{data.patient.name}</Name>
      <Age data-focus-id="patient.age">{data.patient.age}</Age>
    </Section>
    
    <Section data-focus-id="medications">
      {data.medication_timeline.map((med, idx) => (
        <MedItem 
          key={idx}
          data-focus-id={`medications.${med.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {med.name}
        </MedItem>
      ))}
    </Section>
    
    <Section data-focus-id="allergies">
      {data.allergies.map((allergy, idx) => (
        <AllergyItem 
          key={idx}
          data-focus-id={`allergies.${idx}`}
        >
          {allergy}
        </AllergyItem>
      ))}
    </Section>
  </Container>
);
```

### Phase 2: **Enhanced Focus Function**

#### Update Canvas.tsx:
```typescript
const centerOnSubElement = useCallback((
  itemId: string, 
  subElementPath?: string,
  options = {
    zoom: 1.5,
    highlight: true,
    duration: 2000,
    scrollIntoView: true
  }
) => {
  const item = items.find((i) => i.id === itemId);
  if (!item || !canvasRef.current) return;

  let targetElement: HTMLElement | null = null;
  let targetBounds = { x: item.x, y: item.y, width: item.width, height: item.height };

  // Find sub-element if specified
  if (subElementPath) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    const subElement = itemElement?.querySelector(`[data-focus-id="${subElementPath}"]`);
    
    if (subElement) {
      targetElement = subElement as HTMLElement;
      const rect = subElement.getBoundingClientRect();
      const itemRect = itemElement!.getBoundingClientRect();
      
      // Calculate sub-element position relative to item
      const relativeX = rect.left - itemRect.left;
      const relativeY = rect.top - itemRect.top;
      
      targetBounds = {
        x: item.x + relativeX,
        y: item.y + relativeY,
        width: rect.width,
        height: rect.height
      };
    }
  }

  // Highlight the element
  if (options.highlight && targetElement) {
    targetElement.classList.add('focus-highlighted');
    setTimeout(() => {
      targetElement?.classList.remove('focus-highlighted');
    }, options.duration + 1000);
  }

  // Center on the calculated bounds
  const container = canvasRef.current.parentElement;
  if (!container) return;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const targetCenterX = targetBounds.x + targetBounds.width / 2;
  const targetCenterY = targetBounds.y + targetBounds.height / 2;

  const finalViewportX = (containerWidth / 2) - targetCenterX * options.zoom;
  const finalViewportY = (containerHeight / 2) - targetCenterY * options.zoom;

  // Animate to target
  animateViewport(
    { x: finalViewportX, y: finalViewportY, zoom: options.zoom },
    options.duration
  );
}, [items, canvasRef, animateViewport]);
```

### Phase 3: **Update API Endpoint**

#### Update server-redis.js:
```javascript
// Enhanced POST /api/focus endpoint
app.post('/api/focus', (req, res) => {
  const { objectId, subElement, focusOptions } = req.body;
  
  if (!objectId) {
    return res.status(400).json({ error: 'objectId is required' });
  }
  
  const defaultOptions = {
    zoom: subElement ? 1.5 : 0.8,  // Higher zoom for sub-elements
    highlight: !!subElement,
    duration: 2000,
    scrollIntoView: true
  };
  
  const options = { ...defaultOptions, ...focusOptions };
  
  console.log(`🎯 Focus request: ${objectId}${subElement ? `#${subElement}` : ''}`);
  
  const payload = { 
    objectId, 
    subElement,
    focusOptions: options,
    timestamp: new Date().toISOString() 
  };
  
  broadcastSSE({ event: 'focus-item', ...payload });
  
  res.json({ 
    success: true, 
    message: `Focusing on ${objectId}${subElement ? `#${subElement}` : ''}`,
    objectId,
    subElement,
    focusOptions: options
  });
});
```

### Phase 4: **Update App.tsx Handler**

```typescript
// Update handleFocusRequest in App.tsx
const handleFocusRequest = useCallback((request) => {
  console.log('🎯 Focus request received:', request);
  
  const item = items.find(i => i.id === request.objectId);
  if (item) {
    console.log('✅ Item found, focusing:', item.id, item.type);
    
    // First select the item
    focusOnItem(request.objectId);
    
    // Then center on item or sub-element
    if ((window as any).centerOnSubElement) {
      (window as any).centerOnSubElement(
        request.objectId,
        request.subElement,
        request.focusOptions
      );
    }
  } else {
    console.error('❌ Item not found:', request.objectId);
  }
}, [items, focusOnItem]);
```

---

## 📊 Comparison Table

| Feature | Current (RED) | Enhanced (GREEN) |
|---------|---------------|------------------|
| **Focus Target** | Entire item only | Item + Sub-elements |
| **Zoom Control** | Fixed (0.8x) | Dynamic (0.5x - 2.0x) |
| **Highlight** | No | Yes, with pulse animation |
| **Precision** | Low (whole component) | High (specific elements) |
| **Voice Command** | "Focus on patient context" | "Focus on methotrexate medication" |
| **API Data** | `{objectId}` | `{objectId, subElement, options}` |

---

## 🎤 Voice Command Examples

### Current System (RED):
```
✅ "Focus on patient context"           → Centers entire component
✅ "Focus on encounter timeline"        → Centers entire component
❌ "Focus on diagnosis"                 → Cannot target
❌ "Focus on methotrexate medication"   → Cannot target
❌ "Show me the allergies"              → Cannot target
```

### Enhanced System (GREEN):
```
✅ "Focus on patient context"           → Centers entire component
✅ "Focus on patient name"              → Zooms to name field (1.5x)
✅ "Focus on methotrexate medication"   → Highlights med + zooms (1.8x)
✅ "Show me the allergies"              → Scrolls + highlights allergies section
✅ "Focus on diagnosis in encounter 1"  → Zooms to specific encounter diagnosis
✅ "Show lisinopril details"            → Finds and highlights lisinopril
```

---

## 🚀 Voice Server Updates Needed

### Current Voice Command Processing:
```python
# api2.medforce-ai.com
def process_voice_command(text):
    if "focus on patient context" in text:
        send_focus_request("dashboard-item-patientcontext-1234")
```

### Enhanced Voice Command Processing:
```python
# api2.medforce-ai.com
def process_voice_command(text):
    # Simple item focus
    if "focus on patient context" in text:
        send_focus_request(
            object_id="dashboard-item-patientcontext-1234"
        )
    
    # Sub-element focus with higher precision
    elif "focus on methotrexate" in text:
        send_focus_request(
            object_id="dashboard-item-patientcontext-1234",
            sub_element="medications.methotrexate",
            options={"zoom": 1.8, "highlight": True}
        )
    
    elif "show allergies" in text:
        send_focus_request(
            object_id="dashboard-item-patientcontext-1234",
            sub_element="allergies",
            options={"zoom": 1.5, "highlight": True}
        )
    
    elif "diagnosis" in text and "encounter" in text:
        encounter_num = extract_number(text)
        send_focus_request(
            object_id=f"dashboard-item-encountertimeline-456",
            sub_element=f"encounter_{encounter_num}.diagnosis",
            options={"zoom": 1.6, "highlight": True}
        )

def send_focus_request(object_id, sub_element=None, options=None):
    payload = {
        "objectId": object_id,
        "subElement": sub_element,
        "focusOptions": options or {}
    }
    requests.post(
        "https://board-v4-working.vercel.app/api/focus",
        json=payload
    )
```

---

## 🎨 CSS for Highlight Effect

Add to your global styles:

```css
/* Highlight animation for focused sub-elements */
.focus-highlighted {
  position: relative;
  animation: focusPulse 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6);
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  z-index: 1000;
}

@keyframes focusPulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
  }
}
```

---

## 📝 Implementation Checklist

### Backend (Vercel API):
- [ ] Update `/api/focus` endpoint to accept `subElement` and `focusOptions`
- [ ] Update SSE broadcast to include new fields
- [ ] Test endpoint with curl/Postman

### Frontend (React):
- [ ] Add `data-focus-id` attributes to all sub-elements
- [ ] Implement `centerOnSubElement` function
- [ ] Update `handleFocusRequest` to use new function
- [ ] Add CSS for highlight animation
- [ ] Test with manual SSE events

### Voice Server (api2.medforce-ai.com):
- [ ] Update voice command parsing for sub-elements
- [ ] Implement `send_focus_request` with new parameters
- [ ] Add command mappings for common sub-elements
- [ ] Test end-to-end voice commands

---

## 🧪 Testing Commands

```bash
# Test basic focus (current system)
curl -X POST https://board-v4-working.vercel.app/api/focus \
  -H "Content-Type: application/json" \
  -d '{"objectId": "dashboard-item-patientcontext-1234"}'

# Test sub-element focus (enhanced system)
curl -X POST https://board-v4-working.vercel.app/api/focus \
  -H "Content-Type: application/json" \
  -d '{
    "objectId": "dashboard-item-patientcontext-1234",
    "subElement": "medications.methotrexate",
    "focusOptions": {
      "zoom": 1.8,
      "highlight": true,
      "duration": 2000
    }
  }'
```

---

## 🎯 Expected Outcome

### Before (RED - Current):
![Current Focus Level - Entire Component]

### After (GREEN - Enhanced):
![Enhanced Focus Level - Sub-Element Precision]

With the enhanced system, you'll be able to:
1. ✅ Focus on entire components (backward compatible)
2. ✅ Focus on specific sections within components
3. ✅ Focus on individual data items (medications, allergies, etc.)
4. ✅ Control zoom level dynamically
5. ✅ Highlight focused elements with animation
6. ✅ Use natural voice commands for precision targeting

---

**Created**: October 15, 2025  
**Status**: 📋 Design Complete - Ready for Implementation
