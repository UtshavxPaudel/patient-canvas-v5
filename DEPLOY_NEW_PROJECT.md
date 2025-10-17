# 🚀 Deploy to New Vercel Project - Quick Guide

## ✅ Changes Made

1. **Updated API URL** in `MeetSidePanel.tsx`:
   - Changed from: `https://api2.medforce-ai.com`
   - Changed to: `https://api3.medforce-ai.com`

2. **Created deployment script**: `deploy-new-project.ps1`

---

## 🚀 Deploy to New Project (3 Steps)

### Step 1: Build the Project
```powershell
cd d:\Office_work\EASL\demofinal\board-v4-working
npm run build
```

### Step 2: Deploy to New Vercel Project
```powershell
# This will create a NEW project (not update existing one)
vercel --prod --yes

# When prompted:
# - Set up and deploy? → Y
# - Which scope? → Choose your account
# - Link to existing project? → N (create new)
# - Project name? → Press Enter or type new name
# - Directory? → Press Enter
# - Override settings? → N
```

### Step 3: Set Environment Variables
```powershell
# After deployment, copy your new URL
# Example: https://board-v4-working-abc123.vercel.app

# Set environment variables
Write-Output "false" | vercel env add CI production
Write-Output "16771232505" | vercel env add REACT_APP_GCP_PROJECT_NUMBER production
Write-Output "https://YOUR-NEW-URL.vercel.app" | vercel env add REACT_APP_API_BASE_URL production

# Redeploy with new env vars
vercel --prod --yes
```

---

## 🎯 Quick One-Liner Deployment

```powershell
# Navigate to project
cd d:\Office_work\EASL\demofinal\board-v4-working

# Build and deploy to new project
npm run build && vercel --prod --yes

# After you get the URL, set it and redeploy:
# vercel env add REACT_APP_API_BASE_URL production
# (paste your URL when prompted)
# vercel --prod --yes
```

---

## 🔧 Environment Variables Needed

| Variable | Value | Purpose |
|----------|-------|---------|
| `CI` | `false` | Prevent build warnings from failing |
| `REACT_APP_GCP_PROJECT_NUMBER` | `16771232505` | Google Meet integration |
| `REACT_APP_API_BASE_URL` | Your Vercel URL | API endpoint for canvas |

---

## 📋 Post-Deployment Checklist

After deployment:

- [ ] Copy your new Vercel URL
- [ ] Set `REACT_APP_API_BASE_URL` environment variable
- [ ] Redeploy: `vercel --prod --yes`
- [ ] Test canvas at new URL
- [ ] Test API endpoints:
  - `/api/health`
  - `/api/board-items`
  - `/api/focus`
- [ ] Update voice server to use new canvas URL
- [ ] Update Google Meet manifest if needed

---

## 🧪 Test After Deployment

```powershell
# Test health endpoint
curl https://YOUR-NEW-URL.vercel.app/api/health

# Test board items
curl https://YOUR-NEW-URL.vercel.app/api/board-items

# Test focus endpoint
curl -X POST https://YOUR-NEW-URL.vercel.app/api/focus `
  -H "Content-Type: application/json" `
  -d '{"objectId": "dashboard-item-1759853783245-patient-context"}'
```

---

## 🔗 Update Voice Server

After deploying, update your voice server at `api3.medforce-ai.com` to use the new canvas URL:

```python
# Update this in your voice server code:
CANVAS_API_URL = "https://YOUR-NEW-URL.vercel.app"

# Example:
def send_focus_request(object_id, sub_element=None, zoom=None):
    payload = {"objectId": object_id}
    if sub_element:
        payload["subElement"] = sub_element
        payload["focusOptions"] = {"zoom": zoom or 1.5, "highlight": True}
    
    requests.post(f"{CANVAS_API_URL}/api/focus", json=payload)
```

---

## 🎯 Summary

**What changed:**
- ✅ API URL: `api2.medforce-ai.com` → `api3.medforce-ai.com`
- ✅ Ready for new Vercel project deployment

**What to do:**
1. Run: `npm run build && vercel --prod --yes`
2. Copy new URL
3. Set environment variables
4. Redeploy
5. Update voice server with new canvas URL

---

**Created**: October 17, 2025  
**API**: https://api3.medforce-ai.com  
**Status**: ✅ Ready to deploy
