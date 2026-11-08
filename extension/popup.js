// popup.js

document.addEventListener("DOMContentLoaded", async () => {
  const bridgeDot = document.getElementById("bridge-dot");
  const bridgeStatus = document.getElementById("bridge-status");
  const tabStatus = document.getElementById("tab-status");
  const logDiv = document.getElementById("log");
  const btnScan = document.getElementById("btn-scan");
  const btnLoop = document.getElementById("btn-loop");
  const btnBatch = document.getElementById("btn-batch");
  const btnStop = document.getElementById("btn-stop");
  const btnReset = document.getElementById("btn-reset");

  function log(msg) {
    logDiv.innerText = msg;
  }

  // Check bridge status
  chrome.runtime.sendMessage({ action: "get_bridge_status" }, (res) => {
    if (res && res.connected) {
      bridgeDot.className = "badge connected";
      bridgeStatus.innerText = "Connected (Port 8765)";
      bridgeStatus.style.color = "#10b981";
    } else {
      bridgeDot.className = "badge";
      bridgeStatus.innerText = "Offline (run bridge.py)";
      bridgeStatus.style.color = "#ef4444";
    }
  });

  // Check active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  if (currentTab && currentTab.url && currentTab.url.includes("chatgpt.com")) {
    tabStatus.innerText = "ChatGPT Active";
    tabStatus.style.color = "#10b981";
  } else {
    tabStatus.innerText = "Not ChatGPT";
    tabStatus.style.color = "#f59e0b";
  }

  // Scan button
  btnScan.addEventListener("click", async () => {
    log("Scanning page elements...");
    try {
      const resp = await chrome.tabs.sendMessage(currentTab.id, { action: "scan" });
      if (resp && resp.status === "success") {
        const d = resp.data;
        log(`Found ${d.total_images_found} images.\nSelectable items: ${d.selectable_items_found}\nModals open: ${d.open_modals.length}`);
      } else {
        log("Scan error: " + JSON.stringify(resp));
      }
    } catch (e) {
      log("Error contacting tab: " + e.message + "\nReload https://chatgpt.com/library first.");
    }
  });

  // Loop delete button (Auto-runs batches of 6-9 images)
  btnLoop.addEventListener("click", async () => {
    log("🔁 Auto Loop started! Processing batches of 6-9 images...\nWatch your screen. Click 'Emergency Stop' anytime.");
    try {
      const resp = await chrome.tabs.sendMessage(currentTab.id, { action: "loop_delete", max_batches: 25 });
      if (resp && resp.status === "success") {
        log(resp.result.message || "Auto Loop finished!");
      } else {
        log("Loop error: " + (resp.error || JSON.stringify(resp)));
      }
    } catch (e) {
      log("Error: " + e.message);
    }
  });

  // Batch delete button (single batch, random 6-9 items)
  btnBatch.addEventListener("click", async () => {
    log("Running 1 batch deletion (random 6-9 items) with human delays...");
    try {
      const resp = await chrome.tabs.sendMessage(currentTab.id, { action: "batch_delete", batch_size: 0 });
      if (resp && resp.status === "success") {
        log(resp.result.message || "Batch deletion complete!");
      } else {
        log("Batch error: " + (resp.error || JSON.stringify(resp)));
      }
    } catch (e) {
      log("Error: " + e.message);
    }
  });

  // Emergency stop button
  btnStop.addEventListener("click", async () => {
    try {
      await chrome.tabs.sendMessage(currentTab.id, { action: "emergency_stop" });
      log("Emergency stop activated!");
    } catch (e) {
      log("Error: " + e.message);
    }
  });

  // Reset button
  btnReset.addEventListener("click", async () => {
    try {
      await chrome.tabs.sendMessage(currentTab.id, { action: "reset_stop" });
      log("Stop flag reset. Ready.");
    } catch (e) {
      log("Error: " + e.message);
    }
  });
});
