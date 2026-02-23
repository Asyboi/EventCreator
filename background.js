// Background service worker for Chrome extension

const CLIENT_ID = '88999294083-730pn8kp48jsrq0jci8elojnht9hqfhu.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Log when service worker loads
console.log('EventCreator background service worker loaded');
console.log('Client ID:', CLIENT_ID);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action);
  
  if (request.action === 'checkAuth') {
    checkAuthStatus().then(authenticated => {
      sendResponse({ authenticated });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getRedirectURI') {
    const redirectURI = getRedirectURI();
    console.log('getRedirectURI response:', redirectURI);
    sendResponse({ redirectURI, clientId: CLIENT_ID });
    return true; // Keep channel open
  }

  if (request.action === 'authenticate') {
    console.log('Starting authentication...');
    authenticate().then(result => {
      console.log('Authentication result:', result);
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'logout') {
    logout().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getCalendars') {
    getCalendars().then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'getColors') {
    getColors().then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'createEvent') {
    createCalendarEvent(request.event).then(result => {
      sendResponse(result);
    });
    return true;
  }
});

// Get redirect URI for Chrome extension
function getRedirectURI() {
  const redirectURI = chrome.identity.getRedirectURL();
  console.log('getRedirectURI() called, returning:', redirectURI);
  return redirectURI;
}

// Check if user is authenticated
async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken'], (result) => {
      resolve(!!result.accessToken);
    });
  });
}

// Authenticate user with Google OAuth using launchWebAuthFlow
async function authenticate() {
  return new Promise((resolve) => {
    const redirectURI = getRedirectURI();
    
    // Validate redirect URI format
    if (!redirectURI || !redirectURI.includes('.chromiumapp.org')) {
      const error = `Invalid redirect URI format: ${redirectURI}. Make sure extension is loaded correctly.`;
      console.error(error);
      resolve({
        success: false,
        error: error
      });
      return;
    }
    
    const authURL = buildAuthURL(redirectURI);
    
    console.log('=== OAuth Configuration ===');
    console.log('Redirect URI:', redirectURI);
    console.log('Client ID:', CLIENT_ID);
    console.log('Full Auth URL:', authURL);
    console.log('Make sure this EXACT redirect URI is in Google Cloud Console:');
    console.log(redirectURI);
    console.log('==========================');
    
    chrome.identity.launchWebAuthFlow(
      {
        url: authURL,
        interactive: true
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error('=== OAuth Error Details ===');
          console.error('Error:', error);
          console.error('Redirect URI used:', redirectURI);
          console.error('Client ID:', CLIENT_ID);
          console.error('==========================');
          resolve({
            success: false,
            error: `${error}. Redirect URI: ${redirectURI}. Check Service Worker console for details.`
          });
        } else {
          console.log('OAuth response received');
          // Extract access token from response URL
          const params = new URLSearchParams(new URL(responseUrl).hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresIn = params.get('expires_in');
          
          if (accessToken) {
            const expiresAt = expiresIn ? Date.now() + (parseInt(expiresIn) * 1000) : null;
            
            chrome.storage.local.set({ 
              accessToken: accessToken,
              refreshToken: refreshToken || null,
              expiresAt: expiresAt
            }, () => {
              resolve({ success: true, token: accessToken });
            });
          } else {
            // Check for error in response
            const error = params.get('error');
            const errorDescription = params.get('error_description');
            resolve({
              success: false,
              error: error ? `${error}: ${errorDescription || ''}` : 'Failed to extract access token from response'
            });
          }
        }
      }
    );
  });
}

// Build OAuth authorization URL
function buildAuthURL(redirectURI) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectURI,
    response_type: 'token',
    scope: SCOPES.join(' ')
  });
  
  const authURL = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('Built auth URL:', authURL);
  console.log('URL parameters:', params.toString());
  
  // Verify no access_type in URL
  if (authURL.includes('access_type')) {
    console.error('ERROR: access_type found in URL!');
  }
  
  return authURL;
}

// Logout user
async function logout() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['accessToken', 'refreshToken', 'expiresAt'], () => {
      resolve();
    });
  });
}

// Get access token (check if expired and refresh if needed)
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['accessToken', 'refreshToken', 'expiresAt'], async (result) => {
      if (result.accessToken) {
        // Check if token is expired
        if (!result.expiresAt || Date.now() < result.expiresAt) {
          resolve(result.accessToken);
        } else if (result.refreshToken) {
          // Try to refresh the token
          try {
            const newToken = await refreshAccessToken(result.refreshToken);
            resolve(newToken);
          } catch (error) {
            // If refresh fails, need to re-authenticate
            reject(new Error('Token expired. Please sign in again.'));
          }
        } else {
          reject(new Error('Token expired. Please sign in again.'));
        }
      } else {
        reject(new Error('Not authenticated. Please sign in.'));
      }
    });
  });
}

// Refresh access token
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in * 1000);
  
  await new Promise((resolve) => {
    chrome.storage.local.set({
      accessToken: data.access_token,
      expiresAt: expiresAt
    }, resolve);
  });

  return data.access_token;
}

// Get user's calendar list
async function getCalendars() {
  try {
    const token = await getAccessToken();
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch calendars');
    }

    const data = await response.json();
    const calendars = (data.items || []).map(item => ({
      id: item.id,
      summary: item.summary || item.id,
      colorId: item.colorId || null,
      backgroundColor: item.backgroundColor || null,
      primary: item.primary === true
    }));

    return {
      success: true,
      calendars
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get event color palette
async function getColors() {
  try {
    const token = await getAccessToken();
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/colors',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch colors');
    }

    const data = await response.json();
    const eventColors = data.event || {};

    return {
      success: true,
      colors: eventColors
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Create calendar event
async function createCalendarEvent(eventData) {
  try {
    const token = await getAccessToken();
    const calendarId = eventData.calendarId || 'primary';
    const encodedCalendarId = encodeURIComponent(calendarId);
    
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      ...(eventData.colorId && { colorId: eventData.colorId }),
      start: {
        dateTime: new Date(eventData.start).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(eventData.end).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create event');
    }

    const result = await response.json();
    return {
      success: true,
      eventId: result.id,
      eventLink: result.htmlLink
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
