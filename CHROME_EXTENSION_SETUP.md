# Chrome Extension - Cross-Tab Attention Tracking

## ✅ Implementation Complete!

Your Chrome extension now has **cross-tab attention tracking** that shows notifications on ANY tab when you've been away from learning.

## What Was Added

### New Features:
1. **Cross-Tab Notifications** - Alerts appear on Gmail, YouTube, or any tab you're on
2. **Smart Away Detection** - Tracks when you leave the learning tab
3. **Accurate Timing** - Shows exact time since you left (not cumulative)
4. **Interactive Notifications** - Click to return to learning or snooze
5. **Window Switching** - Detects when you switch to different browser windows

### How It Works:

```
User on Learning Tab → Switch to Gmail → Timer Starts (90s)
                                              ↓
                                    After 90 seconds...
                                              ↓
                        🚨 Notification appears on Gmail tab
                        "You've been away for 1 minute and 30 seconds"
                                              ↓
                        [📚 Continue Learning] [⏰ Remind Me Later]
```

## Installation Steps

### 1. Load the Extension

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the folder: `NovProject/chrome-extension`
5. Extension should appear with icon

### 2. Grant Permissions

The extension needs these permissions:
- ✅ **Notifications** - To show cross-tab alerts
- ✅ **Tabs** - To detect tab switches
- ✅ **Active Tab** - To know which tab you're on
- ✅ **Idle** - To detect inactivity

Click "Allow" when prompted.

### 3. Test the Extension

1. **Start a learning session** on `localhost:3000`
2. **Switch to another tab** (Gmail, YouTube, etc.)
3. **Wait 90 seconds**
4. **Expected:** Notification appears on your current tab!

## Features in Detail

### 1. Away Detection (90 seconds)

**Triggers when:**
- You switch to a different tab
- You switch to a different window
- You minimize the browser

**Notification shows:**
```
🚨 Come Back to Learning!
You've been away from your learning for 1 minute and 30 seconds. Ready to continue?

[📚 Continue Learning]  [⏰ Remind Me Later]
```

**Actions:**
- **Continue Learning** - Focuses the learning tab immediately
- **Remind Me Later** - Snoozes for another 90 seconds
- **Click notification** - Also focuses learning tab

### 2. Accurate Timing

The timer:
- ✅ Starts when you leave the learning tab
- ✅ Resets when you return
- ✅ Shows time since you left (not cumulative)
- ✅ Updates every 30 seconds if you're still away

### 3. Smart Behavior

**Won't spam you:**
- Only shows notification after 90 seconds away
- Won't show again for 30 seconds after dismissing
- Automatically resets when you return

**Handles edge cases:**
- Learning tab closed? Finds it when you click notification
- Multiple learning tabs? Tracks the most recent one
- Browser minimized? Still tracks and notifies

## Console Logs

The extension logs its activity to help you debug:

```javascript
🎯 Started cross-tab attention monitoring for session: 28
📚 Learning tab identified: 123
👋 User left learning tab for: https://gmail.com
⏱️  Away timer started - will check in 90 seconds
🚨 Away notification shown: You've been away...
✅ Notification created: notification_id_123
✅ User returned after 95 seconds
```

**To view logs:**
1. Go to `chrome://extensions/`
2. Find "AI Learning System - Screen Monitor"
3. Click "service worker" (or "background page")
4. Console opens with logs

## Configuration

### Change Away Threshold

In `background.js`, line 17:

```javascript
const AWAY_THRESHOLD = 90000; // 90 seconds (1.5 minutes)
```

Change to:
- `60000` = 1 minute
- `120000` = 2 minutes
- `180000` = 3 minutes

### Change Notification Style

In `showCrossTabNotification()` function:

```javascript
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: '🚨 Come Back to Learning!',  // ← Change title
  message: message,                     // ← Message is dynamic
  priority: 2,                          // ← 0=low, 1=default, 2=high
  requireInteraction: true,             // ← true=stays until clicked
  buttons: [
    { title: '📚 Continue Learning' },  // ← Change button text
    { title: '⏰ Remind Me Later' }
  ]
})
```

## Integration with React Component

The Chrome extension and React AttentionTracker work together:

| Feature | Chrome Extension | React Component |
|---------|-----------------|-----------------|
| **Cross-tab alerts** | ✅ Handles | ❌ Can't do |
| **In-tab monitoring** | ✅ Helps | ✅ Primary |
| **Status display** | ❌ N/A | ✅ Shows |
| **Metrics tracking** | ✅ Helps | ✅ Primary |
| **Low attention** | ❌ N/A | ✅ Detects |
| **Over-engagement** | ❌ N/A | ✅ Detects |

**Best of both worlds:**
- Extension handles cross-tab notifications
- React component handles in-tab monitoring and metrics

## Troubleshooting

### Issue: No notifications appearing

**Check:**
1. Extension loaded? Go to `chrome://extensions/`
2. Notifications enabled? Check Chrome settings → Privacy → Notifications
3. Learning tab detected? Check console logs for "📚 Learning tab identified"
4. Actually away for 90s? Timer needs full 90 seconds

**Fix:**
```javascript
// Temporarily reduce threshold for testing
const AWAY_THRESHOLD = 10000; // 10 seconds for testing
```

### Issue: Notification shows but doesn't focus tab

**Check:**
1. Learning tab still open?
2. Check console for errors

**Fix:** The extension will try to find the learning tab again if it was closed.

### Issue: Multiple notifications

**This is normal** if you're away for a long time:
- First notification at 90 seconds
- If still away, another at 120 seconds (90 + 30)
- And so on...

**To reduce frequency:**
```javascript
// In checkIfStillAway(), change:
awayCheckTimer = setTimeout(() => {
  awayAlertShown = false;
  checkIfStillAway();
}, 60000); // Check every 60 seconds instead of 30
```

### Issue: Extension not tracking

**Check console logs:**
1. Go to `chrome://extensions/`
2. Click "service worker"
3. Look for initialization logs

**Reload extension:**
1. Go to `chrome://extensions/`
2. Click reload icon on the extension card
3. Refresh your learning page

## Testing Checklist

- [ ] Extension loaded in Chrome
- [ ] Notifications permission granted
- [ ] Start learning session on localhost:3000
- [ ] Switch to Gmail/YouTube
- [ ] Wait 90 seconds
- [ ] Notification appears on current tab
- [ ] Click "Continue Learning" - returns to learning tab
- [ ] Switch away again
- [ ] Click "Remind Me Later" - notification dismisses
- [ ] Wait 90 more seconds - notification appears again
- [ ] Return to learning tab manually - timer resets
- [ ] Console shows correct logs

## Summary

Your Chrome extension now provides:
- ✅ Cross-tab notifications (works on ANY tab)
- ✅ Accurate away timing (resets properly)
- ✅ Interactive notifications (click to return)
- ✅ Smart behavior (no spam, handles edge cases)
- ✅ Full logging (easy to debug)

**This solves your original problem:** Alerts now appear on other tabs, not just the learning tab!

---

**Last Updated:** November 13, 2024
**Status:** ✅ Ready to use
