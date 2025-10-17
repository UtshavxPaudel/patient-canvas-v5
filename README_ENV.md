# 📚 Vercel Environment Management - Complete Overview

## 🎯 What You Have Now

### 1. Documentation Files
- ✅ **VERCEL_ENV_SETUP.md** - Comprehensive guide for environment variables
- ✅ **QUICK_START.md** - Quick reference for deployment
- ✅ **.env.example** - Template showing required variables

### 2. Automation Scripts
- ✅ **setup-vercel-env.ps1** - Interactive environment setup
- ✅ **deploy-to-vercel.ps1** - Enhanced deployment script

### 3. Configuration Files
- ✅ **.env** - Your local environment (already exists)
- ✅ **vercel.json** - Vercel platform configuration
- ✅ **.gitignore** - Properly configured to exclude .env files

---

## 🚀 Quick Start (Copy-Paste Commands)

### First Time Deployment
```powershell
# 1. Setup environment variables
./setup-vercel-env.ps1

# 2. Deploy to Vercel
./deploy-to-vercel.ps1

# 3. Copy the URL you get (e.g., https://board-v4-working-abc123.vercel.app)

# 4. Update API URL with your actual deployment URL
./setup-vercel-env.ps1
# Choose option 1, enter your deployment URL

# 5. Redeploy with updated URL
vercel --prod
```

---

## 🔐 Environment Variables You Need

### For Local Development (.env)
```properties
FAST_REFRESH=false
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
REACT_APP_GCP_PROJECT_NUMBER=16771232505
REACT_APP_API_BASE_URL=http://localhost:3001
```

### For Vercel Production
Set these in Vercel dashboard or using `setup-vercel-env.ps1`:
```properties
REACT_APP_GCP_PROJECT_NUMBER=16771232505
REACT_APP_API_BASE_URL=https://your-actual-vercel-url.vercel.app
```

---

## 🛠️ Three Ways to Manage Environment Variables

### Method 1: Using Helper Script (Easiest) ⭐
```powershell
./setup-vercel-env.ps1
```
Interactive menu with options for:
- Setting up variables
- Pulling variables from Vercel
- Listing all variables
- Quick first-time setup

### Method 2: Using Vercel Dashboard (Visual)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add/Edit variables
5. Redeploy

### Method 3: Using Vercel CLI (Advanced)
```powershell
# Add variable
vercel env add REACT_APP_GCP_PROJECT_NUMBER production

# List variables
vercel env ls

# Pull to local
vercel env pull .env.vercel

# Remove variable
vercel env rm VARIABLE_NAME production
```

---

## 📋 Deployment Checklist

### Before First Deployment
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Review your `.env` file

### First Deployment
- [ ] Run `./setup-vercel-env.ps1` (option 6 - Quick setup)
- [ ] Run `./deploy-to-vercel.ps1`
- [ ] Copy your deployment URL
- [ ] Update `REACT_APP_API_BASE_URL` in Vercel
- [ ] Redeploy: `vercel --prod`
- [ ] Test the deployed application

### Regular Deployments
- [ ] Make code changes
- [ ] Test locally: `npm start`
- [ ] Deploy: `vercel --prod`
- [ ] Verify deployment

---

## 🎓 Understanding Environment Variables

### Frontend Variables (REACT_APP_*)
- Must start with `REACT_APP_`
- Available in browser/React code
- Set at BUILD time
- Examples: `REACT_APP_API_BASE_URL`, `REACT_APP_GCP_PROJECT_NUMBER`

### Backend Variables
- Available only in API routes (`/api/*.js`)
- Not accessible in frontend
- Examples: `REDIS_URL`, `DATABASE_URL`

### Important Notes
- ⚠️ Changing env variables requires REDEPLOYING
- ⚠️ Frontend variables are PUBLIC (visible in browser)
- ⚠️ Never put secrets in REACT_APP_* variables
- ✅ Different values for Production/Preview/Development

---

## 🔄 Common Workflows

### Deploy New Changes
```powershell
# Quick deploy
vercel --prod

# Or use script
./deploy-to-vercel.ps1
```

### Update Environment Variable
```powershell
# Method 1: Using script
./setup-vercel-env.ps1  # Option 1

# Method 2: Using CLI
vercel env add VARIABLE_NAME production

# Method 3: Use dashboard
# Visit vercel.com/dashboard

# IMPORTANT: Redeploy after changing variables!
vercel --prod
```

### Sync Local with Vercel
```powershell
# Pull from Vercel to local
vercel env pull .env.vercel

# Check what's in Vercel
vercel env ls
```

### Debug Environment Issues
```powershell
# 1. Check what variables are set
vercel env ls

# 2. Pull to local to inspect
vercel env pull .env.debug

# 3. View the file
cat .env.debug

# 4. Compare with .env.example
```

---

## 🐛 Troubleshooting Guide

### Problem: "Environment variables not found"
```powershell
# Solution: Set them up
./setup-vercel-env.ps1
```

### Problem: "API calls returning 404"
```powershell
# Solution: Check REACT_APP_API_BASE_URL matches deployment
vercel env ls
# Update if needed, then redeploy
vercel --prod
```

### Problem: "Changes not showing up"
```powershell
# Solution: Force rebuild
vercel --prod --force
```

### Problem: "Build failing"
```powershell
# Solution: Check build logs
vercel logs

# Ensure all required variables are set
vercel env ls
```

---

## 📁 File Structure

```
board-v4-working/
├── .env                      # Local environment (DO NOT commit)
├── .env.example              # Template (commit this)
├── .gitignore                # Configured to exclude .env files
├── vercel.json               # Vercel configuration
├── deploy-to-vercel.ps1      # Deployment script
├── setup-vercel-env.ps1      # Environment setup script
├── VERCEL_ENV_SETUP.md       # Detailed guide
├── QUICK_START.md            # Quick reference
└── README_ENV.md             # This file
```

---

## 🎯 Best Practices

### ✅ Do's
- Use `.env.example` to document required variables
- Set different values for production/preview/development
- Use Vercel dashboard for sensitive values
- Redeploy after changing environment variables
- Test in preview before deploying to production
- Keep local `.env` in sync with documentation

### ❌ Don'ts
- Don't commit `.env` files to Git
- Don't put secrets in `REACT_APP_*` variables
- Don't assume changes work without redeploying
- Don't use the same API URL for local and production
- Don't share `.env` files directly

---

## 🔗 Resources

### Documentation
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Create React App - Adding Custom Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

### Your Project Docs
- **Detailed Guide**: `VERCEL_ENV_SETUP.md`
- **Quick Start**: `QUICK_START.md`
- **Template**: `.env.example`

### Get Help
```powershell
# Vercel CLI help
vercel --help
vercel env --help

# Open documentation
start https://vercel.com/docs
```

---

## 📞 Need More Help?

1. **Check the guides**
   - `VERCEL_ENV_SETUP.md` - Detailed explanations
   - `QUICK_START.md` - Quick commands

2. **Use the scripts**
   - `./setup-vercel-env.ps1` - Interactive helper
   - `./deploy-to-vercel.ps1` - Guided deployment

3. **Vercel Resources**
   - Dashboard: https://vercel.com/dashboard
   - Documentation: https://vercel.com/docs
   - Support: https://vercel.com/support

---

**Created**: October 15, 2025  
**Last Updated**: October 15, 2025  
**Status**: ✅ Ready for deployment
