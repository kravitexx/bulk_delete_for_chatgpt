#!/usr/bin/env python3
"""
bridge.py - Local Bridge between AI Agent and ChatGPT Chrome Extension.

Supports:
  - Inspection & DOM scanning of ChatGPT Library
  - 6-8 item batch deletions with human-like event simulation & delays
  - Looped batch runs with natural pauses
  - Emergency stop
"""

import asyncio
import json
import sys
import time
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import websockets

WS_HOST = "127.0.0.1"
WS_PORT = 8765
HTTP_PORT = 8766

connected_clients = set()
pending_requests = {}
request_counter = 0
loop_instance = None


async def send_command_to_extension(action, timeout=45.0, **kwargs):
    """Send a command to the connected Chrome Extension and await the response."""
    global request_counter
    if not connected_clients:
        raise RuntimeError("No Chrome Extension connected. Please ensure Chrome is running, the extension is loaded, and you have https://chatgpt.com/library open.")

    request_counter += 1
    req_id = request_counter

    payload = {
        "id": req_id,
        "action": action,
        **kwargs
    }

    future = asyncio.get_running_loop().create_future()
    pending_requests[req_id] = future

    client = next(iter(connected_clients))
    await client.send(json.dumps(payload))

    try:
        response = await asyncio.wait_for(future, timeout=timeout)
        return response
    finally:
        pending_requests.pop(req_id, None)


async def ws_handler(websocket):
    """Handle incoming WebSocket connection from Chrome Extension background worker."""
    connected_clients.add(websocket)
    print(f"\n[Bridge] 🟢 Chrome Extension connected from {websocket.remote_address}")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                req_id = data.get("id")
                if req_id and req_id in pending_requests:
                    future = pending_requests[req_id]
                    if not future.done():
                        future.set_result(data)
                elif data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
                elif data.get("type") == "hello":
                    print(f"[Bridge] Handshake received from extension.")
            except Exception as e:
                print(f"[Bridge] Error parsing message: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        print("\n[Bridge] 🔴 Chrome Extension disconnected.")


class BridgeHTTPHandler(BaseHTTPRequestHandler):
    """HTTP endpoints to let CLI / AI Agent send commands cleanly."""

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/status":
            self._send_json(200, {
                "extension_connected": len(connected_clients) > 0,
                "ws_clients": len(connected_clients),
                "ws_port": WS_PORT,
                "http_port": HTTP_PORT
            })
            return

        if path == "/scan":
            self._handle_action("scan")
            return

        if path == "/buttons":
            self._handle_action("dump_buttons")
            return

        if path == "/test":
            count = int(query.get("count", [2])[0])
            self._handle_action("select_test", count=count)
            return

        if path == "/batch":
            size = int(query.get("size", [0])[0])
            self._handle_action("batch_delete", timeout=60.0, batch_size=size)
            return

        if path == "/loop":
            max_b = int(query.get("batches", [15])[0])
            self._handle_action("loop_delete", timeout=600.0, max_batches=max_b)
            return

        if path == "/stop":
            self._handle_action("emergency_stop")
            return

        if path == "/reset":
            self._handle_action("reset_stop")
            return

        if path == "/reinject":
            self._handle_action("reinject")
            return

        self._send_json(404, {"error": "Not found", "path": path})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        
        try:
            payload = json.loads(body) if body else {}
        except Exception:
            payload = {}

        if path == "/scan":
            self._handle_action("scan")
            return

        if path == "/buttons":
            self._handle_action("dump_buttons")
            return

        if path == "/test":
            count = payload.get("count", int(query.get("count", [2])[0]))
            self._handle_action("select_test", count=count)
            return

        if path == "/batch":
            size = payload.get("size", 0)
            self._handle_action("batch_delete", timeout=60.0, batch_size=size)
            return

        if path == "/loop":
            max_b = payload.get("batches", 15)
            self._handle_action("loop_delete", timeout=600.0, max_batches=max_b)
            return

        if path == "/eval":
            code = payload.get("code", "")
            self._handle_action("evaluate", code=code)
            return

        if path == "/stop":
            self._handle_action("emergency_stop")
            return

        if path == "/reset":
            self._handle_action("reset_stop")
            return

        if path == "/reinject":
            self._handle_action("reinject")
            return

        self._send_json(404, {"error": "Not found"})

    def _handle_action(self, action, timeout=45.0, **kwargs):
        if not loop_instance:
            self._send_json(500, {"error": "Bridge event loop not initialized"})
            return

        coro = send_command_to_extension(action, timeout=timeout, **kwargs)
        future = asyncio.run_coroutine_threadsafe(coro, loop_instance)

        try:
            res = future.result(timeout=timeout + 5.0)
            self._send_json(200, res)
        except Exception as e:
            self._send_json(500, {"status": "error", "error": str(e)})

    def log_message(self, format, *args):
        pass


def run_http_server():
    server = HTTPServer(("127.0.0.1", HTTP_PORT), BridgeHTTPHandler)
    server.serve_forever()


async def main_server():
    global loop_instance
    loop_instance = asyncio.get_running_loop()

    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()

    print("==================================================")
    print("  🚀 ChatGPT Library Cleanup Bridge is Running")
    print("==================================================")
    print(f"  • WebSocket listening on: ws://{WS_HOST}:{WS_PORT}")
    print(f"  • HTTP API listening on:   http://127.0.0.1:{HTTP_PORT}")
    print("\nWaiting for Chrome Extension to connect...")

    async with websockets.serve(ws_handler, WS_HOST, WS_PORT):
        await asyncio.Future()


def cli_request(endpoint, method="GET", data=None):
    url = f"http://127.0.0.1:{HTTP_PORT}{endpoint}"
    req = urllib.request.Request(url, method=method)
    if data:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=65) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"Error connecting to local bridge at {url}: {e}")
        print("Make sure 'python bridge.py server' is running in another terminal window.")
        sys.exit(1)


if __name__ == "__main__":
    args = sys.argv[1:]
    cmd = args[0] if args else "server"

    if cmd in ("server", "start"):
        try:
            asyncio.run(main_server())
        except KeyboardInterrupt:
            print("\n[Bridge] Server stopped.")

    elif cmd == "status":
        res = cli_request("/status")
        print(json.dumps(res, indent=2))

    elif cmd == "scan":
        print("🔍 Inspecting active ChatGPT Library tab...")
        res = cli_request("/scan")
        print(json.dumps(res, indent=2))

    elif cmd == "buttons":
        print("🔍 Dumping all interactive buttons on the active tab...")
        res = cli_request("/buttons")
        print(json.dumps(res, indent=2))

    elif cmd == "test":
        cnt = int(args[1]) if len(args) > 1 else 2
        print(f"🧪 Testing selection of {cnt} items and inspecting resulting buttons...")
        res = cli_request(f"/test?count={cnt}")
        print(json.dumps(res, indent=2))

    elif cmd == "batch":
        size = int(args[1]) if len(args) > 1 else 7
        print(f"🗑️ Deleting batch of {size} images with human delays...")
        res = cli_request(f"/batch?size={size}")
        print(json.dumps(res, indent=2))

    elif cmd == "loop":
        max_batches = int(args[1]) if len(args) > 1 else 10
        print(f"🔄 Starting loop deletion (up to {max_batches} batches of randomized 6-9 images each)...")
        res = cli_request(f"/loop?batches={max_batches}")
        print(json.dumps(res, indent=2))

    elif cmd == "stop":
        print("⛔ Sending Emergency Stop...")
        res = cli_request("/stop")
        print(json.dumps(res, indent=2))

    elif cmd == "reset":
        print("🔄 Resetting Stop Flag...")
        res = cli_request("/reset")
        print(json.dumps(res, indent=2))

    else:
        print("Usage:")
        print("  python bridge.py server          # Start bridge server")
        print("  python bridge.py status          # Check connection")
        print("  python bridge.py scan            # Inspect page & find elements")
        print("  python bridge.py batch 7         # Delete 1 batch of 7 images")
        print("  python bridge.py loop 7 5        # Delete 5 batches of 7 images with pauses")
        print("  python bridge.py stop            # Emergency stop")
