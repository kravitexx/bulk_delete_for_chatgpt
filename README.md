# ChatGPT Library Bulk Deleter 🚀

A lightweight Chrome Extension that safely and automatically bulk deletes images and files from your **ChatGPT Library** (`https://chatgpt.com/library?tab=all`) without crashing ChatGPT or triggering bot detection.

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
- 🔌 **Standalone:** Works completely inside Chrome via the extension popup. (No terminal or Python required for standard use!)

---

## 🛠️ Quick Installation (Takes 1 Minute)

### 1. Clone or Download This Repository
```bash
git clone https://github.com/kravitexx/bulk_delete_for_chatgpt.git
```
*(Or click **Code > Download ZIP** on GitHub and extract it to a folder).*

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

## 🚀 How to Use It

1. Open your ChatGPT library in Chrome:
   👉 **`https://chatgpt.com/library?tab=all`**
   *(Make sure you are logged in).*

2. Look at the bottom-right corner of the webpage—you will see a small status badge:
   `🟢 Agent: Ready [Emergency Stop]`

3. Click the **ChatGPT Cleanup Agent** icon in your Chrome extensions toolbar:
   - Click **`🔁 Start Auto Loop (Random 6-9)`** to automatically clean up all visible library images in randomized batches.
   - Or click **`🗑️ Delete 1 Batch (Random 6-9)`** if you want to delete just one batch at a time.

4. **Emergency Stop:** 
   Click the red **⛔ Emergency Stop** button in the popup or on your screen at any moment to immediately halt operations.

---

## 💻 Optional: Python CLI & Bridge Control (For Developers)

If you prefer controlling the cleanup from your terminal or integrating with AI agent scripts:

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
| **Randomized 6–9 Sizing** | Alternates between 6, 7, 8, and 9 items per batch to avoid server rate-limits and bot heuristics. |
| **Visual Outlines** | Displays a glowing blue indicator over cards being selected so you can monitor progress. |
| **Modal Confirmation** | Automatically confirms the ChatGPT deletion popup dialog. |
| **Emergency Stop** | Available both on-page and in the popup for instant cancellation. |

---

## ⚠️ Disclaimer

This tool is an independent open-source helper for automating repetitive personal library cleanup tasks. It is not affiliated with, endorsed by, or associated with OpenAI. Please use responsibly and ensure you do not delete files you wish to keep.

---

## 📄 License
MIT License. Free for personal and commercial use.
