# 🚀 Vercel Deployment - Quick Start Guide

## ⚡ First Time Deployment (3 Steps)

### Step 1: Setup Environment Variables
```powershell
./setup-vercel-env.ps1
```
Choose option **6** (Quick setup)

### Step 2: Deploy to Vercel
```powershell
./deploy-to-vercel.ps1
```
Choose option **1** (Production deployment)

### Step 3: Update API URL
After deployment, you'll get a URL like: `https://board-v4-working-xyz.vercel.app`

**Option A: Using Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project → Settings → Environment Variables
3. Edit `REACT_APP_API_BASE_URL` 
4. Set value to your deployment URL
5. Redeploy: `vercel --prod`

**Option B: Using CLI**
```powershell
./setup-vercel-env.ps1
```
Choose option **1** and enter your Vercel URL

---

## 🔄 Regular Deployments

```powershell
# Quick production deployment
vercel --prod

# Preview deployment (test before production)
vercel

# Force redeploy
vercel --prod --force
```

---

## 🔐 Environment Variables Management

### View all variables
```powershell
vercel env ls
```

### Add a variable
```powershell
vercel env add VARIABLE_NAME production
```

### Pull variables to local
```powershell
vercel env pull .env.vercel
```

### Use the helper script
```powershell
./setup-vercel-env.ps1
```

---

## 📋 Required Environment Variables

| Variable | Value | Where Used |
|----------|-------|------------|
| `REACT_APP_GCP_PROJECT_NUMBER` | `16771232505` | Frontend - Google Meet integration |
| `REACT_APP_API_BASE_URL` | Your Vercel URL | Frontend - API calls |

---

## 🐛 Common Issues

### Issue: App shows errors after deployment
**Fix**: Check if environment variables are set
```powershell
vercel env ls
```

### Issue: API calls failing
**Fix**: Update `REACT_APP_API_BASE_URL` to match your actual Vercel URL

### Issue: Changes not showing
**Fix**: Force redeploy
```powershell
vercel --prod --force
```

### Issue: Environment variables not updating
**Fix**: After changing variables, you MUST redeploy

---

## 📁 Files You Need

✅ Keep these files:
- `.env.example` - Template for environment variables
- `vercel.json` - Vercel configuration
- `deploy-to-vercel.ps1` - Deployment script
- `setup-vercel-env.ps1` - Environment setup script

❌ Never commit:
- `.env` - Your local environment variables
- `.env.local` - Local overrides
- `.env.vercel` - Pulled from Vercel

---

## 🎯 Complete Deployment Workflow

```powershell
# 1. First time only: Setup environment variables
./setup-vercel-env.ps1

# 2. Deploy
./deploy-to-vercel.ps1

# 3. Copy your deployment URL

# 4. Update REACT_APP_API_BASE_URL
./setup-vercel-env.ps1  # Choose option 1

# 5. Redeploy
vercel --prod

# 6. Test
# Visit your Vercel URL in browser
```

---

## 🔗 Helpful Commands

```powershell
# Install/Update Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# View deployment logs
vercel logs

# Open project in browser
vercel --prod --open
```

---

## 📞 Getting Help

- Full guide: See `VERCEL_ENV_SETUP.md`
- Vercel docs: https://vercel.com/docs
- Issue tracker: Create issue in your repository

---

**Last Updated**: October 15, 2025
