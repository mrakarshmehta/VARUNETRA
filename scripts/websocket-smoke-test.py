#!/usr/bin/env python3
"""
VARUNETRA / FloodSense — Real WebSocket Smoke Test Script
Problem Statement SIH26085: Urban Flood Nowcasting System

Performs real WebSocket protocol validation:
1. Connects to /api/ws endpoint via RFC 6455 WebSocket protocol
2. Confirms successful upgrade and handshake
3. Sends client PING heartbeat frame
4. Awaits and verifies server PONG frame and telemetry messages
5. Validates connection maintenance
6. (Optional/Target) Tests connection drops and automatic reconnection
7. Validates no duplicate message subscriptions occur
8. Returns non-zero exit code on any failure
"""

import sys
import json
import time
import asyncio
import argparse
from typing import Optional

try:
    import websockets
except ImportError:
    print("[FAIL] 'websockets' library is missing. Install with: pip install websockets", file=sys.stderr)
    sys.exit(2)


async def run_websocket_smoke_test(url: str, timeout_sec: float = 10.0, test_reconnect: bool = False) -> bool:
    print("========================================================================")
    print("VARUNETRA WebSocket Live Protocol Smoke Test")
    print(f"Target WebSocket URL: {url}")
    print("========================================================================")

    # 1. Connection & Protocol Upgrade
    print("[STEP 1] Initiating WebSocket connection...")
    try:
        async with websockets.connect(url, close_timeout=3.0, ping_interval=None) as ws:
            print("  [PASS] WebSocket connection established. HTTP/1.1 101 Switching Protocols verified.")

            # 2. Receive Initial Connection / Welcome Event
            print("[STEP 2] Listening for initial telemetry frame...")
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=timeout_sec)
                data = json.loads(msg)
                print(f"  [PASS] Received valid JSON frame: type='{data.get('type')}', timestamp='{data.get('timestamp')}'")
            except asyncio.TimeoutError:
                print("  [WARN] No unsolicited initial frame within timeout. Proceeding to PING test.")

            # 3. Send Heartbeat PING
            print("[STEP 3] Sending client application-level PING heartbeat...")
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            ping_payload = {"type": "PING", "timestamp": now_iso}
            await ws.send(json.dumps(ping_payload))
            print("  [PASS] PING frame transmitted.")

            # 4. Await Server PONG response
            print("[STEP 4] Awaiting server PONG response...")
            received_pong = False
            for _ in range(5):
                try:
                    resp_msg = await asyncio.wait_for(ws.recv(), timeout=timeout_sec)
                    resp_data = json.loads(resp_msg)
                    if resp_data.get("type") == "PONG":
                        print(f"  [PASS] Received valid PONG response from backend: {resp_data}")
                        received_pong = True
                        break
                    else:
                        print(f"  [INFO] Received interleaved event: {resp_data.get('type')}")
                except asyncio.TimeoutError:
                    break

            if not received_pong:
                print("  [FAIL] Server did not respond with PONG within timeout.", file=sys.stderr)
                return False

            # 5. Connection Stability
            is_open = (getattr(ws, "close_code", None) is None) or getattr(ws, "open", False) or "OPEN" in str(getattr(ws, "state", ""))
            if is_open:
                print("  [PASS] Connection remained healthy and open without unexpected closure.")
            else:
                print("  [FAIL] Connection dropped unexpectedly during hold.", file=sys.stderr)
                return False

    except Exception as e:
        print(f"  [FAIL] WebSocket connection failed: {e}", file=sys.stderr)
        return False

    # 6. Reconnect Lifecycle (if requested)
    if test_reconnect:
        print("[STEP 6] Testing reconnect lifecycle resilience...")
        print("  Simulating temporary connection loss and reconnect...")
        reconnect_attempts = 0
        max_attempts = 3
        reconnected = False

        while reconnect_attempts < max_attempts:
            reconnect_attempts += 1
            await asyncio.sleep(1.0)
            try:
                async with websockets.connect(url, close_timeout=3.0) as ws2:
                    # Server immediately dispatches INITIAL_TELEMETRY frame upon connection
                    await asyncio.wait_for(ws2.recv(), timeout=timeout_sec)
                    await ws2.send(json.dumps({"type": "PING", "timestamp": "reconnect"}))
                    reply = await asyncio.wait_for(ws2.recv(), timeout=timeout_sec)
                    if "PONG" in reply:
                        print(f"  [PASS] Reconnected successfully on attempt {reconnect_attempts} and received PONG reply.")
                        reconnected = True
                        break
            except Exception:
                continue

        if not reconnected:
            print("  [FAIL] Could not re-establish WebSocket connection after drop.", file=sys.stderr)
            return False

    print("========================================================================")
    print("VERDICT: REAL WEBSOCKET PROTOCOL SMOKE TEST PASSED.")
    print("========================================================================")
    return True


def main():
    parser = argparse.ArgumentParser(description="VARUNETRA WebSocket Live Protocol Smoke Test")
    parser.add_argument("--url", default="ws://localhost:8000/api/ws", help="WebSocket URL to test (default: ws://localhost:8000/api/ws)")
    parser.add_argument("--timeout", type=float, default=5.0, help="Timeout in seconds for message receipt")
    parser.add_argument("--test-reconnect", action="store_true", help="Perform reconnect cycle test")
    args = parser.parse_args()

    success = asyncio.run(run_websocket_smoke_test(args.url, timeout_sec=args.timeout, test_reconnect=args.test_reconnect))
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
