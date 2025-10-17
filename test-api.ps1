# 🧪 API Testing Script for Canvas Board
# Tests all API endpoints on Vercel deployment

$baseUrl = "https://demofinal-blue.vercel.app"

Write-Host ""
Write-Host "🧪 Canvas Board API Testing" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Root API endpoint
Write-Host "1️⃣ Testing /api (Root endpoint)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   API Name: $($json.name)" -ForegroundColor Gray
    Write-Host "   Version: $($json.version)" -ForegroundColor Gray
    Write-Host "   Status: $($json.status)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Available Endpoints:" -ForegroundColor Cyan
    $json.endpoints.PSObject.Properties | ForEach-Object {
        Write-Host "   • $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Health check
Write-Host "2️⃣ Testing /api/health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Status: $($json.status)" -ForegroundColor Gray
    Write-Host "   Redis: $($json.redis)" -ForegroundColor Gray
    Write-Host "   Storage: $($json.storage)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($json.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Board items
Write-Host "3️⃣ Testing /api/board-items..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/board-items" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Items count: $($json.count)" -ForegroundColor Gray
    if ($json.count -gt 0) {
        Write-Host "   First item ID: $($json.items[0].id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Frontend
Write-Host "4️⃣ Testing Frontend (/)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible!" -ForegroundColor Green
        Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ If all tests passed, your deployment is working!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   • Frontend: $baseUrl" -ForegroundColor Gray
Write-Host "   • API Docs: $baseUrl/api" -ForegroundColor Gray
Write-Host "   • Health: $baseUrl/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open frontend in browser: start $baseUrl" -ForegroundColor Gray
Write-Host "   2. Check browser console for any errors" -ForegroundColor Gray
Write-Host "   3. Test canvas functionality" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 If tests failed:" -ForegroundColor Yellow
Write-Host "   1. Check environment variables: vercel env ls" -ForegroundColor Gray
Write-Host "   2. Verify REACT_APP_API_BASE_URL is set correctly" -ForegroundColor Gray
Write-Host "   3. Redeploy: vercel --prod --force" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Testing complete!" -ForegroundColor Magenta
Write-Host ""
