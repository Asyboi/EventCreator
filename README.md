# EventCreator

A Chrome extension that uses voice speech-to-text to automatically create events on Google Calendar.

## Features

- 🎤 Voice-to-text recording using browser's Web Speech API
- 📅 Google Calendar integration via OAuth
- 🔐 Secure Google OAuth authentication
- ⚡ Quick event creation from voice input

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Chrome App" as the application type
   - Enter your extension ID (you'll get this after loading the extension)
   - Download the client ID
5. Copy your **Client ID** (it looks like: `xxxxx.apps.googleusercontent.com`)

### 2. Configure the Extension

1. Open `manifest.json`
2. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from step 1

### 3. Create Extension Icons (Optional)

The extension expects icon files (`icon16.png`, `icon48.png`, `icon128.png`). You can:
- Create your own icons (16x16, 48x48, 128x128 pixels)
- Use placeholder images for now
- The extension will work without icons, but Chrome may show warnings

### 4. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `EventCreator` folder
5. Note your Extension ID (shown on the extension card)

### 5. Update OAuth Credentials (if needed)

If you created OAuth credentials before loading the extension:
1. Go back to Google Cloud Console
2. Edit your OAuth client ID
3. Add your Extension ID to the authorized Chrome App IDs
4. Save changes

## Usage

1. Click the extension icon in Chrome toolbar
2. Click "Sign in with Google" to authenticate
3. Click "Start Recording" to begin voice input
4. Speak your event details
5. Fill in the event form (title, start/end times, description)
6. Click "Create Event" to add it to your Google Calendar

## Project Structure

```
EventCreator/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Styles for popup
├── popup.js              # Frontend logic (speech-to-text, UI)
├── background.js         # Background service worker (OAuth, Calendar API)
└── README.md             # This file
```

## Development Notes

- The extension uses Chrome's `chrome.identity` API for OAuth
- Speech recognition uses the browser's Web Speech API (webkitSpeechRecognition)
- Calendar events are created via Google Calendar API v3
- All API calls are made from the background service worker

## Next Steps

This is a basic template. Consider adding:
- Natural language processing to parse event details from voice
- Event date/time extraction from transcript
- Error handling improvements
- UI enhancements
- Event editing capabilities
- Multiple calendar support
