// popup.js

document.addEventListener("DOMContentLoaded", async () => {
  const bridgeDot = document.getElementById("bridge-dot");
  const bridgeStatus = document.getElementById("bridge-status");
  const tabStatus = document.getElementById("tab-status");
  const auditCount = document.getElementById("audit-count");
  const logDiv = document.getElementById("log");
  const btnScan = document.getElementById("btn-scan");
  const btnLoop = document.getElementById("btn-loop");
  const btnBatch = document.getElementById("btn-batch");
  const btnStop = document.getElementById("btn-stop");
  const btnReset = document.getElementById("btn-reset");
  const btnPreview = document.getElementById("btn-preview");
  const btnExportLog = document.getElementById("btn-export-log");
  const btnClearLog = document.getElementById("btn-clear-log");

  function log(msg) {
    logDiv.innerText = msg;
  }

  // Refresh confirmed deletion count from local extension storage
  async function refreshAuditCount() {
    try {
      const res = await chrome.storage.local.get(["deletion_log"]);
      const history = res.deletion_log || [];
      const total = history.reduce((acc, entry) => acc + (entry.files?.length || entry.count || 0), 0);
      if (auditCount) {
        auditCount.innerText = `${total} files`;
      }
    } catch (e) {
      if (auditCount) auditCount.innerText = "0 files";
    }
  }

  refreshAuditCount();

  // Check bridge status
  chrome.runtime.sendMessage({ action: "get_bridge_status" }, (res) => {
    if (res && res.connected) {
      bridgeDot.className = "pulse-dot connected";
      bridgeStatus.innerText = "CLI Bridge (8765)";
      bridgeStatus.style.color = "#38bdf8";
    } else {
      bridgeStatus.innerText = "Standalone Native";
      bridgeStatus.style.color = "#94a3b8";
    }
  });

  // Check active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  if (currentTab && currentTab.url && currentTab.url.includes("chatgpt.com")) {
    bridgeDot.className = "pulse-dot connected";
    tabStatus.innerText = "ChatGPT Active";
    tabStatus.style.color = "#10b981";
  } else {
    bridgeDot.className = "pulse-dot";
    tabStatus.innerText = "Open chatgpt.com";
    tabStatus.style.color = "#f59e0b";
  }

  // Preview Next Batch
  btnPreview.addEventListener("click", async () => {
    log("Fetching preview of next batch items...");
    try {
      const resp = await chrome.tabs.sendMessage(currentTab.id, { action: "preview_next", count: 7 });
      if (resp && resp.status === "success") {
        const fileList = resp.files.map((f, i) => `  ${i + 1}. ${f}`).join("\n");
        log(`[Preview Next ${resp.count} Items] (Total unselected: ${resp.total_unselected}):\n${fileList}`);
      } else {
        log("Preview error: " + (resp.error || JSON.stringify(resp)));
      }
    } catch (e) {
      log("Error contacting tab: " + e.message + "\nMake sure ChatGPT library tab is active.");
    }
  });

  // Export Audit Log
  btnExportLog.addEventListener("click", async () => {
    try {
      const res = await chrome.storage.local.get(["deletion_log"]);
      const history = res.deletion_log || [];

      if (history.length === 0) {
        log("Audit log is currently empty. No deletions recorded yet.");
        return;
      }

      let total = 0;
      let body = `=== ChatGPT Library Deletion Audit Log ===\n`;
      body += `Exported: ${new Date().toLocaleString()}\n\n`;

      history.forEach((entry, idx) => {
        const count = entry.files?.length || entry.count || 0;
        total += count;
        body += `[${entry.timestamp}] Batch #${idx + 1} (${count} files confirmed deleted):\n`;
        if (entry.files && Array.isArray(entry.files)) {
          entry.files.forEach((f) => {
            body += `  - ${f}\n`;
          });
        }
        body += `\n`;
      });

      body += `Total Confirmed Deletions: ${total} files\n`;

      const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatgpt_deletion_log_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      log(`Exported audit log with ${total} confirmed deletions.`);
    } catch (e) {
      log("Failed to export log: " + e.message);
    }
  });

  // Clear Audit Log
  btnClearLog.addEventListener("click", async () => {
    try {
      await chrome.storage.local.remove(["deletion_log"]);
      refreshAuditCount();
      log("Audit log cleared.");
    } catch (e) {
      log("Error clearing log: " + e.message);
    }
  });

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
      refreshAuditCount();
      if (resp && resp.status === "success") {
        log(resp.result.message || "Auto Loop finished!");
      } else {
        log("Loop stopped: " + (resp.error || resp.result?.message || JSON.stringify(resp)));
      }
    } catch (e) {
      refreshAuditCount();
      log("Error: " + e.message);
    }
  });

  // Batch delete button (single batch, random 6-9 items)
  btnBatch.addEventListener("click", async () => {
    log("Running 1 batch deletion (random 6-9 items) with human delays...");
    try {
      const resp = await chrome.tabs.sendMessage(currentTab.id, { action: "batch_delete", batch_size: 0 });
      refreshAuditCount();
      if (resp && resp.status === "success") {
        log(resp.result.message || "Batch deletion complete!");
      } else {
        log("Batch error: " + (resp.error || JSON.stringify(resp)));
      }
    } catch (e) {
      refreshAuditCount();
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
