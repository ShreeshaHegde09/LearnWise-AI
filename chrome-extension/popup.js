// Popup script for AI Learning System Screen Monitor

document.addEventListener('DOMContentLoaded', function() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  
  const mouseCount = document.getElementById('mouseCount');
  const keyCount = document.getElementById('keyCount');
  const tabCount = document.getElementById('tabCount');
  const idleTime = document.getElementById('idleTime');

  // Update status on popup open
  updateStatus();
  
  // Set up periodic status updates
  setInterval(updateStatus, 1000);

  toggleBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (response.isMonitoring) {
        chrome.runtime.sendMessage({ action: 'stopMonitoring' }, () => {
          updateStatus();
        });
      } else {
        // For demo purposes, use a default session ID
        // In real implementation, this would come from the learning app
        const sessionId = 'demo_session_' + Date.now();
        chrome.runtime.sendMessage({ 
          action: 'startMonitoring', 
          sessionId: sessionId 
        }, () => {
          updateStatus();
        });
      }
    });
  });

  settingsBtn.addEventListener('click', function() {
    // Open settings page or show settings modal
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  function updateStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting status:', chrome.runtime.lastError);
        return;
      }

      if (response) {
        const isActive = response.isMonitoring;
        
        // Update status indicator
        statusDot.className = `status-dot ${isActive ? 'active' : 'inactive'}`;
        statusText.textContent = isActive ? 
          `Monitoring Session: ${response.sessionId?.substring(0, 8)}...` : 
          'Not monitoring';
        
        // Update toggle button
        toggleBtn.textContent = isActive ? 'Stop' : 'Start';
        toggleBtn.className = `btn ${isActive ? 'btn-secondary' : 'btn-primary'}`;
        
        // Update activity stats
        if (response.activityData) {
          const data = response.activityData;
          mouseCount.textContent = data.mouseMovements || 0;
          keyCount.textContent = data.keystrokes || 0;
          tabCount.textContent = data.tabSwitches || 0;
          
          const idle = Math.floor((Date.now() - (data.lastActivity || Date.now())) / 1000);
          idleTime.textContent = idle > 60 ? `${Math.floor(idle/60)}m` : `${idle}s`;
        }
      }
    });
  }

  // Handle extension icon click
  chrome.action.onClicked.addListener((tab) => {
    // This will open the popup, which is handled by the manifest
  });
});