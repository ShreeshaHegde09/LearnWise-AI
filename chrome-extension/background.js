// Background script for AI Learning System Screen Monitor
// Enhanced with Cross-Tab Attention Tracking

let isMonitoring = false;
let currentSessionId = null;
let activityData = {
  mouseMovements: 0,
  keystrokes: 0,
  tabSwitches: 0,
  idleTime: 0,
  lastActivity: Date.now()
};
let awayCheckInterval = null;

// Cross-Tab Attention Tracking
let learningTabId = null;
let learningWindowId = null;
let awayStartTime = null;
let awayAlertShown = false;
let awayCheckTimer = null;
const AWAY_THRESHOLD = 90000; // 90 seconds (1.5 minutes)

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startMonitoring':
      startMonitoring(request.sessionId);
      sendResponse({ status: 'started' });
      break;
      
    case 'stopMonitoring':
      stopMonitoring();
      sendResponse({ status: 'stopped' });
      break;
      
    case 'updateActivity':
      updateActivityData(request.data);
      sendResponse({ status: 'updated' });
      break;
      
    case 'getStatus':
      sendResponse({ 
        isMonitoring, 
        sessionId: currentSessionId,
        activityData 
      });
      break;
  }
});

function startMonitoring(sessionId) {
  isMonitoring = true;
  currentSessionId = sessionId;
  
  console.log('🎯 Started cross-tab attention monitoring for session:', sessionId);
  
  // Find and track the learning tab
  chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
    if (tabs.length > 0) {
      learningTabId = tabs[0].id;
      learningWindowId = tabs[0].windowId;
      console.log('📚 Learning tab identified:', learningTabId);
    }
  });
  
  // Set up periodic data sending
  setInterval(() => {
    if (isMonitoring) {
      sendActivityData();
    }
  }, 10000); // Send data every 10 seconds
  
  // Check for away alerts every 10 seconds
  awayCheckInterval = setInterval(() => {
    if (isMonitoring) {
      checkAwayAlert();
    }
  }, 10000);
  
  // Monitor tab changes
  chrome.tabs.onActivated.addListener(handleTabChange);
  chrome.tabs.onUpdated.addListener(handleTabUpdate);
  
  // Monitor idle state
  chrome.idle.onStateChanged.addListener(handleIdleStateChange);
  
  // Monitor window focus changes
  chrome.windows.onFocusChanged.addListener(handleWindowFocusChange);
}

function stopMonitoring() {
  isMonitoring = false;
  currentSessionId = null;
  
  // Clear intervals and timers
  if (awayCheckInterval) {
    clearInterval(awayCheckInterval);
    awayCheckInterval = null;
  }
  
  if (awayCheckTimer) {
    clearTimeout(awayCheckTimer);
    awayCheckTimer = null;
  }
  
  // Reset away tracking
  awayStartTime = null;
  awayAlertShown = false;
  learningTabId = null;
  learningWindowId = null;
  
  // Remove listeners
  chrome.tabs.onActivated.removeListener(handleTabChange);
  chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  chrome.idle.onStateChanged.removeListener(handleIdleStateChange);
  chrome.windows.onFocusChanged.removeListener(handleWindowFocusChange);
  
  console.log('🛑 Stopped monitoring (including cross-tab tracking)');
}

function updateActivityData(data) {
  activityData = { ...activityData, ...data };
  activityData.lastActivity = Date.now();
}

function handleTabChange(activeInfo) {
  if (!isMonitoring) return;
  
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    const isLearningTab = tab.url && tab.url.includes('localhost:3000');
    
    activityData.tabSwitches++;
    
    if (isLearningTab) {
      // User returned to learning tab
      learningTabId = activeInfo.tabId;
      learningWindowId = tab.windowId;
      handleReturnToLearning();
      console.log('✅ User returned to learning tab');
    } else if (learningTabId && activeInfo.tabId !== learningTabId) {
      // User switched away from learning tab
      handleLeaveFromLearning(tab.url);
      console.log('👋 User left learning tab for:', tab.url);
      
      sendActivityData({
        tab_switched: true,
        switched_to: tab.url,
        timestamp: Date.now()
      });
    }
  });
}

function handleTabUpdate(tabId, changeInfo, tab) {
  if (!isMonitoring || !changeInfo.url) return;
  
  const isLearningTab = changeInfo.url.includes('localhost:3000');
  
  if (!isLearningTab) {
    sendActivityData({
      tab_switched: true,
      switched_to: changeInfo.url,
      timestamp: Date.now()
    });
  }
}

function handleIdleStateChange(newState) {
  if (!isMonitoring) return;
  
  sendActivityData({
    idle_state: newState,
    timestamp: Date.now()
  });
}

async function sendActivityData(additionalData = {}) {
  if (!isMonitoring || !currentSessionId) return;
  
  const dataToSend = {
    session_id: currentSessionId,
    screen_data: {
      ...activityData,
      ...additionalData,
      idle_time: Date.now() - activityData.lastActivity,
      timestamp: Date.now()
    }
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/screen-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    });
    
    const result = await response.json();
    
    // Handle popup messages
    if (result.show_popup) {
      // Send message to content script to show popup
      chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'showPopup',
            message: result.message
          });
        }
      });
    }
    
    console.log('Activity data sent successfully');
  } catch (error) {
    console.error('Error sending activity data:', error);
  }
  
  // Reset counters
  activityData.mouseMovements = 0;
  activityData.keystrokes = 0;
  activityData.tabSwitches = 0;
}

// Check if user has been away and show notification
async function checkAwayAlert() {
  try {
    const response = await fetch('http://localhost:5000/api/attention/status');
    const data = await response.json();
    
    if (data.show_alert && data.alert_type === 'away') {
      // Show browser notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: '📚 Learning Reminder',
        message: data.alert_message || 'Ready to continue learning?',
        priority: 2,
        requireInteraction: true,
        buttons: [
          { title: 'Continue Learning' },
          { title: 'Remind Me Later' }
        ]
      }, (notificationId) => {
        // Handle notification click
        chrome.notifications.onButtonClicked.addListener((clickedId, buttonIndex) => {
          if (clickedId === notificationId) {
            if (buttonIndex === 0) {
              // Continue Learning - focus the learning tab
              chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
                if (tabs.length > 0) {
                  chrome.tabs.update(tabs[0].id, { active: true });
                  chrome.windows.update(tabs[0].windowId, { focused: true });
                }
              });
            }
            chrome.notifications.clear(notificationId);
          }
        });
      });
    }
  } catch (error) {
    console.debug('Away alert check failed:', error);
  }
}

// Set idle detection interval to 15 seconds
chrome.idle.setDetectionInterval(15);

// ============================================================================
// Cross-Tab Attention Tracking Functions
// ============================================================================

/**
 * Handle user leaving the learning tab
 */
function handleLeaveFromLearning(destinationUrl) {
  if (!awayStartTime) {
    awayStartTime = Date.now();
    awayAlertShown = false;
    
    // Start checking if user is still away
    if (awayCheckTimer) {
      clearTimeout(awayCheckTimer);
    }
    
    awayCheckTimer = setTimeout(() => {
      checkIfStillAway();
    }, AWAY_THRESHOLD);
    
    console.log('⏱️  Away timer started - will check in 90 seconds');
  }
}

/**
 * Handle user returning to learning tab
 */
function handleReturnToLearning() {
  if (awayStartTime) {
    const awayDuration = Date.now() - awayStartTime;
    console.log(`✅ User returned after ${Math.floor(awayDuration / 1000)} seconds`);
    
    // Reset away tracking
    awayStartTime = null;
    awayAlertShown = false;
    
    if (awayCheckTimer) {
      clearTimeout(awayCheckTimer);
      awayCheckTimer = null;
    }
  }
}

/**
 * Check if user is still away and show notification
 */
function checkIfStillAway() {
  if (!awayStartTime || awayAlertShown) return;
  
  // Check if user is currently on learning tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    const currentTab = tabs[0];
    const isOnLearningTab = currentTab.url && currentTab.url.includes('localhost:3000');
    
    if (!isOnLearningTab) {
      // User is still away - show notification
      const awayDuration = Date.now() - awayStartTime;
      const minutes = Math.floor(awayDuration / 60000);
      const seconds = Math.floor((awayDuration % 60000) / 1000);
      
      let message = `You've been away from your learning for `;
      if (minutes > 0) {
        message += `${minutes} minute${minutes > 1 ? 's' : ''} and `;
      }
      message += `${seconds} second${seconds !== 1 ? 's' : ''}. Ready to continue?`;
      
      showCrossTabNotification(message, awayDuration);
      awayAlertShown = true;
      
      console.log('🚨 Away notification shown:', message);
      
      // Schedule next check in 30 seconds
      awayCheckTimer = setTimeout(() => {
        awayAlertShown = false; // Allow showing again
        checkIfStillAway();
      }, 30000);
    } else {
      // User returned to learning tab
      handleReturnToLearning();
    }
  });
}

/**
 * Show cross-tab notification
 */
function showCrossTabNotification(message, awayDuration) {
  const minutes = Math.floor(awayDuration / 60000);
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '🚨 Come Back to Learning!',
    message: message,
    priority: 2,
    requireInteraction: true,
    buttons: [
      { title: '📚 Continue Learning' },
      { title: '⏰ Remind Me Later' }
    ]
  }, (notificationId) => {
    console.log('✅ Notification created:', notificationId);
    
    // Handle notification button clicks
    chrome.notifications.onButtonClicked.addListener((clickedId, buttonIndex) => {
      if (clickedId === notificationId) {
        if (buttonIndex === 0) {
          // Continue Learning - focus the learning tab
          focusLearningTab();
        } else {
          // Remind Me Later - reset timer for another 90 seconds
          awayStartTime = Date.now();
          awayAlertShown = false;
          
          if (awayCheckTimer) {
            clearTimeout(awayCheckTimer);
          }
          
          awayCheckTimer = setTimeout(() => {
            checkIfStillAway();
          }, AWAY_THRESHOLD);
        }
        chrome.notifications.clear(notificationId);
      }
    });
    
    // Handle notification click (not button)
    chrome.notifications.onClicked.addListener((clickedId) => {
      if (clickedId === notificationId) {
        focusLearningTab();
        chrome.notifications.clear(notificationId);
      }
    });
  });
}

/**
 * Focus the learning tab
 */
function focusLearningTab() {
  if (learningTabId) {
    chrome.tabs.get(learningTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        // Tab doesn't exist anymore, find it again
        chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
          if (tabs.length > 0) {
            learningTabId = tabs[0].id;
            learningWindowId = tabs[0].windowId;
            chrome.tabs.update(learningTabId, { active: true });
            chrome.windows.update(learningWindowId, { focused: true });
          }
        });
      } else {
        // Tab exists, focus it
        chrome.tabs.update(learningTabId, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
    });
  } else {
    // Find learning tab
    chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
      if (tabs.length > 0) {
        learningTabId = tabs[0].id;
        learningWindowId = tabs[0].windowId;
        chrome.tabs.update(learningTabId, { active: true });
        chrome.windows.update(learningWindowId, { focused: true });
      }
    });
  }
}

/**
 * Handle window focus changes
 */
function handleWindowFocusChange(windowId) {
  if (!isMonitoring || windowId === chrome.windows.WINDOW_ID_NONE) return;
  
  // Check if the focused window contains the learning tab
  if (windowId === learningWindowId) {
    // Check if learning tab is active in this window
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id === learningTabId) {
        handleReturnToLearning();
      }
    });
  } else {
    // User switched to a different window
    if (learningTabId && !awayStartTime) {
      handleLeaveFromLearning('different_window');
    }
  }
}

console.log('🚀 Cross-tab attention tracking loaded');