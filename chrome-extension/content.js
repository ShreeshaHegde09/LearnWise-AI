// Content script for AI Learning System Screen Monitor

let isMonitoring = false;
let activityCounters = {
  mouseMovements: 0,
  keystrokes: 0,
  clicks: 0,
  scrolls: 0
};

// Initialize monitoring when page loads
document.addEventListener('DOMContentLoaded', initializeMonitoring);

// Also try to initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMonitoring);
} else {
  initializeMonitoring();
}

function initializeMonitoring() {
  // Check if this is the learning interface
  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    setupEventListeners();
    
    // Listen for session start from the React app
    window.addEventListener('message', (event) => {
      if (event.data.type === 'START_MONITORING') {
        startMonitoring(event.data.sessionId);
      } else if (event.data.type === 'STOP_MONITORING') {
        stopMonitoring();
      }
    });
  }
}

function setupEventListeners() {
  // Mouse movement tracking
  document.addEventListener('mousemove', throttle(() => {
    if (isMonitoring) {
      activityCounters.mouseMovements++;
      updateBackgroundScript();
    }
  }, 100));

  // Keystroke tracking
  document.addEventListener('keydown', () => {
    if (isMonitoring) {
      activityCounters.keystrokes++;
      updateBackgroundScript();
    }
  });

  // Click tracking
  document.addEventListener('click', () => {
    if (isMonitoring) {
      activityCounters.clicks++;
      updateBackgroundScript();
    }
  });

  // Scroll tracking
  document.addEventListener('scroll', throttle(() => {
    if (isMonitoring) {
      activityCounters.scrolls++;
      updateBackgroundScript();
    }
  }, 200));

  // Focus/blur tracking
  window.addEventListener('focus', () => {
    if (isMonitoring) {
      chrome.runtime.sendMessage({
        action: 'updateActivity',
        data: { window_focused: true, timestamp: Date.now() }
      });
    }
  });

  window.addEventListener('blur', () => {
    if (isMonitoring) {
      chrome.runtime.sendMessage({
        action: 'updateActivity',
        data: { window_focused: false, timestamp: Date.now() }
      });
    }
  });

  // Visibility change tracking
  document.addEventListener('visibilitychange', () => {
    if (isMonitoring) {
      const visibilityData = { 
        visibility_state: document.visibilityState,
        tab_hidden: document.hidden,
        timestamp: Date.now()
      };
      
      chrome.runtime.sendMessage({
        action: 'updateActivity',
        data: visibilityData
      });
      
      // Send tab visibility event to attention backend
      const visibilityEvent = document.hidden ? 'tab_hidden' : 'tab_visible';
      fetch('http://localhost:5000/api/attention/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: visibilityEvent,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
      
      // Also send tab_switch for backwards compatibility
      if (document.hidden) {
        fetch('http://localhost:5000/api/attention/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'tab_switch',
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      }
    }
  });
  
  // Idle detection - no activity for 30 seconds
  let idleTimer;
  let lastActivityTime = Date.now();
  
  function resetIdleTimer() {
    lastActivityTime = Date.now();
    clearTimeout(idleTimer);
    
    if (isMonitoring) {
      idleTimer = setTimeout(() => {
        // User has been idle for 30 seconds
        fetch('http://localhost:5000/api/attention/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'idle',
            timestamp: new Date().toISOString(),
            idle_duration: 30
          })
        }).catch(() => {});
      }, 30000);
    }
  }
  
  // Reset idle timer on any activity
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(eventType => {
    document.addEventListener(eventType, resetIdleTimer);
  });
}

function startMonitoring(sessionId) {
  isMonitoring = true;
  
  chrome.runtime.sendMessage({
    action: 'startMonitoring',
    sessionId: sessionId
  }, (response) => {
    console.log('Monitoring started:', response);
  });
  
  // Send initial activity data
  updateBackgroundScript();
}

function stopMonitoring() {
  isMonitoring = false;
  
  chrome.runtime.sendMessage({
    action: 'stopMonitoring'
  }, (response) => {
    console.log('Monitoring stopped:', response);
  });
}

function updateBackgroundScript() {
  const activityData = {
    ...activityCounters,
    timestamp: Date.now(),
    url: window.location.href
  };
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: 'updateActivity',
    data: activityData
  });
  
  // Also send to attention tracking backend
  sendToAttentionBackend(activityData);
}

// Send activity data to attention tracking backend
function sendToAttentionBackend(data) {
  // Convert activity counters to attention tracking events
  const events = [];
  
  if (data.mouseMovements > 0) {
    events.push({
      event: 'mouse_move',
      timestamp: new Date().toISOString(),
      count: data.mouseMovements
    });
  }
  
  if (data.clicks > 0) {
    events.push({
      event: 'click',
      timestamp: new Date().toISOString(),
      count: data.clicks
    });
  }
  
  if (data.keystrokes > 0) {
    events.push({
      event: 'keydown',
      timestamp: new Date().toISOString(),
      count: data.keystrokes
    });
  }
  
  if (data.scrolls > 0) {
    events.push({
      event: 'scroll',
      timestamp: new Date().toISOString(),
      count: data.scrolls
    });
  }
  
  // Send each event to the backend
  events.forEach(event => {
    fetch('http://localhost:5000/api/attention/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    }).catch(err => {
      // Silently fail - attention tracking is optional
      console.debug('Attention tracking not available:', err);
    });
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPopup') {
    showLearningPopup(request.message);
    sendResponse({ status: 'popup_shown' });
  }
});

function showLearningPopup(message) {
  // Create popup element
  const popup = document.createElement('div');
  popup.id = 'ai-learning-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #1f1f1f 0%, #2d1b1b 100%);
    border: 2px solid #dc2626;
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    z-index: 10000;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  popup.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 24px; margin-bottom: 8px;">🤖</div>
      <h3 style="color: #dc2626; margin: 0 0 16px 0; font-size: 18px;">AI Learning Assistant</h3>
      <p style="margin: 0 0 20px 0; line-height: 1.5; color: #e5e5e5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="continue-learning" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        ">Continue Learning</button>
        <button id="take-break" style="
          background: #374151;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        ">Take a Break</button>
      </div>
    </div>
  `;

  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(popup);

  // Add event listeners
  document.getElementById('continue-learning').addEventListener('click', () => {
    document.body.removeChild(popup);
    document.body.removeChild(backdrop);
  });

  document.getElementById('take-break').addEventListener('click', () => {
    document.body.removeChild(popup);
    document.body.removeChild(backdrop);
    // Could implement break timer here
  });

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      document.body.removeChild(popup);
      document.body.removeChild(backdrop);
    }
  }, 10000);
}

// Utility function to throttle events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Expose functions to window for React app to use
window.aiLearningMonitor = {
  start: startMonitoring,
  stop: stopMonitoring,
  isActive: () => isMonitoring
};