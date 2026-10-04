#!/usr/bin/env bash
# ==============================================================================
# VARUNETRA / FloodSense — Direct Backend Smoke Test Script (Bash)
# Problem Statement SIH26085: Urban Flood Nowcasting System
# ==============================================================================
# Tests the FastAPI/Uvicorn application directly, BYPASSING Nginx ingress.
# Target Default: http://127.0.0.1:8000
# Usage:
#   bash scripts/backend-smoke-test.sh [TARGET_URL]
# ==============================================================================

set -uo pipefail

TARGET_URL="${1:-http://127.0.0.1:8000}"
ADMIN_USERNAME="${TEST_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${TEST_ADMIN_PASSWORD:-Varunetra@MoES2026!}"

echo "========================================================================"
echo "VARUNETRA Direct Backend Smoke Test"
echo "Target Endpoint: ${TARGET_URL}"
echo "Server Target:   FastAPI / Uvicorn Direct"
echo "Ingress Layer:   BYPASSED (Direct Process Verification)"
echo "Testing FastAPI backend directly..."
echo "========================================================================"

FAILED_TESTS=0

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# 1. Direct Backend Root
echo "1. Testing FastAPI Root (/)..."
ROOT_RESP=$(curl -s -w "\n%{http_code}" "${TARGET_URL}/" || true)
HTTP_CODE=$(echo "${ROOT_RESP}" | tail -n 1)
ROOT_BODY=$(echo "${ROOT_RESP}" | head -n -1)

if [[ "${HTTP_CODE}" == "200" ]] && echo "${ROOT_BODY}" | grep -q "VARUNETRA"; then
    pass "GET / returned direct FastAPI JSON descriptor (system='VARUNETRA')."
else
    fail "GET / failed (HTTP ${HTTP_CODE}). Expected HTTP 200 with VARUNETRA descriptor."
fi

# 2. General Health Endpoint
echo "2. Testing General Health Endpoint (/health)..."
HEALTH_RESP=$(curl -s -w "\n%{http_code}" "${TARGET_URL}/health" || true)
HTTP_CODE=$(echo "${HEALTH_RESP}" | tail -n 1)
HEALTH_BODY=$(echo "${HEALTH_RESP}" | head -n -1)

if [[ "${HTTP_CODE}" == "200" ]] && echo "${HEALTH_BODY}" | grep -q "status"; then
    pass "GET /health returned HTTP 200 with JSON status."
else
    fail "GET /health failed (HTTP ${HTTP_CODE})."
fi

# 3. Liveness Probe
echo "3. Testing Liveness Probe (/health/live)..."
HTTP_CODE=$(curl -s -o /tmp/backend_live.json -w "%{http_code}" "${TARGET_URL}/health/live" || true)
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"status":"ALIVE"' /tmp/backend_live.json 2>/dev/null; then
    pass "GET /health/live returned HTTP 200 with status ALIVE."
else
    fail "GET /health/live failed (HTTP ${HTTP_CODE}). Expected ALIVE."
fi

# 4. Readiness Probe
echo "4. Testing Readiness Probe (/health/ready)..."
HTTP_CODE=$(curl -s -o /tmp/backend_ready.json -w "%{http_code}" "${TARGET_URL}/health/ready" || true)
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"status":"READY"' /tmp/backend_ready.json 2>/dev/null; then
    pass "GET /health/ready returned HTTP 200 with status READY."
else
    fail "GET /health/ready failed (HTTP ${HTTP_CODE}). System reported NOT READY."
fi

# 5. Core API Status
echo "5. Testing Core API Status (/api/status)..."
HTTP_CODE=$(curl -s -o /tmp/backend_status.json -w "%{http_code}" "${TARGET_URL}/api/status" || true)
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"project":"VARUNETRA"' /tmp/backend_status.json 2>/dev/null; then
    pass "GET /api/status returned HTTP 200 with project VARUNETRA."
else
    fail "GET /api/status failed (HTTP ${HTTP_CODE})."
fi

# 6. Terrain Engine Status
echo "6. Testing Terrain Engine Status (/api/terrain/status)..."
HTTP_CODE=$(curl -s -o /tmp/backend_terrain.json -w "%{http_code}" "${TARGET_URL}/api/terrain/status" || true)
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"active_provider"' /tmp/backend_terrain.json 2>/dev/null; then
    pass "GET /api/terrain/status returned HTTP 200 with active terrain provider."
else
    fail "GET /api/terrain/status failed (HTTP ${HTTP_CODE})."
fi

# 7. Terrain Validation Report
echo "7. Testing Terrain Validation Report (/api/terrain/validation)..."
HTTP_CODE=$(curl -s -o /tmp/backend_val.json -w "%{http_code}" "${TARGET_URL}/api/terrain/validation" || true)
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"validation_passed":true' /tmp/backend_val.json 2>/dev/null; then
    pass "GET /api/terrain/validation returned HTTP 200 (validation passed)."
else
    fail "GET /api/terrain/validation failed (HTTP ${HTTP_CODE})."
fi

# 8. Authentication: Negative Login (Invalid Password)
echo "8. Testing Authentication Negative Path..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${TARGET_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"WrongPassword999!\"}" || true)
if [[ "${HTTP_CODE}" == "401" ]]; then
    pass "POST /api/auth/login with invalid password correctly rejected with HTTP 401."
else
    fail "POST /api/auth/login returned HTTP ${HTTP_CODE}. Expected HTTP 401."
fi

# 9. Authentication: Positive Login
echo "9. Testing Authentication Positive Path..."
AUTH_RESP=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}" || true)
AUTH_BODY=$(echo "${AUTH_RESP}" | head -n -1)
HTTP_CODE=$(echo "${AUTH_RESP}" | tail -n 1)

ACCESS_TOKEN=$(echo "${AUTH_BODY}" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || true)

if [[ "${HTTP_CODE}" == "200" ]] && [[ -n "${ACCESS_TOKEN}" ]]; then
    pass "POST /api/auth/login succeeded (HTTP 200) and returned valid JWT bearer token."
else
    fail "POST /api/auth/login failed (HTTP ${HTTP_CODE}). Could not obtain access token."
fi

# 10. Authenticated Identity Verification (/api/auth/me)
if [[ -n "${ACCESS_TOKEN}" ]]; then
    echo "10. Testing Authenticated Identity Profile (/api/auth/me)..."
    HTTP_CODE=$(curl -s -o /tmp/backend_me.json -w "%{http_code}" "${TARGET_URL}/api/auth/me" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" || true)
    if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"username":"admin"' /tmp/backend_me.json 2>/dev/null; then
        pass "GET /api/auth/me authenticated and returned user profile (role: admin)."
    else
        fail "GET /api/auth/me failed (HTTP ${HTTP_CODE})."
    fi

    # 11. Tampered Token Authorization Rejection
    echo "11. Testing Tampered Token Rejection (Invalid Bearer)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "${TARGET_URL}/api/pumps/PUMP-01" \
        -H "Authorization: Bearer malformed.forged.jwt.token" \
        -H "Content-Type: application/json" \
        -d '{"action":"ACTIVATE"}' || true)
    if [[ "${HTTP_CODE}" == "401" ]]; then
        pass "PATCH /api/pumps/PUMP-01 with tampered/invalid token correctly rejected with HTTP 401."
    else
        fail "PATCH /api/pumps/PUMP-01 with tampered token returned unexpected status ${HTTP_CODE}. Expected HTTP 401."
    fi

    # 12. Authorized Privileged Endpoint (Access with admin token)
    echo "12. Testing Authorized Privileged Action (With Admin Bearer)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "${TARGET_URL}/api/pumps/PUMP-01" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"action":"STANDBY"}' || true)
    if [[ "${HTTP_CODE}" == "200" ]]; then
        pass "PATCH /api/pumps/PUMP-01 with admin bearer token succeeded (HTTP 200)."
    else
        fail "PATCH /api/pumps/PUMP-01 with admin token returned HTTP ${HTTP_CODE}. Expected HTTP 200."
    fi
fi

echo "========================================================================"
if [[ ${FAILED_TESTS} -eq 0 ]]; then
    echo "VERDICT: DIRECT BACKEND SMOKE TEST PASSED (0 failures)."
    exit 0
else
    echo "VERDICT: DIRECT BACKEND SMOKE TEST FAILED with ${FAILED_TESTS} failure(s)."
    exit 1
fi
