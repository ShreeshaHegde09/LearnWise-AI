# Attention Tracker Testing Steps

## IMPORTANT: You MUST Hard Refresh!

**Before testing, you MUST do a hard refresh to load the new code:**

- **Windows/Linux:** Press `Ctrl + Shift + R`
- **Mac:** Press `Cmd + Shift + R`

Or:
- **Windows/Linux:** Press `Ctrl + F5`
- **Mac:** Press `Cmd + Shift + Delete` (clear cache) then refresh

## Testing Thresholds (Reduced for Easy Testing)

I've temporarily reduced the thresholds so you can test quickly:

| Detection | Original | Testing | How to Trigger |
|-----------|----------|---------|----------------|
| **Away State** | 90 seconds | **30 seconds** | Switch tabs or don't interact for 30s |
| **Low Attention** | 30 seconds idle | **20 seconds idle** | Stay on tab but don't interact for 20s (with < 5 events) |
| **Alert Cooldown** | 60 seconds | **30 seconds** | Wait 30s between same alert type |

## Step-by-Step Testing

### Test 1: Away State Alert

1. **Hard refresh the page** (Ctrl+Shift+R)
2. Open browser console (F12)
3. Look for: `🎯 AttentionTracker initialized`
4. **Switch to another tab** (Gmail, YouTube, etc.)
5. Wait **30 seconds**
6. **Expected Console Logs:**
   ```
   🔍 Evaluating attention: { tabFocused: false, ... }
   🔴 AWAY STATE TRIGGERED: { tabFocused: false, ... }
   🚨 Away state detected - CALLING showAlert: { ... }
   📢 showAlert called: { type: 'away', ... }
   ✅ Showing alert: { type: 'away', ... }
   📱 Calling showBrowserNotification
   📱 showBrowserNotification called: { type: 'away', ... }
   ✅ Browser supports notifications. Permission: granted
   🔔 Creating notification: { type: 'away', ... }
   ✅ Notification created successfully
   ```

7. **Expected Result:**
   - Browser notification appears (system tray/notification center)
   - When you return to learning tab, you'll see the popup alert
   - Message shows time since you left (e.g., "30 seconds")

### Test 2: Low Attention Alert

1. **Hard refresh the page** (Ctrl+Shift+R)
2. Stay on the learning tab
3. **Don't interact** - no mouse movement, no clicking, no scrolling
4. Wait **20 seconds**
5. **Expected Console Logs:**
   ```
   🔍 Evaluating attention: { recentActivity: 0, timeSinceLastActivity: '20s', ... }
   🔴 LOW ATTENTION TRIGGERED: { recentActivityCount: 0, ... }
   🚨 Low attention detected - CALLING showAlert: { ... }
   📢 showAlert called: { type: 'low_attention', ... }
   ✅ Showing alert: { type: 'low_attention', ... }
   ```

6. **Expected Result:**
   - Alert popup appears on screen
   - Message: "Not fully focused? Would you like me to simplify the content for you?"
   - "Simplify Content" button is visible

### Test 3: Browser Notification Permission

1. **Hard refresh the page** (Ctrl+Shift+R)
2. Look for browser prompt: "localhost wants to show notifications"
3. **Click "Allow"**
4. **Expected Console Log:**
   ```
   ✅ Notification permission granted
   ```

5. If you don't see the prompt, check:
   - Click the lock icon in address bar
   - Look for "Notifications" setting
   - Change to "Allow"

### Test 4: Status Display

1. **Hard refresh the page** (Ctrl+Shift+R)
2. Look at **bottom-left corner**
3. **Expected:**
   - Box showing "Attention" status
   - Status: "Focused" (green) when active
   - Status: "Idle" (yellow) when inactive
   - Status: "Away" (red) when tab unfocused
   - Activity count updates as you interact

## Troubleshooting

### Issue: No logs appearing

**Solution:**
1. Did you hard refresh? (Ctrl+Shift+R)
2. Check if console is filtered - click "All levels"
3. Clear console and try again

### Issue: "Alert cooldown active" message

**Solution:**
- Wait 30 seconds between alerts of the same type
- Or refresh the page to reset cooldown

### Issue: No notification permission prompt

**Solution:**
1. Click lock icon in address bar
2. Find "Notifications"
3. Set to "Allow"
4. Refresh page

### Issue: Notification shows but no popup

**Solution:**
- This is correct! When you're on another tab, you only see the notification
- Return to the learning tab to see the popup

### Issue: Popup shows but no notification

**Solution:**
- Check notification permission (see above)
- Check console for: `❌ Notification permission denied`

## What to Look For in Console

### Good Signs ✅

```
🎯 AttentionTracker initialized for session: session_123
⏱️  Evaluation interval started (10s)
🔍 Evaluating attention: { ... } (every 10 seconds)
🔴 AWAY STATE TRIGGERED: { ... }
🔴 LOW ATTENTION TRIGGERED: { ... }
📢 showAlert called: { ... }
✅ Showing alert: { ... }
🔔 Creating notification: { ... }
✅ Notification created successfully
```

### Bad Signs ❌

```
❌ Browser does not support notifications
❌ Notification permission denied
⚠️  Alert already showing, skipping new alert
⏳ Alert cooldown active for away: 25s remaining
```

## After Testing

Once you confirm everything works, I'll change the thresholds back to production values:
- Away: 30s → 90s
- Low Attention: 20s → 30s
- Cooldown: 30s → 60s

## Quick Test Checklist

- [ ] Hard refreshed the page (Ctrl+Shift+R)
- [ ] See "🎯 AttentionTracker initialized" in console
- [ ] Allowed notification permission
- [ ] Status display shows in bottom-left corner
- [ ] Away alert triggers after 30s on another tab
- [ ] Browser notification appears when on another tab
- [ ] Low attention alert triggers after 20s of no interaction
- [ ] "Simplify Content" button is visible in low attention alert
- [ ] Away message shows correct time (not cumulative)

---

**Remember:** The most common issue is forgetting to hard refresh! The browser caches the old JavaScript code.
