# 🚀 Deploy to New Vercel Project Script

Write-Host "🚀 Deploying Canvas Board to NEW Vercel Project..." -ForegroundColor Cyan
Write-Host ""

# Navigate to the correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📋 Project Setup" -ForegroundColor Yellow
Write-Host "This will create a NEW Vercel project" -ForegroundColor Gray
Write-Host ""

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
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow

# Set CI=false to avoid build failures
Write-Host "Setting CI=false..." -ForegroundColor Gray
echo "false" | vercel env add CI production 2>$null
echo "false" | vercel env add CI preview 2>$null

# Set GCP Project Number
Write-Host "Setting REACT_APP_GCP_PROJECT_NUMBER..." -ForegroundColor Gray
echo "16771232505" | vercel env add REACT_APP_GCP_PROJECT_NUMBER production 2>$null
echo "16771232505" | vercel env add REACT_APP_GCP_PROJECT_NUMBER preview 2>$null

Write-Host ""
Write-Host "📝 Important: After deployment, you need to:" -ForegroundColor Cyan
Write-Host "1. Copy your deployment URL" -ForegroundColor Yellow
Write-Host "2. Set REACT_APP_API_BASE_URL to that URL" -ForegroundColor Yellow
Write-Host "3. Redeploy" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Ready to deploy? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️ Building and deploying to NEW project..." -ForegroundColor Cyan
Write-Host ""

# Deploy to production (will create new project)
vercel --prod --yes

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy your deployment URL from above" -ForegroundColor White
Write-Host "2. Run: vercel env add REACT_APP_API_BASE_URL production" -ForegroundColor White
Write-Host "   Then paste your URL when prompted" -ForegroundColor Gray
Write-Host "3. Run: vercel --prod --yes" -ForegroundColor White
Write-Host "   To redeploy with the correct API URL" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Your new API uses: https://api3.medforce-ai.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Magenta
