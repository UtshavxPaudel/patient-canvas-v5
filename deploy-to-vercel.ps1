# 🚀 Quick Vercel Deployment Script

Write-Host "🚀 Deploying Canvas Board to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Navigate to the correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "� Checking environment variables setup..." -ForegroundColor Yellow
$vercelEnvExists = $false
try {
    $envList = vercel env ls 2>&1
    if ($envList -match "REACT_APP_GCP_PROJECT_NUMBER") {
        $vercelEnvExists = $true
        Write-Host "✅ Environment variables are configured" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not check environment variables" -ForegroundColor Yellow
}

if (-not $vercelEnvExists) {
    Write-Host "⚠️  Environment variables may not be set up!" -ForegroundColor Yellow
    Write-Host "   Run ./setup-vercel-env.ps1 to configure them" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue deployment anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "�📋 Deployment options:" -ForegroundColor Cyan
Write-Host "1. Deploy to production (recommended)"
Write-Host "2. Deploy to preview"
Write-Host "3. Skip deployment"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
        vercel --prod
        Write-Host ""
        Write-Host "✅ Deployment complete!" -ForegroundColor Green
        Write-Host "🌐 Your API is now live at: https://board-inky-seven.vercel.app/api/" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying to preview..." -ForegroundColor Cyan
        vercel
        Write-Host ""
        Write-Host "✅ Preview deployment complete!" -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        Write-Host "⏭️  Skipping deployment" -ForegroundColor Yellow
    }
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. 🔐 Setup/Update env variables: ./setup-vercel-env.ps1"
Write-Host "2. 🧪 Test API: curl https://your-app.vercel.app/api/health"
Write-Host "3. 📊 Test board data: curl https://your-app.vercel.app/api/board-items"
Write-Host "4. 🎤 Run voice controller: cd ..\python_meet_client && python voice_canvas_function_calling.py"
Write-Host ""
Write-Host "💡 Important: Update REACT_APP_API_BASE_URL in Vercel dashboard with your deployment URL" -ForegroundColor Yellow
Write-Host "   Then redeploy for changes to take effect" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Happy coding!" -ForegroundColor Magenta
