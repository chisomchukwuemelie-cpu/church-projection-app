# Lumina Pro - User Guide

## 1. Getting Started

### Starting the App
Double-click the **`start_dev.bat`** file in your project folder.
This will:
1.  Open a terminal window (keep this open!).
2.  Launch the Dashboard in your browser (usually at `http://localhost:5173`).

### First Time Setup
1.  **Get an API Key**: Go to [Google AI Studio](https://makersuite.google.com/app/apikey) and create a free Gemini API Key.
2.  **Open Settings**: Click the **Gear Icon** in the top-right corner of the Dashboard.
3.  **Enter Key**: Paste your key into the "Gemini API Key" field.
4.  **Save**: Click "Save Changes". The app will reload.

---

## 2. Using the Projector
1.  In the Dashboard header, click **"Open Projector"**.
2.  A new window will open with the "Lumina" logo.
3.  Drag this window to your **Second Screen** (Projector) and make it fullscreen (`F11`).

**Note:** The Projector must be opened from the *same browser* as the Dashboard for them to sync.

---

## 3. Voice Commands & Features

### 🎤 Voice Control
Just speak naturally into the microphone. The AI will detect:

*   **Scripture**: "Exodus chapter 4 verse 5" -> *Displays Exodus 4:5*
*   **Lyrics**: "Amazing Grace how sweet the sound" -> *Displays Song Lyrics*
*   **Media**: 
    *   "Show video mountains" -> *Background changes to mountains video*
    *   "Show image stars" -> *Background changes to stars image*
    *   "Theme blue" -> *Background color changes to blue*
*   **Commands**:
    *   "Show Logo" -> *Displays Church Logo*
    *   "Clear Screen" -> *Goes to Black*

### 💻 Dashboard Control
The Dashboard has 3 main areas:
*   **Left (Stream)**: Shows what the AI is hearing in real-time. Click any item to "Stage" it.
*   **Center (Staging)**: Edit content before showing it. Use the theme buttons to pick a background.
*   **Right (Live)**: Shows what is currently on the Projector.

### ⚙️ Settings
*   **Default Translation**: Change between KJV, NIV, MSG, etc. (Note: Some modern translations might require internet access or fallback to KJV if restricted).
*   **Auto-Start**: Choose if the Projector window opens automatically when you start the app.

---

## 4. Troubleshooting

*   **"White Screen" on Projector?**
    *   Refresh the Projector window.
    *   Ensure both windows are from the same browser session.

*   **AI Not Responding?**
    *   Check your Microphone permissions in the browser URL bar.
    *   Verify your API Key in Settings.

*   **App Won't Start?**
    *   Try running `start_dev.bat` again.
    *   If it says "EADDRINUSE", close other terminal windows and try again.
