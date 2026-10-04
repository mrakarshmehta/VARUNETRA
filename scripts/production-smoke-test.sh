#!/usr/bin/env bash
# ==============================================================================
# VARUNETRA / FloodSense — Production Deployment Ingress Smoke Test (Bash)
# Problem Statement SIH26085: Urban Flood Nowcasting System
# ==============================================================================
# Verifies the production Nginx ingress reverse proxy.
# Must target the actual Nginx listener (e.g., http://127.0.0.1 or https://domain).
# This test FAILS if Nginx is unreachable or if pointed directly at Uvicorn.
# Usage:
#   bash scripts/production-smoke-test.sh [TARGET_URL]
# Example:
#   bash scripts/production-smoke-test.sh http://127.0.0.1
# ==============================================================================

set -uo pipefail

TARGET_URL="${1:-http://127.0.0.1}"
ADMIN_USERNAME="${TEST_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${TEST_ADMIN_PASSWORD:-Varunetra@MoES2026!}"

echo "========================================================================"
echo "VARUNETRA Production Deployment Ingress Smoke Test"
echo "Target Endpoint: ${TARGET_URL}"
echo "========================================================================"

FAILED_TESTS=0

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# 0. Dynamic Target & Ingress Identification Probe
echo "0. Probing Ingress Target Endpoint..."
PROBE_RESP=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "${TARGET_URL}/" || true)
HTTP_CODE=$(echo "${PROBE_RESP}" | tail -n 1)
PROBE_BODY=$(echo "${PROBE_RESP}" | head -n -1)

if [[ "${HTTP_CODE}" == "000" ]] || [[ -z "${HTTP_CODE}" ]]; then
    echo "Target:  ${TARGET_URL}"
    echo "Server:  UNREACHABLE"
    echo "Ingress: FAILED (Nginx listener is down or port is closed)"
    echo "  [FAIL] Could not connect to production ingress at ${TARGET_URL}."
    echo "         The production ingress test must fail when Nginx is unreachable."
    echo "         Do NOT fall back to port 8000."
    exit 1
fi

# Check if target is direct FastAPI backend rather than Nginx reverse proxy
if echo "${PROBE_BODY}" | grep -q '"system"[[:space:]]*:[[:space:]]*"VARUNETRA"' && ! echo "${PROBE_BODY}" | grep -q 'id="root"'; then
    echo "Target:  ${TARGET_URL}"
    echo "Server:  FastAPI / Uvicorn Direct"
    echo "Ingress: BYPASSED"
    echo ""
    echo "  [FAIL] Target ${TARGET_URL} is FastAPI backend directly, NOT an Nginx production ingress."
    echo "         Production ingress smoke test must target the actual Nginx listener (e.g. http://127.0.0.1)."
    echo "         For direct FastAPI backend verification, use: scripts/backend-smoke-test.sh"
    exit 1
fi

echo "Target:  ${TARGET_URL}"
echo "Server:  Nginx -> FastAPI"
echo "Ingress: TESTED"
echo "Testing Nginx production ingress..."
echo "------------------------------------------------------------------------"

# 1. Ingress & SPA Index
echo "1. Testing Nginx Ingress & SPA Index..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_index.html -w "%{http_code}" "${TARGET_URL}/")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q "root" /tmp/varunetra_index.html; then
    pass "GET / returned HTTP 200 with HTML SPA root container."
else
    fail "GET / failed (HTTP ${HTTP_CODE}). Expected HTTP 200 with SPA HTML index."
fi

# 2. General Health Endpoint
echo "2. Testing General Health Endpoint (/health)..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_health.json -w "%{http_code}" "${TARGET_URL}/health")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q "status" /tmp/varunetra_health.json; then
    # Ensure it did NOT fall through to SPA HTML
    if grep -q "<!doctype html>" /tmp/varunetra_health.json; then
        fail "GET /health fell through to SPA HTML instead of routing to FastAPI backend."
    else
        pass "GET /health correctly routed to FastAPI backend (HTTP 200 JSON)."
    fi
else
    fail "GET /health failed (HTTP ${HTTP_CODE}). Expected HTTP 200 JSON."
fi

# 3. Liveness Probe
echo "3. Testing Liveness Probe (/health/live)..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_live.json -w "%{http_code}" "${TARGET_URL}/health/live")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"status":"ALIVE"' /tmp/varunetra_live.json; then
    pass "GET /health/live returned HTTP 200 with status ALIVE."
else
    fail "GET /health/live failed (HTTP ${HTTP_CODE}). Expected ALIVE."
fi

# 4. Readiness Probe
echo "4. Testing Readiness Probe (/health/ready)..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_ready.json -w "%{http_code}" "${TARGET_URL}/health/ready")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"status":"READY"' /tmp/varunetra_ready.json; then
    pass "GET /health/ready returned HTTP 200 with status READY."
else
    fail "GET /health/ready failed (HTTP ${HTTP_CODE}). System reported NOT READY."
fi

# 5. Core API Status
echo "5. Testing Core API Status (/api/status)..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_status.json -w "%{http_code}" "${TARGET_URL}/api/status")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"project":"VARUNETRA"' /tmp/varunetra_status.json; then
    pass "GET /api/status returned HTTP 200 with project VARUNETRA."
else
    fail "GET /api/status failed (HTTP ${HTTP_CODE})."
fi

# 6. Terrain Engine Status
echo "6. Testing Terrain Engine Status (/api/terrain/status)..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_terrain.json -w "%{http_code}" "${TARGET_URL}/api/terrain/status")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"active_provider"' /tmp/varunetra_terrain.json; then
    pass "GET /api/terrain/status returned HTTP 200 with active terrain provider."
else
    fail "GET /api/terrain/status failed (HTTP ${HTTP_CODE})."
fi

# 7. Terrain Validation Report
echo "7. Testing Terrain Validation Report (/api/terrain/validation)..."
HTTP_CODE=$(curl -s -o /tmp/varunetra_val.json -w "%{http_code}" "${TARGET_URL}/api/terrain/validation")
if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"validation_passed":true' /tmp/varunetra_val.json; then
    pass "GET /api/terrain/validation returned HTTP 200 (validation passed)."
else
    fail "GET /api/terrain/validation failed (HTTP ${HTTP_CODE})."
fi

# 8. Authentication: Negative Login (Invalid Password)
echo "8. Testing Authentication Negative Path via Ingress..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${TARGET_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"TotallyWrongPassword999!\"}")
if [[ "${HTTP_CODE}" == "401" ]]; then
    pass "POST /api/auth/login with invalid password correctly rejected with HTTP 401."
else
    fail "POST /api/auth/login returned HTTP ${HTTP_CODE}. Expected HTTP 401."
fi

# 9. Authentication: Positive Login
echo "9. Testing Authentication Positive Path via Ingress..."
AUTH_RESP=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}")
AUTH_BODY=$(echo "${AUTH_RESP}" | head -n -1)
HTTP_CODE=$(echo "${AUTH_RESP}" | tail -n 1)

ACCESS_TOKEN=$(echo "${AUTH_BODY}" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || true)

if [[ "${HTTP_CODE}" == "200" ]] && [[ -n "${ACCESS_TOKEN}" ]]; then
    pass "POST /api/auth/login succeeded (HTTP 200) and returned valid JWT token."
else
    fail "POST /api/auth/login failed (HTTP ${HTTP_CODE}). Could not obtain access token."
fi

# 10. Authenticated Identity Verification (/api/auth/me)
if [[ -n "${ACCESS_TOKEN}" ]]; then
    echo "10. Testing Authenticated Identity Profile (/api/auth/me)..."
    HTTP_CODE=$(curl -s -o /tmp/varunetra_me.json -w "%{http_code}" "${TARGET_URL}/api/auth/me" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    if [[ "${HTTP_CODE}" == "200" ]] && grep -q '"username":"admin"' /tmp/varunetra_me.json; then
        pass "GET /api/auth/me authenticated and returned user profile."
    else
        fail "GET /api/auth/me failed (HTTP ${HTTP_CODE})."
    fi

    # 11. Unauthorized Privileged Endpoint (Access without token)
    echo "11. Testing Privileged Action Authorization (No Token)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "${TARGET_URL}/api/pumps/PUMP-01" \
        -H "Content-Type: application/json" \
        -d '{"action":"ACTIVATE"}')
    if [[ "${HTTP_CODE}" == "401" ]] || [[ "${HTTP_CODE}" == "403" ]]; then
        pass "PATCH /api/pumps/PUMP-01 without token correctly rejected (HTTP ${HTTP_CODE})."
    else
        fail "PATCH /api/pumps/PUMP-01 without token returned unexpected status ${HTTP_CODE}."
    fi

    # 12. Authorized Privileged Endpoint (Access with admin token)
    echo "12. Testing Authorized Privileged Action (With Admin Bearer)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "${TARGET_URL}/api/pumps/PUMP-01" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"action":"STANDBY"}')
    if [[ "${HTTP_CODE}" == "200" ]]; then
        pass "PATCH /api/pumps/PUMP-01 with admin bearer token succeeded (HTTP 200)."
    else
        fail "PATCH /api/pumps/PUMP-01 with admin token returned HTTP ${HTTP_CODE}. Expected HTTP 200."
    fi
fi

# 13. WebSocket Upgrade Handshake
echo "13. Testing WebSocket Ingress Upgrade Handshake (/api/ws)..."
WS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Upgrade: websocket" \
    -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" \
    "${TARGET_URL}/api/ws" || true)

if [[ "${WS_CODE}" == "101" ]] || [[ "${WS_CODE}" == "400" ]] || [[ "${WS_CODE}" == "426" ]]; then
    pass "WebSocket endpoint /api/ws routed through Nginx ingress (HTTP ${WS_CODE})."
else
    fail "WebSocket endpoint /api/ws failed upgrade negotiation (HTTP ${WS_CODE})."
fi

echo "========================================================================"
if [[ ${FAILED_TESTS} -eq 0 ]]; then
    echo "VERDICT: ALL NGINX PRODUCTION INGRESS SMOKE TESTS PASSED (0 failures)."
    exit 0
else
    echo "VERDICT: NGINX PRODUCTION INGRESS SMOKE TEST FAILED with ${FAILED_TESTS} failure(s)."
    exit 1
fi
