# EventCreator

A Chrome extension that uses voice speech-to-text to automatically create events on Google Calendar.

## Features

- 🎤 Voice-to-text recording using browser's Web Speech API
- 📅 Google Calendar integration via OAuth
- 🔐 Secure Google OAuth authentication
- ⚡ Quick event creation from voice input

## Setup Instructions

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `EventCreator` folder
5. **Note your Extension ID** (shown on the extension card - you'll need this for OAuth setup)

### 2. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (or "Internal" if using Google Workspace)
   - Fill in the required app information
   - Add scopes: `https://www.googleapis.com/auth/calendar`
   - Add your email address as a test user (under "Test users")
   - Save
5. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - **Choose "Web application" as the application type** (important!)
   - Name it (e.g., "EventCreator Extension")
   - Under "Authorized redirect URIs", click "ADD URI"
   - Add: `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`
     - Replace `<YOUR_EXTENSION_ID>` with your Extension ID from step 1
     - Example: `https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/`
   - Click "CREATE"
6. Copy your **Client ID** (it looks like: `xxxxx.apps.googleusercontent.com`)

### 3. Configure the Extension

1. Open `background.js`
2. Find the `CLIENT_ID` constant near the top
3. Replace it with your actual Client ID from step 2
4. Save the file
5. Reload the extension in Chrome (`chrome://extensions/` → click reload icon)

### 4. Test Authentication

1. Click the extension icon in Chrome toolbar
2. Click "Sign in with Google"
3. Authorize the extension to access your Google Calendar
4. You should now be signed in and ready to create events!

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
├── config.md             # Configuration notes and Client ID reference
└── README.md             # This file
```

## Development Notes

- The extension uses Chrome's `chrome.identity.launchWebAuthFlow` API for OAuth
- OAuth client must be of type **Web application** (not Chrome App)
- Redirect URI format: `https://<extension-id>.chromiumapp.org/`
- Speech recognition uses the browser's Web Speech API (webkitSpeechRecognition)
- Calendar events are created via Google Calendar API v3
- All API calls are made from the background service worker
- Client ID is configured in `background.js` (not in manifest.json)

## Troubleshooting

### "Invalid OAuth2 Client ID" Error
- Make sure your OAuth client type is **Web application** (not Chrome App)
- Verify the redirect URI matches exactly in Google Cloud Console (including trailing slash)
- Check that your Extension ID is correct

### "access_type 'offline' not allowed" Error
- This should be fixed in the current code, but if you see it:
  - Make sure you've reloaded the extension after updating the code
  - Clear browser cache/cookies for Google OAuth

### OAuth Consent Screen Issues
- Make sure you've added yourself as a test user in OAuth consent screen
- Verify Google Calendar API scope is added to the consent screen
- If in "Testing" mode, only test users can sign in

## Next Steps

This is a basic template. Consider adding:
- Natural language processing to parse event details from voice
- Event date/time extraction from transcript
- Error handling improvements
- UI enhancements
- Event editing capabilities
- Multiple calendar support
