# 🔐 Vercel Environment Variables Setup Script
# This script helps you set up environment variables for Vercel deployment

Write-Host "🔐 Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed!" -ForegroundColor Green
    Write-Host ""
}

# Navigate to the correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📋 Current Environment Variables (.env):" -ForegroundColor Yellow
Write-Host ""
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  No .env file found" -ForegroundColor Yellow
}
Write-Host ""

# Menu
Write-Host "🎯 Choose an option:" -ForegroundColor Cyan
Write-Host "1. 📤 Setup environment variables on Vercel (Interactive)"
Write-Host "2. 📥 Pull environment variables from Vercel to local"
Write-Host "3. 📋 List all Vercel environment variables"
Write-Host "4. 🗑️  Remove an environment variable"
Write-Host "5. ℹ️  View setup guide"
Write-Host "6. ⚡ Quick setup (Recommended for first deployment)"
Write-Host "7. ❌ Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📤 Setting up environment variables on Vercel..." -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Setting REACT_APP_GCP_PROJECT_NUMBER..." -ForegroundColor Yellow
        Write-Host "Default value: 16771232505" -ForegroundColor Gray
        Write-Host "Press Enter to use default, or type a new value:" -ForegroundColor Gray
        $gcpValue = Read-Host
        if ([string]::IsNullOrWhiteSpace($gcpValue)) {
            $gcpValue = "16771232505"
        }
        
        Write-Host ""
        Write-Host "Setting for Production..." -ForegroundColor Cyan
        Write-Output $gcpValue | vercel env add REACT_APP_GCP_PROJECT_NUMBER production
        
        Write-Host "Setting for Preview..." -ForegroundColor Cyan
        Write-Output $gcpValue | vercel env add REACT_APP_GCP_PROJECT_NUMBER preview
        
        Write-Host ""
        Write-Host "Setting REACT_APP_API_BASE_URL..." -ForegroundColor Yellow
        Write-Host "⚠️  Important: This should be your Vercel deployment URL" -ForegroundColor Yellow
        Write-Host "Example: https://board-v4-working.vercel.app" -ForegroundColor Gray
        Write-Host "If this is your first deployment, you can update this later" -ForegroundColor Gray
        $apiUrl = Read-Host "Enter your Vercel URL (or press Enter to skip)"
        
        if (-not [string]::IsNullOrWhiteSpace($apiUrl)) {
            Write-Host ""
            Write-Host "Setting for Production..." -ForegroundColor Cyan
            Write-Output $apiUrl | vercel env add REACT_APP_API_BASE_URL production
            
            Write-Host "Setting for Preview..." -ForegroundColor Cyan
            Write-Output $apiUrl | vercel env add REACT_APP_API_BASE_URL preview
        }
        
        Write-Host ""
        Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Next step: Deploy to Vercel" -ForegroundColor Cyan
        Write-Host "   Run: ./deploy-to-vercel.ps1" -ForegroundColor White
    }
    
    "2" {
        Write-Host ""
        Write-Host "📥 Pulling environment variables from Vercel..." -ForegroundColor Cyan
        vercel env pull .env.vercel
        Write-Host ""
        Write-Host "✅ Environment variables saved to .env.vercel" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "📋 Listing all Vercel environment variables..." -ForegroundColor Cyan
        Write-Host ""
        vercel env ls
    }
    
    "4" {
        Write-Host ""
        $varName = Read-Host "Enter the variable name to remove"
        $env = Read-Host "Enter environment (production/preview/development)"
        Write-Host ""
        Write-Host "🗑️  Removing $varName from $env..." -ForegroundColor Yellow
        vercel env rm $varName $env
        Write-Host ""
        Write-Host "✅ Variable removed!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host ""
        Write-Host "📖 Opening setup guide..." -ForegroundColor Cyan
        if (Test-Path "VERCEL_ENV_SETUP.md") {
            code "VERCEL_ENV_SETUP.md"
        } else {
            Write-Host "⚠️  VERCEL_ENV_SETUP.md not found in current directory" -ForegroundColor Yellow
        }
    }
    
    "6" {
        Write-Host ""
        Write-Host "⚡ Quick Setup - First Time Deployment" -ForegroundColor Cyan
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Step 1: Setting basic environment variables..." -ForegroundColor Yellow
        Write-Host ""
        
        # Set GCP Project Number
        $gcpValue = "16771232505"
        Write-Host "Setting REACT_APP_GCP_PROJECT_NUMBER = $gcpValue" -ForegroundColor Gray
        Write-Output $gcpValue | vercel env add REACT_APP_GCP_PROJECT_NUMBER production 2>$null
        Write-Output $gcpValue | vercel env add REACT_APP_GCP_PROJECT_NUMBER preview 2>$null
        
        Write-Host ""
        Write-Host "✅ Basic variables set!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Deploy your app: ./deploy-to-vercel.ps1" -ForegroundColor White
        Write-Host "2. Copy your Vercel deployment URL" -ForegroundColor White
        Write-Host "3. Run this script again (option 1) to set REACT_APP_API_BASE_URL" -ForegroundColor White
        Write-Host "4. Redeploy with the updated URL" -ForegroundColor White
        Write-Host ""
        
        $deploy = Read-Host "Deploy now? (y/n)"
        if ($deploy -eq "y" -or $deploy -eq "Y") {
            Write-Host ""
            if (Test-Path "deploy-to-vercel.ps1") {
                & "./deploy-to-vercel.ps1"
            } else {
                Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
                vercel --prod
            }
        }
    }
    
    "7" {
        Write-Host ""
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Magenta
Write-Host ""
