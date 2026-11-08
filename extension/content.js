// content.js - ChatGPT Library Controller & Human Simulator

(function () {
// (Re-injections allowed)

  console.log("[CleanupAgent] Content script loaded on:", window.location.href);

  let emergencyStop = false;
  let activeOverlay = null;

  // --- Visual Floating Widget ---
  function createFloatingBadge() {
    if (document.getElementById("cleanup-agent-badge")) return;
    const badge = document.createElement("div");
    badge.id = "cleanup-agent-badge";
    badge.style.position = "fixed";
    badge.style.bottom = "24px";
    badge.style.right = "24px";
    badge.style.zIndex = "999999";
    badge.style.background = "rgba(10, 15, 29, 0.85)";
    badge.style.color = "#f8fafc";
    badge.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    badge.style.borderRadius = "30px";
    badge.style.padding = "7px 14px";
    badge.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";
    badge.style.fontSize = "12px";
    badge.style.letterSpacing = "-0.01em";
    badge.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)";
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.gap = "9px";
    badge.style.backdropFilter = "blur(16px)";
    badge.style.webkitBackdropFilter = "blur(16px)";
    badge.style.transition = "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)";

    badge.innerHTML = `
      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981;" id="cleanup-badge-dot"></span>
      <span id="cleanup-badge-text" style="font-weight: 500; color:#e2e8f0;">Ready</span>
      <button id="cleanup-badge-stop" style="background:rgba(239, 68, 68, 0.14); color:#fca5a5; border:1px solid rgba(239, 68, 68, 0.25); border-radius:20px; padding:3px 9px; font-size:10.5px; font-weight:600; cursor:pointer; transition:all 0.15s ease;">Stop</button>
    `;

    document.body.appendChild(badge);

    const stopBtn = document.getElementById("cleanup-badge-stop");
    stopBtn.addEventListener("mouseenter", () => {
      stopBtn.style.background = "rgba(239, 68, 68, 0.25)";
      stopBtn.style.color = "#fff";
    });
    stopBtn.addEventListener("mouseleave", () => {
      stopBtn.style.background = "rgba(239, 68, 68, 0.14)";
      stopBtn.style.color = "#fca5a5";
    });

    stopBtn.addEventListener("click", () => {
      triggerEmergencyStop("User clicked on-screen Emergency Stop button");
    });
  }

  function updateBadge(text, color = "#10b981") {
    createFloatingBadge();
    const dot = document.getElementById("cleanup-badge-dot");
    const label = document.getElementById("cleanup-badge-text");
    if (dot) dot.style.backgroundColor = color;
    if (label) label.innerText = text;
  }

  function triggerEmergencyStop(reason) {
    emergencyStop = true;
    updateBadge("STOPPED: " + (reason || "Interrupted"), "#ef4444");
    clearHighlight();
    console.warn("[CleanupAgent] Emergency stop triggered:", reason);
  }

  // --- Human-Like Helpers ---
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function randomDelay(minMs = 350, maxMs = 750) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return sleep(delay);
  }

  function clearHighlight() {
    if (activeOverlay && activeOverlay.parentNode) {
      activeOverlay.parentNode.removeChild(activeOverlay);
    }
    activeOverlay = null;
  }

  function highlightElement(el, label = "Target") {
    clearHighlight();
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.left = `${rect.left - 4}px`;
    overlay.style.top = `${rect.top - 4}px`;
    overlay.style.width = `${rect.width + 8}px`;
    overlay.style.height = `${rect.height + 8}px`;
    overlay.style.border = "3px solid #38bdf8";
    overlay.style.backgroundColor = "rgba(56, 189, 248, 0.15)";
    overlay.style.borderRadius = "8px";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "999998";
    overlay.style.transition = "all 0.15s ease";

    const tag = document.createElement("div");
    tag.innerText = label;
    tag.style.position = "absolute";
    tag.style.top = "-22px";
    tag.style.left = "0px";
    tag.style.backgroundColor = "#38bdf8";
    tag.style.color = "#0f172a";
    tag.style.fontSize = "11px";
    tag.style.fontWeight = "bold";
    tag.style.padding = "2px 6px";
    tag.style.borderRadius = "4px";
    overlay.appendChild(tag);

    document.body.appendChild(overlay);
    activeOverlay = overlay;
  }

  async function humanClick(el, label = "Clicking") {
    if (!el) throw new Error("Element to click is null or undefined");
    if (emergencyStop) throw new Error("Action cancelled by Emergency Stop");

    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    await sleep(250);

    highlightElement(el, label);
    await randomDelay(200, 450);

    if (emergencyStop) throw new Error("Action cancelled by Emergency Stop");

    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2 + (Math.random() * 6 - 3);
    const clientY = rect.top + rect.height / 2 + (Math.random() * 6 - 3);

    const eventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: clientX,
      clientY: clientY,
      button: 0,
      buttons: 1,
    };

    el.dispatchEvent(new PointerEvent("pointerover", eventInit));
    el.dispatchEvent(new MouseEvent("mouseover", eventInit));
    el.dispatchEvent(new PointerEvent("pointerenter", eventInit));
    el.dispatchEvent(new MouseEvent("mouseenter", eventInit));
    el.dispatchEvent(new PointerEvent("pointermove", eventInit));
    el.dispatchEvent(new MouseEvent("mousemove", eventInit));
    await sleep(40 + Math.random() * 40);

    el.dispatchEvent(new PointerEvent("pointerdown", eventInit));
    el.dispatchEvent(new MouseEvent("mousedown", eventInit));
    if (typeof el.focus === "function") el.focus();
    await sleep(40 + Math.random() * 60);

    el.dispatchEvent(new PointerEvent("pointerup", eventInit));
    el.dispatchEvent(new MouseEvent("mouseup", eventInit));
    el.dispatchEvent(new MouseEvent("click", eventInit));

    if (typeof el.click === "function") {
      try {
        el.click();
      } catch (e) {
        // ignore
      }
    }

    await sleep(150);
    clearHighlight();
  }

  // --- Find Checkboxes / Selection Targets on Images ---
  function findSelectableItems() {
    const checkboxes = Array.from(
      document.querySelectorAll("input[type='checkbox'], [role='checkbox'], button[aria-checked]")
    );

    if (checkboxes.length > 0) {
      return checkboxes.map((cb, idx) => ({
        index: idx,
        element: cb,
        type: "checkbox",
        checked: cb.checked || cb.getAttribute("aria-checked") === "true",
      }));
    }

    const cards = Array.from(
      document.querySelectorAll(
        "div[data-testid*='library-item'], div.group, article, div.relative"
      )
    ).filter((el) => {
      const hasImg = el.querySelector("img, svg, picture");
      const rect = el.getBoundingClientRect();
      return hasImg && rect.width > 60 && rect.height > 60;
    });

    const items = [];
    cards.forEach((card, idx) => {
      const selectorBtn = card.querySelector(
        "button[aria-label*='select' i], button[aria-label*='check' i], [role='checkbox'], div[class*='checkbox'], div[class*='circle']"
      );
      items.push({
        index: idx,
        element: selectorBtn || card,
        cardElement: card,
        type: selectorBtn ? "selector_button" : "card_click",
        checked: card.getAttribute("aria-selected") === "true" || card.classList.contains("selected"),
      });
    });

    return items;
  }

  // --- Smart Batch Delete Button Finder ---
  function findBatchDeleteButton() {
    const allClickables = Array.from(
      document.querySelectorAll("button, [role='button'], a[role='button']")
    ).filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    // Priority 1: Exact text "Delete" on a visible button
    for (const btn of allClickables) {
      const text = (btn.innerText || "").toLowerCase().trim();
      if (text === "delete") {
        console.log("[CleanupAgent] Found exact text Delete button:", btn);
        return btn;
      }
    }

    // Priority 2: Look inside any container that displays the selection count (e.g. "7 selected")
    const allContainers = Array.from(document.querySelectorAll("div, header, footer, [role='toolbar'], section, nav"));
    const selectionBars = allContainers.filter((el) => {
      const text = el.innerText || "";
      return /\b\d+\s+selected\b/i.test(text);
    });

    for (const bar of selectionBars) {
      const clickables = Array.from(
        bar.querySelectorAll("button, [role='button']")
      ).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      for (const btn of clickables) {
        const text = (btn.innerText || "").toLowerCase().trim();
        const aria = (btn.getAttribute("aria-label") || "").toLowerCase().trim();
        if (text === "delete" || aria === "delete" || text.includes("delete") || aria.includes("delete")) {
          return btn;
        }
      }
    }

    // Priority 3: Fallback attributes
    for (const btn of allClickables) {
      const aria = (btn.getAttribute("aria-label") || "").toLowerCase().trim();
      const title = (btn.getAttribute("title") || "").toLowerCase().trim();
      if (aria === "delete" || title === "delete") {
        return btn;
      }
    }

    return null;
  }

  // --- Smart Confirmation Modal Finder ---
  function findConfirmDeleteButton() {
    const modals = Array.from(
      document.querySelectorAll("[role='dialog'], [role='alertdialog'], div[data-state='open'], div[class*='modal']")
    );

    for (const modal of modals) {
      const buttons = Array.from(modal.querySelectorAll("button, [role='button']")).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      for (const btn of buttons) {
        const text = (btn.innerText || "").toLowerCase().trim();
        const cls = (btn.className || "").toString().toLowerCase();
        const isDelete = text === "delete" || text.includes("delete") || text === "confirm" || text.includes("remove");
        const isCancel = text.includes("cancel") || text.includes("no") || text.includes("keep");
        const isRed = cls.includes("red") || cls.includes("danger") || cls.includes("destructive");

        if ((isDelete || isRed) && !isCancel) {
          return btn;
        }
      }
    }

    // Global fallback for any visible button strictly labeled "Delete"
    const allButtons = Array.from(document.querySelectorAll("button, [role='button']")).filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    for (const b of allButtons) {
      const text = (b.innerText || "").toLowerCase().trim();
      if (text === "delete" || text === "delete items" || text === "delete images") {
        return b;
      }
    }

    return null;
  }

  // --- Dump All Interactive Elements for Diagnostics ---
  function dumpInteractiveElements() {
    return Array.from(document.querySelectorAll("button, [role='button'], input, [tabindex='0']"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map((el) => ({
        tag: el.tagName,
        text: (el.innerText || "").slice(0, 50).replace(/\n+/g, " "),
        aria: el.getAttribute("aria-label"),
        role: el.getAttribute("role"),
        class: (el.className || "").toString().slice(0, 60),
        parentText: el.parentElement ? (el.parentElement.innerText || "").slice(0, 60).replace(/\n+/g, " ") : "",
      }));
  }

  // --- DOM Scanner for ChatGPT Library ---
  function scanLibrary() {
    createFloatingBadge();
    updateBadge("Scanning Page...", "#38bdf8");

    const pageUrl = window.location.href;
    const pageTitle = document.title;

    const selectModeButtons = Array.from(document.querySelectorAll("button, [role='button']")).filter((b) => {
      const text = (b.innerText || "").toLowerCase().trim();
      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      return (
        text === "select" ||
        text === "select items" ||
        text === "multi-select" ||
        text.includes("select all") ||
        aria.includes("select")
      );
    }).map(b => ({
      text: b.innerText.trim(),
      aria: b.getAttribute("aria-label"),
      visible: b.getBoundingClientRect().width > 0
    }));

    const allImages = Array.from(document.querySelectorAll("img"))
      .filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width > 40 && rect.height > 40;
      })
      .map((img, idx) => {
        const rect = img.getBoundingClientRect();
        return {
          index: idx,
          alt: img.alt || "Image",
          src: img.src ? img.src.substring(0, 90) + "..." : "none",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

    const selectable = findSelectableItems();

    const selectionBars = Array.from(
      document.querySelectorAll("div, header, footer, [role='toolbar']")
    ).filter((el) => {
      const text = (el.innerText || "").toLowerCase();
      return text.includes("selected") && (text.includes("delete") || text.includes("remove") || el.querySelector("button"));
    }).map((b) => ({
      text: (b.innerText || "").slice(0, 150).replace(/\n+/g, " "),
      buttons: Array.from(b.querySelectorAll("button, [role='button']")).map(
        (btn) => btn.innerText.trim() || btn.getAttribute("aria-label")
      ),
    }));

    const openModals = Array.from(
      document.querySelectorAll("[role='dialog'], [role='alertdialog'], div[data-state='open']")
    ).map((m) => ({
      text: (m.innerText || "").slice(0, 200).replace(/\n+/g, " "),
      buttons: Array.from(m.querySelectorAll("button, [role='button']")).map((b) => b.innerText.trim()),
    }));

    updateBadge("Ready", "#10b981");

    return {
      url: pageUrl,
      title: pageTitle,
      total_images_found: allImages.length,
      images_sample: allImages.slice(0, 5),
      selectable_items_found: selectable.length,
      select_mode_buttons: selectModeButtons,
      active_selection_toolbars: selectionBars,
      open_modals: openModals,
      raw_snippet: (document.querySelector("main") || document.body).innerText.slice(0, 500).replace(/\n+/g, " "),
    };
  }

  // --- Random Batch Size Generator (6 to 9 items) ---
  function getRandomBatchSize(min = 6, max = 9) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // --- Perform Batch Delete (Random 6 to 9 items) ---
  async function performBatchDelete(batchSize = 0) {
    if (emergencyStop) throw new Error("Emergency stop is active. Reset first.");

    // If batch size is 0 or not specified, pick randomly between 6 and 9
    const actualBatchSize = (batchSize && batchSize > 0) ? batchSize : getRandomBatchSize(6, 9);

    updateBadge(`Starting batch delete (${actualBatchSize} items)...`, "#f59e0b");

    // 1. Enter Select Mode if button exists
    const selectButtons = Array.from(document.querySelectorAll("button, [role='button']")).filter((b) => {
      const text = (b.innerText || "").toLowerCase().trim();
      return text === "select" || text === "select items" || text === "multi-select";
    });

    if (selectButtons.length > 0 && selectButtons[0].getBoundingClientRect().width > 0) {
      console.log("[CleanupAgent] Clicking 'Select' mode toggle button...");
      await humanClick(selectButtons[0], "Enter Select Mode");
      await randomDelay(350, 600);
    }

    // 2. Find selectable items
    let selectables = findSelectableItems();
    if (selectables.length === 0) {
      throw new Error("No selectable items or checkboxes found on the page.");
    }

    const unselected = selectables.filter((item) => !item.checked);
    const toSelect = unselected.slice(0, actualBatchSize);

    if (toSelect.length === 0) {
      return { success: false, deleted_in_batch: 0, message: "No unselected items remaining to select." };
    }

    console.log(`[CleanupAgent] Selecting ${toSelect.length} items (random 6-9 mode) with human delays...`);

    // 3. Select each item one by one
    for (let i = 0; i < toSelect.length; i++) {
      if (emergencyStop) throw new Error("Emergency stop interrupted batch selection.");

      const item = toSelect[i];
      updateBadge(`Selecting item ${i + 1}/${toSelect.length}...`, "#38bdf8");

      if (item.cardElement) {
        item.cardElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        await sleep(60);
      }

      await humanClick(item.element, `Select #${i + 1}`);
      await randomDelay(250, 500);
    }

    updateBadge(`Selected ${toSelect.length} items. Locating Delete button...`, "#f59e0b");
    await randomDelay(500, 900);

    // 4. Find the batch Delete button using smart multi-strategy locator
    const batchDeleteBtn = findBatchDeleteButton();

    if (!batchDeleteBtn) {
      const diagnostics = dumpInteractiveElements();
      console.error("[CleanupAgent] Could not find Delete button. Available buttons:", diagnostics);
      throw new Error(
        `Selected ${toSelect.length} items, but could not locate the batch Delete button. Found ${diagnostics.length} visible buttons on page.`
      );
    }

    console.log("[CleanupAgent] Clicking batch Delete button...");
    await humanClick(batchDeleteBtn, "Click Delete");
    await randomDelay(800, 1400);

    // 5. Look for secondary Confirmation Modal dialog ("Delete", "Confirm", "Yes")
    let confirmBtn = null;
    for (let w = 0; w < 10; w++) {
      confirmBtn = findConfirmDeleteButton();
      if (confirmBtn) break;
      await sleep(250);
    }

    if (confirmBtn) {
      console.log("[CleanupAgent] Confirming deletion in modal dialog...");
      await humanClick(confirmBtn, "Confirm Delete");
      updateBadge("Processing deletion on server...", "#38bdf8");
      await randomDelay(2500, 4000);
    } else {
      console.log("[CleanupAgent] No modal confirmation appeared, proceeding...");
      await randomDelay(1500, 2500);
    }

    updateBadge(`Batch of ${toSelect.length} deleted!`, "#10b981");

    const remaining = findSelectableItems().filter(i => !i.checked).length;
    return {
      success: true,
      deleted_in_batch: toSelect.length,
      approx_remaining: remaining,
      message: `Successfully deleted batch of ${toSelect.length} items.`,
    };
  }

  // --- Continuous Loop Deletion (Random 6-9 items per batch) ---
  async function performLoopDelete(maxBatches = 20) {
    if (emergencyStop) throw new Error("Emergency stop is active. Reset first.");

    let totalDeleted = 0;
    let completedBatches = 0;

    console.log(`[CleanupAgent] Starting auto loop deletion (up to ${maxBatches} batches)...`);

    for (let b = 1; b <= maxBatches; b++) {
      if (emergencyStop) {
        console.warn("[CleanupAgent] Loop stopped by Emergency Stop.");
        break;
      }

      // Check available items
      const unselected = findSelectableItems().filter((i) => !i.checked);
      if (unselected.length === 0) {
        console.log("[CleanupAgent] No more unselected items found on page.");
        updateBadge("All visible items cleaned up!", "#10b981");
        break;
      }

      const randomTarget = getRandomBatchSize(6, 9);
      updateBadge(`Loop: Batch ${b}/${maxBatches} (Target: ${randomTarget})...`, "#f59e0b");

      const res = await performBatchDelete(randomTarget);
      if (!res.success || res.deleted_in_batch === 0) {
        console.log("[CleanupAgent] No items deleted in this batch. Ending loop.");
        break;
      }

      totalDeleted += res.deleted_in_batch;
      completedBatches++;

      // Check if more items remain
      const remainingAfter = findSelectableItems().filter((i) => !i.checked);
      if (remainingAfter.length === 0 || b === maxBatches) {
        updateBadge(`Loop Complete: ${totalDeleted} images deleted!`, "#10b981");
        break;
      }

      // Human pause between batches (2.5s to 4.5s) with random jitter
      const pauseMs = Math.floor(Math.random() * 2000) + 2500;
      updateBadge(`Batch ${b} done. Human pause (${(pauseMs / 1000).toFixed(1)}s)...`, "#38bdf8");
      console.log(`[CleanupAgent] Human pause between batches: ${(pauseMs / 1000).toFixed(1)}s`);
      await sleep(pauseMs);
    }

    return {
      success: true,
      completed_batches: completedBatches,
      total_deleted: totalDeleted,
      message: `Loop completed: ${completedBatches} batches processed, ${totalDeleted} images deleted in total.`,
    };
  }

  // --- Message Listener from Background Worker ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[CleanupAgent] Received action:", request.action);

    if (request.action === "ping") {
      createFloatingBadge();
      sendResponse({ status: "ok", url: window.location.href });
      return false;
    }

    if (request.action === "emergency_stop") {
      triggerEmergencyStop("Command received from agent/popup");
      sendResponse({ status: "stopped" });
      return false;
    }

    if (request.action === "reset_stop") {
      emergencyStop = false;
      updateBadge("Ready", "#10b981");
      sendResponse({ status: "ready" });
      return false;
    }

    if (request.action === "scan") {
      try {
        const scanData = scanLibrary();
        sendResponse({ status: "success", data: scanData });
      } catch (err) {
        sendResponse({ status: "error", error: err.message });
      }
      return false;
    }

    if (request.action === "dump_buttons") {
      try {
        const buttons = dumpInteractiveElements();
        sendResponse({ status: "success", buttons: buttons });
      } catch (err) {
        sendResponse({ status: "error", error: err.message });
      }
      return false;
    }

    if (request.action === "select_test") {
      (async () => {
        try {
          const selectables = findSelectableItems();
          const toSelect = selectables.slice(0, request.count || 2);
          for (let i = 0; i < toSelect.length; i++) {
            await humanClick(toSelect[i].element, `Select Test #${i + 1}`);
            await randomDelay(300, 500);
          }
          await sleep(500);
          // Now scan for the toolbar and buttons
          const buttons = dumpInteractiveElements();
          const batchDeleteBtn = findBatchDeleteButton();
          sendResponse({
            status: "success",
            selected_count: toSelect.length,
            batch_delete_found: !!batchDeleteBtn,
            batch_delete_info: batchDeleteBtn ? {
              tag: batchDeleteBtn.tagName,
              text: batchDeleteBtn.innerText,
              aria: batchDeleteBtn.getAttribute("aria-label"),
              class: (batchDeleteBtn.className || "").toString().slice(0, 60)
            } : null,
            buttons: buttons
          });
        } catch (e) {
          sendResponse({ status: "error", error: e.message });
        }
      })();
      return true;
    }

    if (request.action === "batch_delete") {
      const size = request.batch_size || 0; // 0 triggers random 6-9
      performBatchDelete(size)
        .then((res) => sendResponse({ status: "success", result: res }))
        .catch((err) => sendResponse({ status: "error", error: err.message }));
      return true;
    }

    if (request.action === "loop_delete") {
      const maxBatches = request.max_batches || 20;
      performLoopDelete(maxBatches)
        .then((res) => sendResponse({ status: "success", result: res }))
        .catch((err) => sendResponse({ status: "error", error: err.message }));
      return true;
    }

    if (request.action === "evaluate") {
      try {
        const fn = new Function(request.code);
        const res = fn();
        sendResponse({ status: "success", result: res });
      } catch (err) {
        sendResponse({ status: "error", error: err.message });
      }
      return false;
    }

    sendResponse({ status: "unknown_action", action: request.action });
    return false;
  });

  createFloatingBadge();
})();
