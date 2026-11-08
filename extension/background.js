// background.js - WebSocket relay with persistent keepalive

let socket = null;
let reconnectTimer = null;
let heartbeatInterval = null;
const WS_URL = "ws://127.0.0.1:8765";

function startHeartbeat() {
  stopHeartbeat();
  // Send a ping every 10 seconds. In Chrome 116+, active WebSocket traffic prevents
  // Chrome from terminating the MV3 background service worker!
  heartbeatInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping", time: Date.now() }));
    }
  }, 10000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function connectBridge() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  console.log("[Background] Attempting to connect to bridge:", WS_URL);
  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("[Background] 🟢 Connected to Python Bridge at", WS_URL);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      startHeartbeat();
      socket.send(JSON.stringify({ type: "hello", role: "extension", timestamp: Date.now() }));
    };

    socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Ignore pong responses
        if (msg.type === "pong") return;

        console.log("[Background] Received command from Python bridge:", msg);
        const response = await handleBridgeCommand(msg);
        socket.send(JSON.stringify({ id: msg.id, ...response }));
      } catch (err) {
        console.error("[Background] Error handling message:", err);
        socket.send(JSON.stringify({ id: msg?.id, status: "error", error: err.message }));
      }
    };

    socket.onclose = () => {
      console.log("[Background] 🔴 Disconnected from Python Bridge. Reconnecting...");
      stopHeartbeat();
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.warn("[Background] WebSocket error:", err);
      socket.close();
    };
  } catch (e) {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectBridge();
    }, 2000);
  }
}

// Keep service worker awake using alarms
try {
  chrome.alarms.create("keepAlive", { periodInMinutes: 0.5 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keepAlive") {
      connectBridge();
    }
  });
} catch (e) {
  // Alarms fallback
}

// Find ChatGPT tab and forward command to content script
async function handleBridgeCommand(msg) {
  const tabs = await chrome.tabs.query({ url: "*://chatgpt.com/*" });
  if (!tabs || tabs.length === 0) {
    return { status: "error", error: "No active ChatGPT tab found. Please open https://chatgpt.com in a tab." };
  }

  const activeTab = tabs.find((t) => t.active) || tabs[0];

  // If requested to reinject content script from disk
  if (msg.action === "reinject") {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["content.js"],
      });
      return { status: "success", message: "content.js re-injected dynamically from disk" };
    } catch (e) {
      return { status: "error", error: e.message };
    }
  }

  try {
    const contentResponse = await chrome.tabs.sendMessage(activeTab.id, msg);
    return { status: "success", data: contentResponse };
  } catch (err) {
    // If content script was not injected yet, inject it on the fly and retry
    if (err.message && err.message.includes("Receiving end does not exist")) {
      try {
        console.log("[Background] Injecting content.js dynamically into tab", activeTab.id);
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"],
        });
        // small wait for initialization
        await new Promise((r) => setTimeout(r, 200));
        const retryResponse = await chrome.tabs.sendMessage(activeTab.id, msg);
        return { status: "success", data: retryResponse };
      } catch (injectErr) {
        console.error("[Background] Failed dynamic injection:", injectErr);
      }
    }
    return {
      status: "error",
      error: `Failed to communicate with tab: ${err.message}. Make sure https://chatgpt.com/library is open and refreshed.`,
    };
  }
}

// Initial connect
connectBridge();

// Internal runtime messages (popup or content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_bridge_status") {
    sendResponse({
      connected: socket && socket.readyState === WebSocket.OPEN,
    });
    return false;
  }
  if (request.action === "reconnect_bridge") {
    connectBridge();
    sendResponse({ status: "reconnecting" });
    return false;
  }
  return false;
});
