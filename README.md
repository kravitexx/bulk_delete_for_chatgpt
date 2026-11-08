# ChatGPT Library Bulk Deleter 🚀

A lightweight Chrome Extension that safely and automatically bulk deletes images and files from your **ChatGPT Library** (`https://chatgpt.com/library?tab=all`) without crashing ChatGPT or triggering bot detection.

> **💡 No Terminal or Python Required!**  
> This extension runs **100% standalone inside Google Chrome**. You do **NOT** need to install Python, run any servers, or open a terminal. Just load the extension into Chrome and click the button!

---

## 🧐 Why This Tool Was Built

If you use DALL·E or upload lots of images to ChatGPT, cleaning your library manually is painful:
1. **Selecting "All" or large batches fails:** When you select dozens of images at once, OpenAI's backend API often times out, throws an error, or freezes the webpage.
2. **The 6–9 Item Sweet Spot:** Selecting small batches of **6 to 9 items** deletes reliably every single time. Doing this by hand for hundreds of images takes hours.
3. **Bot Detection & Google Login Blocks:** Using typical automation tools (Selenium, Puppeteer) gets your browser flagged, preventing Google sign-in with *"This browser or app may not be secure"*.

### The Solution:
This tool runs as a **standard Chrome Extension inside your everyday Chrome browser**:
- ✅ **Zero Bot Detection:** Runs in your normal, logged-in browser session (`navigator.webdriver` is false).
- 🎲 **Smart Random Batching:** Selects randomized batches (sometimes 6, 7, 8, or 9 items) to mimic natural human behavior.
- ⚡ **Full Native Event Simulation:** Dispatches real pointer, mouse, and focus events with jittered delays and smooth scrolling.
- ⏱️ **Natural Human Pauses:** Automatically pauses (2.5s to 4.5s) between batches so OpenAI's servers process each deletion cleanly.
- 🛡️ **Human in the Loop:** Real-time visual blue highlights on what is being deleted, plus an instant **Emergency Stop** button.
- 📜 **Audit Log & History:** Keeps a persistent record of all confirmed deleted files, exportable to a text file with one click.
- 🔌 **100% Standalone:** Works completely inside Chrome via the extension popup. No background server needed!

---

## 🛠️ Quick Installation (Takes 1 Minute)

### 1. Download This Repository
```bash
git clone https://github.com/kravitexx/bulk_delete_for_chatgpt.git
```
*(Or click **Code > Download ZIP** at the top of GitHub and extract it to a folder).*

### 2. Load the Extension into Chrome
1. Open Google Chrome and go to:
   ```
   chrome://extensions
   ```
2. In the top-right corner, turn **Developer mode** **ON** (toggle switch).
3. Click the **Load unpacked** button in the top-left.
4. Select the **`extension`** folder inside this repository:
   ```
   bulk_delete_for_chatgpt/extension
   ```

---

## 🚀 How to Use It (No Server Needed!)

1. Open your ChatGPT library in Chrome:
   👉 **`https://chatgpt.com/library?tab=all`**
   *(Make sure you are logged in).*

2. Look at the bottom-right corner of the webpage—you will see a small status badge:
   `🟢 Ready [Stop]`

3. Click the **ChatGPT Cleanup Agent** icon in your Chrome extensions toolbar:
   - Click **`👁️ Preview Next Batch`** to see the exact filenames that will be deleted next.
   - Click **`🔁 Start Auto Loop (Random 6-9)`** to automatically clean up visible library images in randomized batches.
   - Click **`🗑️ Delete 1 Batch (Random 6-9)`** to delete just one single batch.
   - Click **`📥 Export Audit Log`** at any time to download a timestamped record of all confirmed deletions.

4. **Emergency Stop:** 
   Click the red **⛔ Stop** button in the popup or on your screen at any moment to immediately halt operations.

---

## 🛡️ Safety, Verification & Edge Cases

When running automated deletions, safety and predictability are critical:

### 1. Pre-Deletion File Preview
Before deleting, click **"Preview Next Batch"** in the popup to see a list of the exact filenames scheduled for the next batch.

### 2. Persistent Deletion Audit Log
Every confirmed deletion is permanently logged with timestamps to your local Chrome storage (`chrome.storage.local`). You can click **"Export Audit Log"** anytime to download `chatgpt_deletion_log.txt` showing every file that was removed.

### 3. Strict Fail-Stop Verification (No Blind Continuation)
If an item fails to delete, OpenAI displays an error toast, or the DOM does not update after the modal confirmation:
- The extension **immediately halts the loop**.
- It does **not** proceed to the next batch.
- It displays the exact error message so you can inspect the tab before taking further action.

### 4. Network Disconnection Guard
The extension continuously monitors network connectivity via `navigator.onLine`. If your Wi-Fi or connection drops halfway through a batch, the script terminates immediately to prevent partial state mismatches.

### 5. Page Reload & Crash Safety
All loop automation runs in-memory inside the active DOM. If the webpage reloads, refreshes, or crashes, **the loop stops dead in its tracks**. It will never run autonomously or unattended in the background across page reloads.

### 6. Recommended: Backup First
Because file deletions in ChatGPT cannot be undone, we recommend downloading any critical images or requesting a data export (*Settings > Data Controls > Export data*) before executing large bulk deletions.

---

## 💻 For Developers Only: Optional Python Bridge (`bridge.py`)

> **Note for standard users:** You can completely ignore `bridge.py`! The extension works standalone without it.

If you are a developer and want to control the extension externally via CLI scripts or an AI coding assistant (like Antigravity / Claude):

1. Install requirements:
   ```bash
   pip install websockets
   ```

2. Start the local bridge:
   ```bash
   python bridge.py server
   ```

3. In another terminal window:
   ```bash
   python bridge.py scan        # Inspects page & lists visible items
   python bridge.py batch       # Deletes 1 batch of random 6-9 images
   python bridge.py loop 10     # Runs 10 batches in a continuous loop
   python bridge.py stop        # Triggers emergency stop
   ```

---

## 📋 Features & Settings

| Feature | Description |
|---|---|
| **No Server Required** | Works 100% inside Chrome via native extension communication (`chrome.tabs.sendMessage`). |
| **Audit Trail** | Automatically records all confirmed deletions; exportable with one click. |
| **Batch Preview** | Inspects and displays the exact filenames about to be deleted. |
| **Fail-Stop Protection** | Immediately halts if a deletion fails, server errors occur, or the DOM desyncs. |
| **Network Guard** | Automatically stops if internet connection drops mid-batch. |
| **Randomized 6–9 Sizing** | Alternates between 6, 7, 8, and 9 items per batch to avoid server rate-limits and bot heuristics. |
| **Visual Outlines** | Displays a glowing blue indicator over cards being selected so you can monitor progress. |
| **Emergency Stop** | Available both on-page and in the popup for instant cancellation. |

---

## ⚠️ Disclaimer

This tool is an independent open-source helper for automating repetitive personal library cleanup tasks. It is not affiliated with, endorsed by, or associated with OpenAI. Please use responsibly and ensure you do not delete files you wish to keep.

---

## 📄 License
MIT License. Free for personal and commercial use.
