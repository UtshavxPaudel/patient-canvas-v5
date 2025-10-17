# 🔐 Vercel Environment Variables Setup Guide

## 📋 Overview
This guide explains how to manage environment variables for your Canvas Board application deployed on Vercel.

## 🌍 Environment Variables Needed

### For React Frontend (REACT_APP_*)
```
REACT_APP_GCP_PROJECT_NUMBER=16771232505
REACT_APP_API_BASE_URL=https://your-app.vercel.app
```

### For Backend API (Optional)
```
REDIS_URL=your-redis-url (if using Redis)
PORT=3001 (automatically set by Vercel)
```

---

## 🚀 Method 1: Using Vercel Dashboard (Recommended)

### Step 1: Access Your Project Settings
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (e.g., `board-v4-working`)
3. Click on **Settings** tab
4. Navigate to **Environment Variables** section

### Step 2: Add Environment Variables
For each variable:
1. Click **Add New**
2. Enter **Key**: `REACT_APP_GCP_PROJECT_NUMBER`
3. Enter **Value**: `16771232505`
4. Select environments:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
5. Click **Save**

Repeat for:
- `REACT_APP_API_BASE_URL` = `https://your-deployed-url.vercel.app`

### Step 3: Redeploy
After adding variables, trigger a new deployment:
```bash
vercel --prod
```

---

## 🔧 Method 2: Using Vercel CLI

### Option A: Interactive Setup
```powershell
# Set environment variable for production
vercel env add REACT_APP_GCP_PROJECT_NUMBER production

# When prompted, enter: 16771232505

# Set for preview
vercel env add REACT_APP_GCP_PROJECT_NUMBER preview

# Set for development
vercel env add REACT_APP_GCP_PROJECT_NUMBER development
```

### Option B: Bulk Import from .env file
```powershell
# Pull existing env variables
vercel env pull .env.local

# Or push from .env file (create .env.production first)
vercel env add
```

---

## 📝 Method 3: Using PowerShell Script

Create a setup script to automate the process:

```powershell
# setup-vercel-env.ps1

Write-Host "🔐 Setting up Vercel Environment Variables..." -ForegroundColor Cyan

# Production variables
vercel env add REACT_APP_GCP_PROJECT_NUMBER production
# Enter: 16771232505

vercel env add REACT_APP_API_BASE_URL production
# Enter: https://your-app.vercel.app

Write-Host "✅ Environment variables configured!" -ForegroundColor Green
```

---

## 🌐 Important Notes

### 1. **REACT_APP_API_BASE_URL** Must Match Deployment URL
After first deployment:
1. Copy your Vercel URL (e.g., `https://board-v4-working.vercel.app`)
2. Update `REACT_APP_API_BASE_URL` to this URL
3. Redeploy

### 2. **Environment Variable Availability**
- **Build-time variables** (REACT_APP_*): Available during `npm run build`
- **Runtime variables**: Available in API routes only

### 3. **Security Best Practices**
- ❌ **Never commit** `.env` files to Git
- ✅ Add `.env*` to `.gitignore`
- ✅ Use Vercel dashboard for sensitive data
- ✅ Different values for Production vs Preview

---

## 🔄 Quick Reference Commands

```powershell
# List all environment variables
vercel env ls

# Pull env variables to local .env file
vercel env pull .env.local

# Remove an environment variable
vercel env rm VARIABLE_NAME production

# Deploy with environment variables
vercel --prod
```

---

## 📋 Current Configuration

### Local Development (.env)
```properties
FAST_REFRESH=false
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
REACT_APP_GCP_PROJECT_NUMBER=16771232505
REACT_APP_API_BASE_URL=http://localhost:3001
```

### Production (Vercel)
```properties
REACT_APP_GCP_PROJECT_NUMBER=16771232505
REACT_APP_API_BASE_URL=https://your-app.vercel.app
```

---

## 🐛 Troubleshooting

### Issue: Environment variables not working
**Solution**: Make sure variables start with `REACT_APP_` for frontend access

### Issue: Variables not updating
**Solution**: Redeploy after changing environment variables
```powershell
vercel --prod --force
```

### Issue: Build fails with undefined variables
**Solution**: Check that all required variables are set in Vercel dashboard

---

## ✅ Deployment Checklist

- [ ] Add `REACT_APP_GCP_PROJECT_NUMBER` to Vercel
- [ ] Deploy once to get URL
- [ ] Update `REACT_APP_API_BASE_URL` with actual Vercel URL
- [ ] Redeploy with correct API URL
- [ ] Test API endpoints
- [ ] Verify environment variables: `vercel env ls`

---

## 🔗 Useful Links

- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

---

## 🎯 Next Steps After Setup

1. **Deploy to Vercel**:
   ```powershell
   ./deploy-to-vercel.ps1
   ```

2. **Verify deployment**:
   - Visit your Vercel URL
   - Check browser console for errors
   - Test API endpoints

3. **Update local .env** if needed:
   ```powershell
   vercel env pull .env.local
   ```

---

**Last Updated**: October 15, 2025
