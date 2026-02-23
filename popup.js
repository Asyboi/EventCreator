// Check authentication status on load
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await checkAuthStatus();
  
  if (isAuthenticated) {
    showMainSection();
  } else {
    showAuthSection();
  }
});

// Auth section elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const authStatus = document.getElementById('auth-status');
const debugInfo = document.getElementById('debug-info');
const redirectUriDisplay = document.getElementById('redirect-uri-display');
const clientIdDisplay = document.getElementById('client-id-display');
const showDebugBtn = document.getElementById('show-debug-btn');

// Recording elements
const recordBtn = document.getElementById('record-btn');
const recordIcon = document.getElementById('record-icon');
const recordText = document.getElementById('record-text');
const transcriptDisplay = document.getElementById('transcript-display');

// Event creation elements
const calendarSelect = document.getElementById('calendar-select');
const colorSelect = document.getElementById('color-select');
const eventTitleInput = document.getElementById('event-title');
const eventStartInput = document.getElementById('event-start');
const eventEndInput = document.getElementById('event-end');
const eventDescriptionInput = document.getElementById('event-description');
const createEventBtn = document.getElementById('create-event-btn');
const statusMessage = document.getElementById('status-message');

let recognition = null;
let isRecording = false;

// Store default values for form reset
let primaryCalendarId = 'primary';
let primaryColorId = '1';

// Event color names (fallback when API doesn't return)
const EVENT_COLOR_NAMES = {
  '1': 'Lavender',
  '2': 'Sage',
  '3': 'Grape',
  '4': 'Flamingo',
  '5': 'Banana',
  '6': 'Tangerine',
  '7': 'Peacock',
  '8': 'Graphite',
  '9': 'Blueberry',
  '10': 'Basil',
  '11': 'Tomato'
};

// Map calendar colorId (1-24) to event colorId (1-11)
function mapCalendarColorToEventColor(calendarColorId) {
  if (!calendarColorId) return '1';
  const id = parseInt(calendarColorId, 10);
  if (id >= 1 && id <= 11) return String(id);
  return '1';
}

// Initialize Speech Recognition
function initSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptDisplay.textContent = transcript;
    };

    recognition.onerror = (event) => {
      showStatus('Error: ' + event.error, 'error');
      stopRecording();
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart if still recording
        try {
          recognition.start();
        } catch (e) {
          stopRecording();
        }
      }
    };
  } else {
    showStatus('Speech recognition not supported in this browser', 'error');
  }
}

// Initialize on load
initSpeechRecognition();

// Auth functions
async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
      resolve(response && response.authenticated);
    });
  });
}

function showAuthSection() {
  authSection.style.display = 'block';
  mainSection.style.display = 'none';
}

function showMainSection() {
  authSection.style.display = 'none';
  mainSection.style.display = 'block';
  loadCalendars();
}

function loadCalendars() {
  calendarSelect.innerHTML = '<option value="">Loading calendars...</option>';
  colorSelect.innerHTML = '<option value="">Loading...</option>';

  const colorsPromise = new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getColors' }, (response) => {
      resolve(response);
    });
  });

  chrome.runtime.sendMessage({ action: 'getCalendars' }, (calResponse) => {
    colorsPromise.then((colorResponse) => {
      // Populate color dropdown
      const eventColors = (colorResponse && colorResponse.success && colorResponse.colors) ? colorResponse.colors : {};
      colorSelect.innerHTML = '<option value="">Color</option>';
      for (let i = 1; i <= 11; i++) {
        const id = String(i);
        const colorDef = eventColors[id];
        const name = EVENT_COLOR_NAMES[id] || `Color ${i}`;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        if (colorDef && colorDef.background) {
          option.style.backgroundColor = colorDef.background;
          option.style.color = colorDef.foreground || '#000';
        }
        colorSelect.appendChild(option);
      }

      // Populate calendar dropdown
      if (calResponse && calResponse.success && calResponse.calendars) {
        const calendars = calResponse.calendars;
        const primaryCal = calendars.find(c => c.primary) || calendars[0];

        calendarSelect.innerHTML = '<option value="">Calendar</option>';
        calendars.forEach(cal => {
          const option = document.createElement('option');
          option.value = cal.id;
          option.textContent = cal.summary;
          calendarSelect.appendChild(option);
        });

        if (calendars.length === 0) {
          const option = document.createElement('option');
          option.value = 'primary';
          option.textContent = 'Primary';
          calendarSelect.appendChild(option);
        }

        // Set defaults: primary calendar and its color
        if (primaryCal) {
          primaryCalendarId = primaryCal.id;
          primaryColorId = mapCalendarColorToEventColor(primaryCal.colorId);
          calendarSelect.value = primaryCalendarId;
          colorSelect.value = primaryColorId;
        }
      } else {
        calendarSelect.innerHTML = '<option value="">Calendar</option><option value="primary">Primary (error loading list)</option>';
        primaryCalendarId = 'primary';
        primaryColorId = '1';
        calendarSelect.value = 'primary';
        colorSelect.value = '1';
      }
    });
  });
}

loginBtn.addEventListener('click', async () => {
  authStatus.textContent = 'Signing in...';
  console.log('Opening browser console to show redirect URI...');
  console.log('Check the Service Worker console (chrome://extensions -> your extension -> service worker -> console)');
  
  chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
    if (response && response.success) {
      showMainSection();
      authStatus.textContent = '';
    } else {
      const errorMsg = response?.error || 'Unknown error';
      authStatus.textContent = `Authentication failed: ${errorMsg}`;
      console.error('Auth error:', response);
      console.error('Check the Service Worker console for the redirect URI that needs to be added to Google Cloud Console');
      console.error('To view: chrome://extensions -> find EventCreator -> click "service worker" link');
    }
  });
});

showDebugBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'getRedirectURI' }, (info) => {
    if (chrome.runtime.lastError) {
      redirectUriDisplay.textContent = 'Error: ' + chrome.runtime.lastError.message;
    } else if (info) {
      redirectUriDisplay.textContent = 'Redirect URI: ' + (info.redirectURI || 'Not available');
      clientIdDisplay.textContent = 'Client ID: ' + (info.clientId || 'Not available');
      debugInfo.style.display = 'block';
    } else {
      redirectUriDisplay.textContent = 'No response from service worker';
      debugInfo.style.display = 'block';
    }
  });
});

logoutBtn.addEventListener('click', async () => {
  chrome.runtime.sendMessage({ action: 'logout' }, () => {
    showAuthSection();
    clearForm();
  });
});

// Recording functions
function startRecording() {
  if (!recognition) {
    showStatus('Speech recognition not available', 'error');
    return;
  }

  try {
    recognition.start();
    isRecording = true;
    recordBtn.classList.add('recording');
    recordText.textContent = 'Stop Recording';
    recordIcon.textContent = '⏹️';
    transcriptDisplay.textContent = 'Listening...';
    showStatus('Recording started', 'info');
  } catch (e) {
    showStatus('Error starting recording: ' + e.message, 'error');
  }
}

function stopRecording() {
  if (recognition && isRecording) {
    recognition.stop();
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordText.textContent = 'Start Recording';
    recordIcon.textContent = '🎤';
    showStatus('Recording stopped', 'info');
  }
}

recordBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

// Event creation
createEventBtn.addEventListener('click', async () => {
  const title = eventTitleInput.value.trim();
  const start = eventStartInput.value;
  const end = eventEndInput.value;
  const description = eventDescriptionInput.value.trim() || transcriptDisplay.textContent.trim();

  if (!title) {
    showStatus('Please enter an event title', 'error');
    return;
  }

  if (!start || !end) {
    showStatus('Please select start and end times', 'error');
    return;
  }

  showStatus('Creating event...', 'info');

  chrome.runtime.sendMessage({
    action: 'createEvent',
    event: {
      title,
      start,
      end,
      description,
      calendarId: calendarSelect.value || 'primary',
      colorId: colorSelect.value || undefined
    }
  }, (response) => {
    if (response && response.success) {
      showStatus('Event created successfully!', 'success');
      clearForm();
    } else {
      showStatus('Failed to create event: ' + (response?.error || 'Unknown error'), 'error');
    }
  });
});

function clearForm() {
  eventTitleInput.value = '';
  eventStartInput.value = '';
  eventEndInput.value = '';
  eventDescriptionInput.value = '';
  transcriptDisplay.textContent = '';
  calendarSelect.value = primaryCalendarId;
  colorSelect.value = primaryColorId;
}

function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`;
  setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.className = 'status';
  }, 5000);
}

// Set default times (now and 1 hour later)
const now = new Date();
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

eventStartInput.value = formatDateTimeLocal(now);
eventEndInput.value = formatDateTimeLocal(oneHourLater);

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
