# Configuration

## Google OAuth Client ID
```
88999294083-730pn8kp48jsrq0jci8elojnht9hqfhu.apps.googleusercontent.com
```

## Setup Checklist

- [x] Client ID created in Google Cloud Console
- [ ] Extension ID obtained (from chrome://extensions/)
- [ ] Redirect URI added to OAuth Client in Google Cloud Console
- [ ] Google Calendar API enabled in Google Cloud Console
- [ ] Extension loaded in Chrome

## OAuth Setup Instructions

### Option 1: Create New Web Application OAuth Client (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. Select **Web application** as the application type
5. Name it (e.g., "EventCreator Extension")
6. Under **Authorized redirect URIs**, click **ADD URI**
7. Get your Extension ID from `chrome://extensions/` (shown on extension card)
8. Add redirect URI: `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`
   - Replace `<YOUR_EXTENSION_ID>` with your actual Extension ID
   - Example: `https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/`
9. Click **CREATE**
10. Copy the new Client ID and update it in `background.js` (replace the CLIENT_ID constant)
11. Make sure **Google Calendar API** is enabled in the API Library

### Option 2: Update Existing Chrome Extension OAuth Client

If you want to keep your existing Chrome Extension OAuth client:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth Client ID
4. Change the application type to **Web application** (if possible)
5. Add the redirect URI as described above

## Important Notes

- **Yes, your extension will still be a Chrome extension!** The OAuth client type only affects authentication, not the extension itself.
- The extension uses `chrome.identity.launchWebAuthFlow` which works with Web Application OAuth clients
- The redirect URI format is: `https://<extension-id>.chromiumapp.org/`
- Make sure Google Calendar API is enabled
