<#
==============================================================================
VARUNETRA / FloodSense — Direct Backend Smoke Test (PowerShell)
Problem Statement SIH26085: Urban Flood Nowcasting System
==============================================================================
Tests the FastAPI/Uvicorn application directly, BYPASSING Nginx ingress.
Target Default: http://127.0.0.1:8000
==============================================================================
#>

param(
    [string]$TargetUrl = "http://127.0.0.1:8000",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "Varunetra@MoES2026!"
)

$ErrorActionPreference = "Continue"
$failedCount = 0

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "VARUNETRA Direct Backend Smoke Test (Ingress: BYPASSED)" -ForegroundColor Cyan
Write-Host "Target Endpoint: $TargetUrl" -ForegroundColor Cyan
Write-Host "Server Target:   FastAPI / Uvicorn Direct" -ForegroundColor Cyan
Write-Host "Ingress Layer:   BYPASSED (Direct Process Verification)" -ForegroundColor Cyan
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

# 1. Direct Backend Root
Write-Host "1. Testing FastAPI Root (/)..."
try {
    $resRoot = Invoke-RestMethod -Uri "$TargetUrl/" -TimeoutSec 10
    Assert-Check ($resRoot.system -match "VARUNETRA") `
        "GET / returned direct FastAPI JSON descriptor (system='VARUNETRA')." `
        "GET / failed to return expected system descriptor."
} catch {
    Assert-Check $false "" "GET / request failed: $_"
}

# 2. General Health Endpoint
Write-Host "2. Testing General Health Endpoint (/health)..."
try {
    $resHealth = Invoke-RestMethod -Uri "$TargetUrl/health" -TimeoutSec 10
    Assert-Check ($null -ne $resHealth.status) `
        "GET /health returned HTTP 200 with status '$($resHealth.status)'." `
        "GET /health failed."
} catch {
    Assert-Check $false "" "GET /health request failed: $_"
}

# 3. Liveness Probe
Write-Host "3. Testing Liveness Probe (/health/live)..."
try {
    $resLive = Invoke-RestMethod -Uri "$TargetUrl/health/live" -TimeoutSec 10
    Assert-Check ($resLive.status -eq "ALIVE") `
        "GET /health/live returned status ALIVE." `
        "GET /health/live failed."
} catch {
    Assert-Check $false "" "GET /health/live request failed: $_"
}

# 4. Readiness Probe
Write-Host "4. Testing Readiness Probe (/health/ready)..."
try {
    $resReady = Invoke-RestMethod -Uri "$TargetUrl/health/ready" -TimeoutSec 10
    Assert-Check ($resReady.status -eq "READY") `
        "GET /health/ready returned status READY." `
        "GET /health/ready returned NOT READY or failed."
} catch {
    Assert-Check $false "" "GET /health/ready request failed: $_"
}

# 5. Core API Status
Write-Host "5. Testing Core API Status (/api/status)..."
try {
    $resStatus = Invoke-RestMethod -Uri "$TargetUrl/api/status" -TimeoutSec 10
    Assert-Check ($resStatus.project -eq "VARUNETRA") `
        "GET /api/status returned project VARUNETRA." `
        "GET /api/status failed."
} catch {
    Assert-Check $false "" "GET /api/status request failed: $_"
}

# 6. Terrain Engine Status
Write-Host "6. Testing Terrain Engine Status (/api/terrain/status)..."
try {
    $resTerrain = Invoke-RestMethod -Uri "$TargetUrl/api/terrain/status" -TimeoutSec 10
    Assert-Check ($null -ne $resTerrain.active_provider) `
        "GET /api/terrain/status returned active provider ($($resTerrain.active_provider))." `
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
Write-Host "8. Testing Authentication Negative Path..."
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
Write-Host "9. Testing Authentication Positive Path..."
$token = $null
try {
    $goodBody = @{ username = $AdminUser; password = $AdminPassword } | ConvertTo-Json
    $goodRes = Invoke-RestMethod -Uri "$TargetUrl/api/auth/login" -Method POST -Body $goodBody -ContentType "application/json" -TimeoutSec 10
    $token = $goodRes.access_token
    Assert-Check ($null -ne $token -and $token.Length -gt 20) `
        "POST /api/auth/login succeeded and returned signed JWT bearer token." `
        "POST /api/auth/login failed to return access token."
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
            "GET /api/auth/me authenticated and returned user profile (role: $($meRes.role))." `
            "GET /api/auth/me failed."
    } catch {
        Assert-Check $false "" "GET /api/auth/me failed: $_"
    }

    # 11. Unauthorized & Tampered Action Authorization
    Write-Host "11. Testing Tampered Token Rejection & Unauthenticated Action..."
    try {
        $badAuthHeaders = @{ "Authorization" = "Bearer malformed.forged.jwt.token" }
        $tamperedRes = Invoke-WebRequest -Uri "$TargetUrl/api/pumps/PUMP-01" -Method PATCH -Headers $badAuthHeaders -Body '{"action":"ACTIVATE"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        Assert-Check $false "" "Expected HTTP 401 for tampered token, but received $($tamperedRes.StatusCode)"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Assert-Check ($status -eq 401) `
            "PATCH /api/pumps/PUMP-01 with tampered/invalid token correctly rejected with HTTP 401." `
            "PATCH /api/pumps/PUMP-01 with tampered token returned HTTP $status. Expected HTTP 401."
    }

    # 12. Authorized Privileged Action (Access with admin token)
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

Write-Host "========================================================================" -ForegroundColor Cyan
if ($failedCount -eq 0) {
    Write-Host "VERDICT: DIRECT BACKEND SMOKE TEST PASSED (0 failures)." -ForegroundColor Green
    exit 0
} else {
    Write-Host "VERDICT: DIRECT BACKEND SMOKE TEST FAILED with $failedCount failure(s)." -ForegroundColor Red
    exit 1
}
