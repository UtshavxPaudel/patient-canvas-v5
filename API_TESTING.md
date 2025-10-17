# 🧪 API Testing Guide for Vercel Deployment

## 🌐 Your Deployment URL
**Production**: https://demofinal-blue.vercel.app

---

## ✅ Available API Endpoints

### 1. Root API Info
```bash
GET https://demofinal-blue.vercel.app/api
```
Returns information about the API and available endpoints.

**Expected Response**:
```json
{
  "name": "Canvas Board API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-10-15T...",
  "endpoints": {
    "health": "/api/health",
    "boardItems": "/api/board-items",
    "events": "/api/events (SSE)",
    "joinMeeting": "/api/join-meeting"
  }
}
```

### 2. Health Check
```bash
GET https://demofinal-blue.vercel.app/api/health
```
Returns server health status and Redis connection info.

**Expected Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-10-15T...",
  "storage": "redis",
  "redis": "connected"
}
```

### 3. Get Board Items
```bash
GET https://demofinal-blue.vercel.app/api/board-items
```
Returns all canvas board items.

**Expected Response**:
```json
{
  "items": [...],
  "count": 0
}
```

### 4. Server-Sent Events (SSE)
```bash
GET https://demofinal-blue.vercel.app/api/events
```
Stream of real-time updates (SSE connection).

### 5. Join Meeting
```bash
POST https://demofinal-blue.vercel.app/api/join-meeting
Content-Type: application/json

{
  "meetingUrl": "https://meet.google.com/abc-defg-hij"
}
```

---

## 🧪 Testing Methods

### Method 1: Using PowerShell (Windows)
```powershell
# Test root endpoint
Invoke-WebRequest -Uri "https://demofinal-blue.vercel.app/api" | ConvertFrom-Json

# Test health endpoint
Invoke-WebRequest -Uri "https://demofinal-blue.vercel.app/api/health" | ConvertFrom-Json

# Test board items
Invoke-WebRequest -Uri "https://demofinal-blue.vercel.app/api/board-items" | ConvertFrom-Json
```

### Method 2: Using curl (Git Bash or WSL)
```bash
# Test root endpoint
curl https://demofinal-blue.vercel.app/api

# Test health endpoint
curl https://demofinal-blue.vercel.app/api/health

# Test board items
curl https://demofinal-blue.vercel.app/api/board-items
```

### Method 3: Using Browser
Simply visit these URLs in your browser:
- https://demofinal-blue.vercel.app/api
- https://demofinal-blue.vercel.app/api/health
- https://demofinal-blue.vercel.app/api/board-items

### Method 4: Using Postman or Thunder Client
1. Open Postman or VS Code Thunder Client
2. Create GET request
3. URL: `https://demofinal-blue.vercel.app/api/health`
4. Send

---

## 🔧 Quick Test Script

Create a file `test-api.ps1`:

```powershell
# API Testing Script
$baseUrl = "https://demofinal-blue.vercel.app"

Write-Host "🧪 Testing Canvas Board API" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Root endpoint
Write-Host "1️⃣ Testing /api..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "✅ Success! API Name: $($json.name)" -ForegroundColor Green
    Write-Host "   Available endpoints:" -ForegroundColor Gray
    $json.endpoints.PSObject.Properties | ForEach-Object {
        Write-Host "   - $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Health check
Write-Host "2️⃣ Testing /api/health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "✅ Success! Status: $($json.status)" -ForegroundColor Green
    Write-Host "   Redis: $($json.redis)" -ForegroundColor Gray
    Write-Host "   Storage: $($json.storage)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Board items
Write-Host "3️⃣ Testing /api/board-items..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/board-items" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "✅ Success! Items count: $($json.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✨ Testing complete!" -ForegroundColor Magenta
```

Run it:
```powershell
./test-api.ps1
```

---

## 🐛 Common Issues & Solutions

### Issue 1: 404 Not Found on `/api`
**Before Fix**: `/api` returned 404
**After Fix**: Added root endpoint, now returns API info
**Test**: Visit https://demofinal-blue.vercel.app/api

### Issue 2: CORS Errors
**Solution**: API already has CORS enabled
**Verify**: Check browser console for CORS errors

### Issue 3: Environment Variables Not Set
**Solution**: 
```powershell
./setup-vercel-env.ps1
# Set REACT_APP_API_BASE_URL to https://demofinal-blue.vercel.app
# Then redeploy
vercel --prod
```

### Issue 4: Changes Not Reflecting
**Solution**: Force redeploy
```powershell
vercel --prod --force
```

---

## 📋 Checklist After Deployment

- [ ] Test root endpoint: `/api` ✅
- [ ] Test health check: `/api/health`
- [ ] Test board items: `/api/board-items`
- [ ] Verify REACT_APP_API_BASE_URL in Vercel dashboard
- [ ] Check browser console for errors
- [ ] Test SSE events connection
- [ ] Verify Redis connection (if using Redis)

---

## 🚀 Next Steps

1. **Set Environment Variables in Vercel**:
   ```powershell
   ./setup-vercel-env.ps1
   ```
   
2. **Update with your Vercel URL**:
   - Variable: `REACT_APP_API_BASE_URL`
   - Value: `https://demofinal-blue.vercel.app`

3. **Redeploy**:
   ```powershell
   vercel --prod
   ```

4. **Test the application**:
   - Visit: https://demofinal-blue.vercel.app
   - Check API: https://demofinal-blue.vercel.app/api
   - Monitor console for errors

---

## 📊 Expected Behavior

### ✅ Working State
- `/api` returns JSON with API info
- `/api/health` returns status OK
- `/api/board-items` returns items array
- Frontend loads without console errors
- Canvas operations work correctly

### ❌ Broken State (Before Fix)
- `/api` returns 404
- Environment variables not set
- Frontend can't connect to API

---

**Your Deployment**: https://demofinal-blue.vercel.app  
**API Base**: https://demofinal-blue.vercel.app/api  
**Last Updated**: October 15, 2025
