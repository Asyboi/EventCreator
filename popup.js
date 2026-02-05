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
const eventTitleInput = document.getElementById('event-title');
const eventStartInput = document.getElementById('event-start');
const eventEndInput = document.getElementById('event-end');
const eventDescriptionInput = document.getElementById('event-description');
const createEventBtn = document.getElementById('create-event-btn');
const statusMessage = document.getElementById('status-message');

let recognition = null;
let isRecording = false;

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
      description
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
