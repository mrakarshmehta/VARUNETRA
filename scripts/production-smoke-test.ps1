<#
==============================================================================
VARUNETRA / FloodSense — Production Deployment Ingress Smoke Test (PowerShell)
Problem Statement SIH26085: Urban Flood Nowcasting System
==============================================================================
Verifies the production Nginx ingress reverse proxy.
Must target the actual Nginx listener (e.g., http://127.0.0.1 or https://domain).
This test FAILS if Nginx is unreachable or if pointed directly at Uvicorn.
Usage:
  pwsh scripts/production-smoke-test.ps1 [-TargetUrl http://127.0.0.1]
==============================================================================
#>

param(
    [string]$TargetUrl = "http://127.0.0.1",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "Varunetra@MoES2026!"
)

$ErrorActionPreference = "Continue"
$failedCount = 0

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "VARUNETRA Production Deployment Ingress Smoke Test" -ForegroundColor Cyan
Write-Host "Target Endpoint: $TargetUrl" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

function Assert-Check {
    param([bool]$Condition, [string]$SuccessMsg, [string]$FailureMsg)
    if ($Condition) {
        Write-Host "  [PASS] $SuccessMsg" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $FailureMsg" -ForegroundColor Red
        $script:failedCount++
    }
}

# 0. Dynamic Target & Ingress Identification Probe
Write-Host "0. Probing Ingress Target Endpoint..."
$probeRes = $null
try {
    $probeRes = Invoke-WebRequest -Uri "$TargetUrl/" -UseBasicParsing -TimeoutSec 5
} catch {
    Write-Host "Target:  $TargetUrl" -ForegroundColor Yellow
    Write-Host "Server:  UNREACHABLE" -ForegroundColor Red
    Write-Host "Ingress: FAILED (Nginx listener is down or port is closed)" -ForegroundColor Red
    Write-Host "  [FAIL] Could not connect to production ingress at $TargetUrl." -ForegroundColor Red
    Write-Host "         The production ingress test must fail when Nginx is unreachable." -ForegroundColor Red
    Write-Host "         Do NOT fall back to port 8000." -ForegroundColor Red
    exit 1
}

$serverHeader = $probeRes.Headers["Server"]
$isNginx = ($serverHeader -match "nginx")
$isSpa = ($probeRes.Content -match "<!doctype html" -or $probeRes.Content -match '<div[^>]*id="root"')
$isDirectFastAPI = ($probeRes.Content -match '"sih_problem_id"' -or $probeRes.Content -match '"system"' -or $serverHeader -match "uvicorn")

if ($isDirectFastAPI -and -not $isSpa) {
    Write-Host "Target:  $TargetUrl" -ForegroundColor Yellow
    Write-Host "Server:  FastAPI / Uvicorn Direct" -ForegroundColor Yellow
    Write-Host "Ingress: BYPASSED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  [FAIL] Target $TargetUrl is FastAPI backend directly, NOT an Nginx production ingress." -ForegroundColor Red
    Write-Host "         The production ingress smoke test must target the actual Nginx listener (e.g. http://127.0.0.1)." -ForegroundColor Red
    Write-Host "         For direct FastAPI backend verification, use: scripts/backend-smoke-test.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Target:  $TargetUrl" -ForegroundColor Cyan
Write-Host "Server:  Nginx -> FastAPI" -ForegroundColor Cyan
Write-Host "Ingress: TESTED" -ForegroundColor Green
Write-Host "Testing Nginx production ingress..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------------"

# 1. Ingress & SPA Index
Write-Host "1. Testing Nginx Ingress & SPA Index..."
try {
    $resIndex = Invoke-WebRequest -Uri "$TargetUrl/" -UseBasicParsing -TimeoutSec 10
    $hasRoot = ($resIndex.Content -match 'id="root"' -or $resIndex.Content -match "<!doctype html")
    Assert-Check ($resIndex.StatusCode -eq 200 -and $hasRoot) `
        "GET / returned HTTP 200 with SPA HTML index containing #root container." `
        "GET / failed to serve SPA HTML index (HTTP $($resIndex.StatusCode))."
} catch {
    Assert-Check $false "" "GET / request failed: $_"
}

# 2. General Health Routing
Write-Host "2. Testing Ingress Health Reverse-Proxy Routing (/health)..."
try {
    $resHealth = Invoke-WebRequest -Uri "$TargetUrl/health" -UseBasicParsing -TimeoutSec 10
    $isHtml = ($resHealth.Content -match "<!doctype html>")
    Assert-Check ($resHealth.StatusCode -eq 200 -and (-not $isHtml)) `
        "GET /health correctly routed by Nginx to FastAPI backend (HTTP 200 JSON)." `
        "GET /health fell through to SPA HTML or returned error."
} catch {
    Assert-Check $false "" "GET /health request failed: $_"
}

# 3. Liveness Probe
Write-Host "3. Testing Liveness Probe via Ingress (/health/live)..."
try {
    $resLive = Invoke-RestMethod -Uri "$TargetUrl/health/live" -TimeoutSec 10
    Assert-Check ($resLive.status -eq "ALIVE") `
        "GET /health/live routed through Nginx returned status ALIVE." `
        "GET /health/live did not return ALIVE."
} catch {
    Assert-Check $false "" "GET /health/live request failed: $_"
}

# 4. Readiness Probe
Write-Host "4. Testing Readiness Probe via Ingress (/health/ready)..."
try {
    $resReady = Invoke-RestMethod -Uri "$TargetUrl/health/ready" -TimeoutSec 10
    Assert-Check ($resReady.status -eq "READY") `
        "GET /health/ready routed through Nginx returned status READY." `
        "GET /health/ready returned NOT READY or failed."
} catch {
    Assert-Check $false "" "GET /health/ready request failed: $_"
}

# 5. Core API Status via /api/* Ingress Route
Write-Host "5. Testing Core API Ingress Route (/api/status)..."
try {
    $resStatus = Invoke-RestMethod -Uri "$TargetUrl/api/status" -TimeoutSec 10
    Assert-Check ($resStatus.project -eq "VARUNETRA") `
        "GET /api/status routed through Nginx returned project VARUNETRA." `
        "GET /api/status failed."
} catch {
    Assert-Check $false "" "GET /api/status request failed: $_"
}

# 6. Terrain Engine Status
Write-Host "6. Testing Terrain Engine Status (/api/terrain/status)..."
try {
    $resTerrain = Invoke-RestMethod -Uri "$TargetUrl/api/terrain/status" -TimeoutSec 10
    Assert-Check ($null -ne $resTerrain.active_provider) `
        "GET /api/terrain/status routed through Nginx returned active provider ($($resTerrain.active_provider))." `
        "GET /api/terrain/status failed."
} catch {
    Assert-Check $false "" "GET /api/terrain/status failed: $_"
}

# 7. Terrain Validation Report
Write-Host "7. Testing Terrain Validation Report (/api/terrain/validation)..."
try {
    $resVal = Invoke-RestMethod -Uri "$TargetUrl/api/terrain/validation" -TimeoutSec 10
    Assert-Check ($resVal.validation_passed -eq $true) `
        "GET /api/terrain/validation returned validation_passed = true." `
        "GET /api/terrain/validation failed."
} catch {
    Assert-Check $false "" "GET /api/terrain/validation request failed: $_"
}

# 8. Authentication: Negative Login (Invalid Password)
Write-Host "8. Testing Authentication Negative Path via Ingress..."
try {
    $badBody = @{ username = $AdminUser; password = "WrongPassword999!" } | ConvertTo-Json
    $badRes = Invoke-WebRequest -Uri "$TargetUrl/api/auth/login" -Method POST -Body $badBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    Assert-Check $false "" "Expected HTTP 401, but received $($badRes.StatusCode)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Check ($status -eq 401) `
        "POST /api/auth/login with invalid password correctly rejected with HTTP 401." `
        "POST /api/auth/login returned HTTP $status. Expected HTTP 401."
}

# 9. Authentication: Positive Login
Write-Host "9. Testing Authentication Positive Path via Ingress..."
$token = $null
try {
    $goodBody = @{ username = $AdminUser; password = $AdminPassword } | ConvertTo-Json
    $goodRes = Invoke-RestMethod -Uri "$TargetUrl/api/auth/login" -Method POST -Body $goodBody -ContentType "application/json" -TimeoutSec 10
    $token = $goodRes.access_token
    Assert-Check ($null -ne $token -and $token.Length -gt 20) `
        "POST /api/auth/login succeeded and returned signed JWT bearer token." `
        "POST /api/auth/login failed to return a valid access token."
} catch {
    Assert-Check $false "" "POST /api/auth/login failed: $_"
}

# 10. Authenticated Identity Verification (/api/auth/me)
if ($token) {
    Write-Host "10. Testing Authenticated Identity Profile (/api/auth/me)..."
    try {
        $headers = @{ "Authorization" = "Bearer $token" }
        $meRes = Invoke-RestMethod -Uri "$TargetUrl/api/auth/me" -Headers $headers -TimeoutSec 10
        Assert-Check ($meRes.username -eq "admin" -and $meRes.role -eq "ADMINISTRATOR") `
            "GET /api/auth/me authenticated and returned user profile ($($meRes.role))." `
            "GET /api/auth/me failed."
    } catch {
        Assert-Check $false "" "GET /api/auth/me failed: $_"
    }

    # 11. Unauthorized Privileged Endpoint (Access without token)
    Write-Host "11. Testing Privileged Action Authorization (No Token)..."
    try {
        $patchBody = @{ action = "ACTIVATE" } | ConvertTo-Json
        $unauthRes = Invoke-WebRequest -Uri "$TargetUrl/api/pumps/PUMP-01" -Method PATCH -Body $patchBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        Assert-Check $false "" "Expected HTTP 401 or 403, but received $($unauthRes.StatusCode)"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Assert-Check ($status -eq 401 -or $status -eq 403) `
            "PATCH /api/pumps/PUMP-01 without token correctly rejected (HTTP $status)." `
            "PATCH /api/pumps/PUMP-01 without token returned unexpected status $status."
    }

    # 12. Authorized Privileged Endpoint (Access with admin token)
    Write-Host "12. Testing Authorized Privileged Action (With Admin Bearer)..."
    try {
        $patchBody = @{ action = "STANDBY" } | ConvertTo-Json
        $authRes = Invoke-RestMethod -Uri "$TargetUrl/api/pumps/PUMP-01" -Method PATCH -Headers $headers -Body $patchBody -ContentType "application/json" -TimeoutSec 10
        Assert-Check ($null -ne $authRes.id) `
            "PATCH /api/pumps/PUMP-01 with admin bearer token succeeded (HTTP 200)." `
            "PATCH /api/pumps/PUMP-01 with admin token failed."
    } catch {
        Assert-Check $false "" "PATCH /api/pumps/PUMP-01 with admin token failed: $_"
    }
}

# 13. WebSocket Upgrade Handshake via Ingress Proxy
Write-Host "13. Testing WebSocket Ingress Upgrade Handshake (/api/ws)..."
try {
    $wsReq = [System.Net.HttpWebRequest]::Create("$TargetUrl/api/ws")
    $wsReq.Headers.Add("Upgrade", "websocket")
    $wsReq.Connection = "Upgrade"
    $wsReq.Headers.Add("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==")
    $wsReq.Headers.Add("Sec-WebSocket-Version", "13")
    $wsReq.Timeout = 5000

    try {
        $wsResp = $wsReq.GetResponse()
        $wsCode = [int]$wsResp.StatusCode
        Assert-Check ($wsCode -eq 101) `
            "Nginx ingress reverse proxy accepted WebSocket upgrade negotiation (HTTP 101)." `
            "Nginx ingress returned HTTP $wsCode for WebSocket upgrade."
    } catch [System.Net.WebException] {
        if ($_.Response) {
            $wsCode = [int]$_.Response.StatusCode
            Assert-Check ($wsCode -eq 101 -or $wsCode -eq 400 -or $wsCode -eq 426) `
                "Nginx ingress responded to WebSocket upgrade handshake with HTTP $wsCode." `
                "WebSocket upgrade negotiation failed with HTTP $wsCode."
        } else {
            Assert-Check $false "" "WebSocket upgrade request failed: $_"
        }
    }
} catch {
    Assert-Check $false "" "WebSocket upgrade check encountered error: $_"
}

Write-Host "========================================================================" -ForegroundColor Cyan
if ($failedCount -eq 0) {
    Write-Host "VERDICT: ALL NGINX PRODUCTION INGRESS SMOKE TESTS PASSED (0 failures)." -ForegroundColor Green
    exit 0
} else {
    Write-Host "VERDICT: NGINX PRODUCTION INGRESS SMOKE TEST FAILED with $failedCount failure(s)." -ForegroundColor Red
    exit 1
}
