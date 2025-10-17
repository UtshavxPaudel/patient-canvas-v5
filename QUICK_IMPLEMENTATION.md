# 🚀 Quick Start: Implement Sub-Element Focus

## TL;DR - What You Need to Do

Your voice AI at `api2.medforce-ai.com` should send this instead:

**OLD (Current):**
```json
POST /api/focus
{
  "objectId": "dashboard-item-patientcontext-1234"
}
```

**NEW (Enhanced):**
```json
POST /api/focus
{
  "objectId": "dashboard-item-patientcontext-1234",
  "subElement": "medications.methotrexate",
  "focusOptions": {
    "zoom": 1.8,
    "highlight": true
  }
}
```

---

## Step-by-Step Implementation (30 minutes)

### Step 1: Update Vercel API (5 min)
File: `board-v4-working/api/server-redis.js`

**Replace the `/api/focus` endpoint with:**

```javascript
// POST /api/focus - Enhanced with sub-element support
app.post('/api/focus', (req, res) => {
  const { objectId, subElement, focusOptions } = req.body;
  
  if (!objectId) {
    return res.status(400).json({ error: 'objectId is required' });
  }
  
  // Default options
  const defaultOptions = {
    zoom: subElement ? 1.5 : 0.8,  // Higher zoom for sub-elements
    highlight: !!subElement,
    duration: 2000,
    scrollIntoView: true
  };
  
  const options = { ...defaultOptions, ...(focusOptions || {}) };
  
  console.log(`🎯 Focus request: ${objectId}${subElement ? `#${subElement}` : ''}`);
  
  const payload = { 
    objectId, 
    subElement: subElement || null,
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

Deploy:
```bash
vercel --prod
```

---

### Step 2: Update Voice Server (10 min)
File: `api2.medforce-ai.com/voice_processor.py` (or similar)

**Add this function:**

```python
import requests

CANVAS_API = "https://board-v4-working.vercel.app"

def send_focus_request(object_id, sub_element=None, zoom=None, highlight=True):
    """
    Send focus request to canvas API
    
    Args:
        object_id: ID of the board item
        sub_element: Optional sub-element path (e.g., "medications.methotrexate")
        zoom: Optional zoom level (default: 1.5 for sub-elements, 0.8 for items)
        highlight: Whether to highlight the element
    """
    payload = {
        "objectId": object_id
    }
    
    if sub_element:
        payload["subElement"] = sub_element
        payload["focusOptions"] = {
            "zoom": zoom or 1.5,
            "highlight": highlight,
            "duration": 2000
        }
    
    try:
        response = requests.post(
            f"{CANVAS_API}/api/focus",
            json=payload,
            timeout=5
        )
        response.raise_for_status()
        print(f"✅ Focus sent: {object_id}#{sub_element or 'whole-item'}")
        return response.json()
    except Exception as e:
        print(f"❌ Focus failed: {e}")
        return None

# Example usage in your voice command handler:
def process_voice_command(transcript):
    text = transcript.lower()
    
    # Whole item focus
    if "patient context" in text:
        send_focus_request("dashboard-item-1759853783245-patient-context")
    
    # Sub-element focus - medications
    elif "methotrexate" in text or "medication" in text:
        send_focus_request(
            object_id="dashboard-item-1759853783245-patient-context",
            sub_element="medications.methotrexate",
            zoom=1.8
        )
    
    # Sub-element focus - allergies
    elif "allergies" in text or "allergy" in text:
        send_focus_request(
            object_id="dashboard-item-1759853783245-patient-context",
            sub_element="allergies",
            zoom=1.5
        )
    
    # Timeline encounter focus
    elif "encounter" in text and "timeline" in text:
        send_focus_request("dashboard-item-1759906076097-encounter-timeline")
```

---

### Step 3: Add Data Attributes to React Components (10 min)

**Example: Update PatientContext.tsx**

Find the component and add `data-focus-id` attributes:

```tsx
// Before
<div>
  <h3>{patient.name}</h3>
  <div>{medication.name}</div>
</div>

// After
<div data-focus-id="patient">
  <h3 data-focus-id="patient.name">{patient.name}</h3>
</div>

<div data-focus-id="medications">
  {medications.map((med, idx) => (
    <div 
      key={idx}
      data-focus-id={`medications.${med.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {med.name}
    </div>
  ))}
</div>

<div data-focus-id="allergies">
  {allergies.map((allergy, idx) => (
    <div 
      key={idx}
      data-focus-id={`allergies.${idx}`}
    >
      {allergy}
    </div>
  ))}
</div>
```

---

### Step 4: Update App.tsx Handler (5 min)

Find `handleFocusRequest` and update it:

```typescript
const handleFocusRequest = useCallback((request) => {
  console.log('🎯 Focus request received:', request);
  
  const item = items.find(i => i.id === request.objectId);
  if (item) {
    console.log('✅ Item found, focusing:', item.id, item.type);
    
    // Select the item
    focusOnItem(request.objectId);
    
    // Center with options
    if ((window as any).centerOnItem) {
      const zoom = request.focusOptions?.zoom || 0.8;
      const duration = request.focusOptions?.duration || 3000;
      
      (window as any).centerOnItem(request.objectId, zoom, duration);
      
      // If sub-element specified, highlight it after animation
      if (request.subElement && request.focusOptions?.highlight) {
        setTimeout(() => {
          const itemElement = document.querySelector(`[data-item-id="${request.objectId}"]`);
          const subElement = itemElement?.querySelector(`[data-focus-id="${request.subElement}"]`);
          
          if (subElement) {
            subElement.classList.add('focus-highlighted');
            setTimeout(() => {
              subElement.classList.remove('focus-highlighted');
            }, 2000);
          }
        }, duration);
      }
    }
  } else {
    console.error('❌ Item not found:', request.objectId);
  }
}, [items, focusOnItem]);
```

---

### Step 5: Add CSS for Highlighting

Add to `index.css`:

```css
/* Sub-element focus highlight */
.focus-highlighted {
  position: relative;
  animation: focusPulse 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6) !important;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1) !important;
  z-index: 1000;
  transition: all 0.3s ease;
}

@keyframes focusPulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
    transform: scale(1.02);
  }
}
```

---

## 🧪 Quick Test

### Test 1: Basic Focus (should still work)
```bash
curl -X POST https://board-v4-working.vercel.app/api/focus \
  -H "Content-Type: application/json" \
  -d '{"objectId": "dashboard-item-1759853783245-patient-context"}'
```

### Test 2: Sub-element Focus (new feature)
```bash
curl -X POST https://board-v4-working.vercel.app/api/focus \
  -H "Content-Type: application/json" \
  -d '{
    "objectId": "dashboard-item-1759853783245-patient-context",
    "subElement": "medications",
    "focusOptions": {
      "zoom": 1.5,
      "highlight": true
    }
  }'
```

---

## 📋 Common Sub-Element Paths

For your voice AI to use:

```python
# Patient Context sub-elements
SUB_ELEMENTS = {
    "patient_name": "patient.name",
    "patient_age": "patient.age",
    "medications": "medications",
    "medication_methotrexate": "medications.methotrexate",
    "medication_folic_acid": "medications.folic-acid",
    "medication_lisinopril": "medications.lisinopril",
    "allergies": "allergies",
    "diagnosis": "diagnosis",
    "problem_list": "problem_list"
}

# Use in voice processing:
if "show me methotrexate" in text:
    send_focus_request(
        "dashboard-item-1759853783245-patient-context",
        SUB_ELEMENTS["medication_methotrexate"],
        zoom=1.8
    )
```

---

## ✅ Done!

After these changes:
- ✅ Voice AI can focus on entire items (backward compatible)
- ✅ Voice AI can focus on specific sub-elements
- ✅ Higher zoom for better precision
- ✅ Visual highlighting for focused elements
- ✅ Smooth animations

**Total implementation time: ~30 minutes**

Deploy and test! 🚀
