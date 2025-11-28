'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Lightbulb, X } from 'lucide-react';
import { EmotionState } from '../lib/EmotionStateManager';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Props interface for AttentionTracker component
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
interface AttentionTrackerProps {
  sessionId: string;              // Unique session identifier
  currentChunk: number;           // Current chunk index (0-based)
  chunkStartTime: number;         // Timestamp when chunk started (ms)
  estimatedReadTime: number;      // Expected read time in seconds
  onSimplifyRequest: () => void;  // Callback for content simplification
  emotionState?: EmotionState;    // Optional emotion state from EmotionDetector
}

/**
 * Activity data tracking interface
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
interface ActivityData {
  mouseEvents: number;        // Count of mouse interactions
  keyboardEvents: number;     // Count of keyboard interactions
  scrollEvents: number;       // Count of scroll interactions
  lastActivity: number;       // Timestamp of last activity (ms)
  tabFocused: boolean;        // Current tab focus state
}

/**
 * Alert state interface
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
interface AlertState {
  show: boolean;              // Whether alert is visible
  type: 'away' | 'low_attention' | 'over_engagement';
  message: string;            // Alert message text
}

/**
 * Attention metrics interface for analytics data
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
interface AttentionMetrics {
  sessionId: string;
  chunkId: number;
  
  // Time tracking
  totalActiveTime: number;      // ms
  totalIdleTime: number;        // ms
  chunkStartTime: number;       // ms
  chunkEndTime: number;         // ms
  
  // Event counts
  mouseEvents: number;
  keyboardEvents: number;
  scrollEvents: number;
  focusSwitches: number;
  
  // Attention states
  lowAttentionCount: number;
  overEngagementCount: number;
  awayCount: number;
  
  // User actions
  simplifyRequests: number;
  alertsDismissed: number;
  
  // Emotion data (Requirement 9.4)
  emotionDistribution?: {
    Focused: number;
    Confused: number;
    Bored: number;
    Tired: number;
  };
  emotionBasedInterventions?: number;
  averageEmotionConfidence?: number;
  emotionConfidenceTrend?: number[];
  
  // Timestamps
  createdAt: number;            // ms
  updatedAt: number;            // ms
}

// ============================================================================
// AttentionTracker Component
// ============================================================================

const AttentionTracker: React.FC<AttentionTrackerProps> = ({
  sessionId,
  currentChunk,
  chunkStartTime,
  estimatedReadTime,
  onSimplifyRequest,
  emotionState,
}) => {
  
  // ==========================================================================
  // State Management
  // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
  // ==========================================================================
  
  const [activity, setActivity] = useState<ActivityData>({
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    lastActivity: Date.now(),
    tabFocused: true,
  });

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'away',
    message: '',
  });

  // ==========================================================================
  // Refs for Performance
  // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
  // ==========================================================================
  
  const evaluationInterval = useRef<NodeJS.Timeout | null>(null);
  const awayStartTime = useRef<number | null>(null);
  const activityWindow = useRef<number[]>([]);  // Rolling window of timestamps
  const metricsData = useRef<AttentionMetrics>({
    sessionId,
    chunkId: currentChunk,
    totalActiveTime: 0,
    totalIdleTime: 0,
    chunkStartTime: Date.now(),
    chunkEndTime: 0,
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    focusSwitches: 0,
    lowAttentionCount: 0,
    overEngagementCount: 0,
    awayCount: 0,
    simplifyRequests: 0,
    alertsDismissed: 0,
    emotionDistribution: {
      Focused: 0,
      Confused: 0,
      Bored: 0,
      Tired: 0
    },
    emotionBasedInterventions: 0,
    averageEmotionConfidence: 0,
    emotionConfidenceTrend: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Ref for mouse move throttling
  // Requirements: 10.3, 10.4, 10.7
  const lastMouseMoveTime = useRef<number>(0);

  // Ref for time metrics tracking
  // Requirements: 8.5
  const lastEvaluationTime = useRef<number>(Date.now());

  // Ref for alert cooldown to prevent spam
  const lastAlertTime = useRef<{ [key: string]: number }>({
    away: 0,
    low_attention: 0,
    over_engagement: 0
  });

  // Ref for immediate lastActivity tracking (bypasses React state delay)
  const lastActivityRef = useRef<number>(Date.now());

  // Ref for emotion alert suppression (Requirement 9.1, 9.3)
  const lastEmotionAlertTime = useRef<number>(0);
  const emotionAlertSuppressionDuration = 60000; // 60 seconds

  // ==========================================================================
  // Activity Recording Logic
  // Requirements: 1.6, 10.1, 10.2
  // ==========================================================================

  /**
   * Records user activity and updates tracking data
   * - Updates activity counters
   * - Adds timestamp to rolling window
   * - Prunes old entries (keeps only last 2 minutes)
   * - Resets away timer
   * - Auto-dismisses alerts
   * 
   * Performance Optimization: Uses array filter for pruning (O(n) complexity)
   * Alternative: Could use circular buffer for O(1) operations if performance becomes an issue
   */
  const recordActivity = (type: 'mouse' | 'keyboard' | 'scroll') => {
    const now = Date.now();
    
    // Update lastActivity ref immediately (bypasses React state delay)
    lastActivityRef.current = now;
    
    // Update activity counters and timestamp
    // Using computed property name to dynamically update the correct event counter
    setActivity(prev => ({
      ...prev,
      [`${type}Events`]: prev[`${type}Events` as keyof ActivityData] as number + 1,
      lastActivity: now,
    }));

    // Update metrics in ref (doesn't trigger re-render for performance)
    metricsData.current[`${type}Events`]++;
    metricsData.current.updatedAt = now;
    
    // Add to rolling window - stores timestamps for activity density calculation
    activityWindow.current.push(now);
    
    // Prune old entries - keep only last 2 minutes (120000ms)
    // This maintains a sliding window for recent activity analysis
    // Threshold: 2 minutes = 120,000 milliseconds
    const twoMinutesAgo = now - 120000;
    activityWindow.current = activityWindow.current.filter(
      time => time >= twoMinutesAgo
    );
    
    // Reset away timer when activity detected
    // This prevents false "away" alerts when user returns
    if (awayStartTime.current) {
      awayStartTime.current = null;
      console.log('✅ Activity detected - awayStartTime reset');
    }
    
    // Auto-dismiss alerts on activity
    // User activity indicates they're back and engaged
    if (alert.show) {
      dismissAlert();
    }
  };

  /**
   * Dismisses the current alert
   * Requirements: 6.6, 6.7
   */
  const dismissAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
    metricsData.current.alertsDismissed++;
  };

  /**
   * Shows an alert with auto-dismiss after 10 seconds
   * Also shows browser notification for cross-tab visibility
   * Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 9.1, 9.3
   * 
   * Alert Priority System: Only one alert can be shown at a time.
   * If an alert is already visible, this function returns early without
   * showing the new alert. This prevents alert spam and ensures the user
   * isn't overwhelmed with multiple popups.
   * 
   * Emotion Alert Priority (Requirement 9.1, 9.3):
   * - Emotion alerts take priority over activity alerts
   * - Activity alerts are suppressed for 60s after an emotion alert
   * 
   * Cooldown: 60 seconds between alerts of the same type
   * 
   * Auto-Dismiss Threshold: 10 seconds (10,000 milliseconds)
   * Rationale: 10 seconds is long enough for the user to read and respond,
   * but short enough to avoid cluttering the interface if ignored.
   */
  const showAlert = (type: AlertState['type'], message: string, isEmotionBased: boolean = false) => {
    const now = Date.now();
    
    console.log('📢 showAlert called:', { type, message, isEmotionBased, alertCurrentlyShowing: alert.show });
    
    // Requirement 9.1, 9.3: Suppress activity alerts if emotion alert was shown recently
    if (!isEmotionBased) {
      const timeSinceEmotionAlert = now - lastEmotionAlertTime.current;
      if (timeSinceEmotionAlert < emotionAlertSuppressionDuration) {
        console.log(`🚫 Activity alert suppressed - emotion alert shown ${Math.floor(timeSinceEmotionAlert / 1000)}s ago`);
        return;
      }
    }
    
    // Check cooldown - don't show same alert type within 60 seconds - PRODUCTION VALUE
    const timeSinceLastAlert = now - lastAlertTime.current[type];
    if (timeSinceLastAlert < 60000) {
      console.log(`⏳ Alert cooldown active for ${type}: ${Math.floor((60000 - timeSinceLastAlert) / 1000)}s remaining`);
      return;
    }
    
    // Prevent multiple alerts from showing simultaneously (Requirement 5.7)
    if (alert.show) {
      console.log('⚠️  Alert already showing, skipping new alert');
      return;
    }
    
    console.log('✅ Showing alert:', { type, message, isEmotionBased });
    setAlert({ show: true, type, message });
    lastAlertTime.current[type] = now;
    
    // Track emotion alert time for suppression logic
    if (isEmotionBased) {
      lastEmotionAlertTime.current = now;
      if (metricsData.current.emotionBasedInterventions !== undefined) {
        metricsData.current.emotionBasedInterventions++;
      }
    }
    
    // Show browser notification for cross-tab visibility
    console.log('📱 Calling showBrowserNotification');
    showBrowserNotification(type, message);
    
    // Auto-dismiss after 10 seconds
    // Uses setTimeout to automatically hide the alert if user doesn't interact
    setTimeout(() => {
      setAlert(prev => {
        // Verify this is still the same alert before dismissing
        // (prevents race conditions if alert changed during timeout)
        if (prev.show && prev.type === type && prev.message === message) {
          metricsData.current.alertsDismissed++;
          console.log('⏰ Auto-dismissing alert:', type);
          return { ...prev, show: false };
        }
        return prev;
      });
    }, 10000);
  };

  /**
   * Shows browser notification for cross-tab visibility
   * This allows users to see alerts even when on other tabs
   */
  const showBrowserNotification = (type: AlertState['type'], message: string) => {
    console.log('📱 showBrowserNotification called:', { type, message });
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return;
    }

    console.log('✅ Browser supports notifications. Permission:', Notification.permission);

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permission result:', permission);
        if (permission === 'granted') {
          createNotification(type, message);
        }
      });
    } else if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, creating notification');
      createNotification(type, message);
    } else {
      console.log('❌ Notification permission denied');
    }
  };

  /**
   * Creates and displays a browser notification
   */
  const createNotification = (type: AlertState['type'], message: string) => {
    console.log('🔔 Creating notification:', { type, message });
    
    const titles = {
      away: '🚨 Come Back to Learning!',
      low_attention: '💡 Need Help?',
      over_engagement: '⚡ Simplify Content?'
    };

    try {
      const notification = new Notification(titles[type], {
        body: message,
        // Remove icon to avoid 404 errors
        tag: `attention-${type}`, // Unique tag per type
        requireInteraction: true, // Keep notification visible until user interacts
        silent: false
      });

      console.log('✅ Notification created successfully - requireInteraction: true');

      // Focus learning tab when notification is clicked
      notification.onclick = () => {
        console.log('👆 Notification clicked - focusing window');
        window.focus();
        notification.close();
      };

      // Also handle notification close
      notification.onclose = () => {
        console.log('🔕 Notification closed');
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
      };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  };

  // ==========================================================================
  // Attention Evaluation Engine
  // Requirements: 2.1-2.7, 3.1-3.7, 4.1-4.7, 5.1-5.7
  // ==========================================================================

  /**
   * Handles away state detection
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 8.1
   */
  const handleAwayState = (idleTime: number) => {
    // For idle-on-tab scenarios, use the idle time directly
    // For tab-switch scenarios, awayStartTime is already set by blur/visibility handlers
    let awayTime: number;
    let awayStartTimestamp: string;
    
    if (awayStartTime.current) {
      // Tab was switched away - use awayStartTime
      awayTime = Date.now() - awayStartTime.current;
      awayStartTimestamp = new Date(awayStartTime.current).toISOString();
    } else {
      // User is idle on the same tab - use idleTime directly
      awayTime = idleTime;
      awayStartTimestamp = new Date(Date.now() - idleTime).toISOString();
    }
    
    const minutes = Math.floor(awayTime / 60000);
    const seconds = Math.floor((awayTime % 60000) / 1000);
    
    const message = `You've been away from your learning for ${
      minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} and ` : ''
    }${seconds} second${seconds !== 1 ? 's' : ''}. Please come back to continue learning or pause your session.`;
    
    console.log('🚨 Away state detected - CALLING showAlert:', { 
      awayTime, 
      minutes, 
      seconds,
      message,
      awayStartTime: awayStartTimestamp,
      source: awayStartTime.current ? 'tab-switch' : 'idle-on-tab',
      idleTime
    });
    
    showAlert('away', message);
    metricsData.current.awayCount++;
  };

  /**
   * Handles low attention state detection
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 8.2
   */
  const handleLowAttentionState = () => {
    const message = "Not fully focused? Would you like me to simplify the content for you?";
    
    console.log('🚨 Low attention detected - CALLING showAlert:', { message });
    
    showAlert('low_attention', message);
    metricsData.current.lowAttentionCount++;
  };

  /**
   * Handles over-engagement state detection
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.3
   */
  const handleOverEngagementState = (timeSpent: number) => {
    const minutes = Math.floor(timeSpent / 60000);
    const message = `You've been reading this section for ${minutes} minutes. Want me to simplify it for quicker understanding?`;
    showAlert('over_engagement', message);
    metricsData.current.overEngagementCount++;
    
    console.log('🚨 Over-engagement detected:', { timeSpent, minutes });
  };

  /**
   * Evaluates attention patterns and triggers interventions
   * Runs every 10 seconds to analyze user behavior
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.5, 10.5
   * 
   * Detection Logic:
   * 1. Away State: Tab unfocused OR idle > 90 seconds
   * 2. Low Attention: Tab focused AND < 5 events in 2 min AND idle > 30 seconds
   * 3. Over-Engagement: Time > estimated + 60s AND > 10 events in 2 min
   * 
   * Priority System: Away > Low Attention > Over-Engagement
   * Only one alert can be shown at a time (early return pattern)
   */
  const evaluateAttention = () => {
    const now = Date.now();
    // Use ref for immediate lastActivity (bypasses React state delay)
    const timeSinceLastActivity = now - lastActivityRef.current;
    const timeOnCurrentChunk = now - chunkStartTime;
    const recentActivityCount = activityWindow.current.length;
    
    // Calculate time metrics since last evaluation
    // Requirements: 8.5
    // This tracks cumulative active/idle time for analytics
    const timeSinceLastEval = now - lastEvaluationTime.current;
    
    // Update active/idle time based on recent activity
    // Threshold: 30 seconds - if user was active within this window, count as active time
    // This provides a more accurate measure of engagement than just event counts
    if (timeSinceLastActivity < 30000 && activity.tabFocused) {
      metricsData.current.totalActiveTime += timeSinceLastEval;
    } else {
      metricsData.current.totalIdleTime += timeSinceLastEval;
    }
    
    lastEvaluationTime.current = now;
    metricsData.current.updatedAt = now;
    
    console.log('🔍 Evaluating attention:', { 
      timeSinceLastActivity: Math.floor(timeSinceLastActivity / 1000) + 's',
      timeOnChunk: Math.floor(timeOnCurrentChunk / 1000) + 's',
      tabFocused: activity.tabFocused,
      recentActivity: recentActivityCount,
      totalActiveTime: Math.floor(metricsData.current.totalActiveTime / 1000) + 's',
      totalIdleTime: Math.floor(metricsData.current.totalIdleTime / 1000) + 's'
    });
    
    // ========================================================================
    // PRIORITY 1: Away State Detection (Highest Priority)
    // ========================================================================
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
    // 
    // Threshold: 90 seconds (90,000 milliseconds) - PRODUCTION VALUE
    // Triggers when: Tab unfocused OR idle time exceeds threshold
    // 
    // Rationale: 90 seconds is long enough to indicate the user has genuinely
    // stepped away, but short enough to catch them before they forget about
    // the learning session entirely.
    if (!activity.tabFocused || timeSinceLastActivity >= 90000) {
      console.log('🔴 AWAY STATE TRIGGERED:', {
        tabFocused: activity.tabFocused,
        timeSinceLastActivity: Math.floor(timeSinceLastActivity / 1000) + 's',
        threshold: '90s'
      });
      handleAwayState(timeSinceLastActivity);
      return; // Early return prevents multiple alerts (Requirement 5.7)
    }
    
    // ========================================================================
    // PRIORITY 2: Low Attention Detection
    // ========================================================================
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
    // 
    // Thresholds:
    // - Activity count: < 5 events in 2-minute window
    // - Idle time: > 30 seconds - PRODUCTION VALUE
    // 
    // Rationale: Fewer than 5 interactions in 2 minutes suggests the user is
    // present but not actively engaging. Combined with 30+ seconds of inactivity,
    // this indicates they may be struggling or distracted.
    if (activity.tabFocused && 
        recentActivityCount < 5 && 
        timeSinceLastActivity > 30000) {
      console.log('🔴 LOW ATTENTION TRIGGERED:', {
        tabFocused: activity.tabFocused,
        recentActivityCount,
        timeSinceLastActivity: Math.floor(timeSinceLastActivity / 1000) + 's',
        threshold: '< 5 events AND > 20s idle'
      });
      handleLowAttentionState();
      return; // Early return prevents multiple alerts (Requirement 5.7)
    }
    
    // ========================================================================
    // PRIORITY 3: Over-Engagement Detection
    // ========================================================================
    // Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
    // 
    // Thresholds:
    // - Time threshold: Estimated read time + 60 seconds
    // - Activity threshold: > 10 events in 2-minute window
    // 
    // Rationale: If user spends significantly longer than expected (60+ seconds
    // over estimate) while remaining highly active (>10 events), they're likely
    // struggling with the content complexity. The high activity distinguishes
    // this from simply reading slowly.
    if (timeOnCurrentChunk > (estimatedReadTime + 60) * 1000 && 
        recentActivityCount > 10) {
      console.log('🔴 OVER-ENGAGEMENT TRIGGERED:', {
        timeOnChunk: Math.floor(timeOnCurrentChunk / 1000) + 's',
        estimatedTime: estimatedReadTime + 's',
        recentActivityCount,
        threshold: 'time > estimated + 60s AND > 10 events'
      });
      handleOverEngagementState(timeOnCurrentChunk);
      return; // Early return prevents multiple alerts (Requirement 5.7)
    }
    
    // ========================================================================
    // PRIORITY 4: Idle on Chunk (Time Exceeded with Low Activity)
    // ========================================================================
    // Requirements: 4.1, 4.2, 4.3
    // 
    // Thresholds:
    // - Time threshold: Estimated read time + 120 seconds (2 minutes)
    // - Activity threshold: <= 5 events in 2-minute window (low activity)
    // 
    // Rationale: If user exceeds the estimated time by a significant margin
    // (2+ minutes) with minimal activity, they may be idle on the chunk or
    // distracted. This is different from over-engagement where they're actively
    // struggling - here they're just not engaging at all.
    if (timeOnCurrentChunk > (estimatedReadTime + 120) * 1000 && 
        recentActivityCount <= 5) {
      const minutes = Math.floor(timeOnCurrentChunk / 60000);
      const message = `You've been on this section for ${minutes} minutes with minimal activity. Are you still there? Would you like to simplify the content?`;
      console.log('🔴 IDLE ON CHUNK TRIGGERED:', {
        timeOnChunk: Math.floor(timeOnCurrentChunk / 1000) + 's',
        estimatedTime: estimatedReadTime + 's',
        recentActivityCount,
        threshold: 'time > estimated + 120s AND <= 5 events'
      });
      showAlert('over_engagement', message);
      metricsData.current.overEngagementCount++;
      return; // Early return prevents multiple alerts (Requirement 5.7)
    }
  };

  // ==========================================================================
  // Event Handlers
  // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
  // ==========================================================================

  /**
   * Handles mouse move events with throttling
   * Throttled to max 1 event per 500ms for performance
   * Requirements: 1.1, 10.3, 10.4, 10.7
   * 
   * Performance Optimization: Mouse move events fire very frequently (potentially
   * hundreds of times per second). Without throttling, this would:
   * - Cause excessive re-renders
   * - Bloat the activity window with redundant timestamps
   * - Increase CPU usage unnecessarily
   * 
   * Throttle Threshold: 500ms (0.5 seconds)
   * Rationale: 500ms is frequent enough to capture genuine mouse activity
   * while filtering out the noise of continuous movement.
   */
  const handleMouseMove = () => {
    const now = Date.now();
    // Throttle check: Only process if 500ms has passed since last event
    if (now - lastMouseMoveTime.current < 500) return;
    lastMouseMoveTime.current = now;
    recordActivity('mouse');
  };

  /**
   * Handles mouse click events
   * Requirements: 1.2
   */
  const handleMouseClick = () => {
    recordActivity('mouse');
  };

  /**
   * Handles keyboard events
   * Requirements: 1.3
   */
  const handleKeyPress = () => {
    recordActivity('keyboard');
  };

  /**
   * Handles scroll events
   * Requirements: 1.4
   */
  const handleScroll = () => {
    recordActivity('scroll');
  };

  /**
   * Handles window focus event
   * Requirements: 1.5, 2.1, 2.2, 8.4
   */
  const handleFocus = () => {
    setActivity(prev => ({ ...prev, tabFocused: true }));
    awayStartTime.current = null;
    metricsData.current.focusSwitches++;
    console.log('👁️  Tab focused - awayStartTime reset');
  };

  /**
   * Handles window blur event
   * Requirements: 1.5, 2.1, 2.2, 8.4
   */
  const handleBlur = () => {
    setActivity(prev => ({ ...prev, tabFocused: false }));
    awayStartTime.current = Date.now();
    metricsData.current.focusSwitches++;
    console.log('👁️  Tab blurred');
  };

  /**
   * Handles visibility change event
   * Requirements: 1.5, 2.1, 2.2
   */
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setActivity(prev => ({ ...prev, tabFocused: false }));
      awayStartTime.current = Date.now();
      console.log('👁️  Tab hidden');
    } else {
      setActivity(prev => ({ ...prev, tabFocused: true }));
      awayStartTime.current = null;
      console.log('👁️  Tab visible');
    }
  };

  // ==========================================================================
  // Metrics Persistence
  // Requirements: 8.6, 8.7
  // ==========================================================================

  /**
   * Saves metrics to local storage
   * Requirements: 8.6
   */
  const saveMetricsToLocalStorage = () => {
    try {
      const key = `attention_metrics_${sessionId}`;
      metricsData.current.chunkEndTime = Date.now();
      metricsData.current.updatedAt = Date.now();
      
      localStorage.setItem(key, JSON.stringify(metricsData.current));
      console.log('💾 Metrics saved to local storage:', key);
    } catch (error) {
      console.warn('Failed to save metrics to local storage:', error);
      // Fail silently - don't disrupt user experience
    }
  };

  /**
   * Sends metrics to backend analytics API
   * Requirements: 8.7, 9.4
   */
  const sendMetricsToBackend = async () => {
    try {
      metricsData.current.chunkEndTime = Date.now();
      metricsData.current.updatedAt = Date.now();
      
      const response = await fetch('/api/attention-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: metricsData.current.sessionId,
          chunk_id: metricsData.current.chunkId,
          metrics: {
            total_active_time: metricsData.current.totalActiveTime,
            total_idle_time: metricsData.current.totalIdleTime,
            mouse_events: metricsData.current.mouseEvents,
            keyboard_events: metricsData.current.keyboardEvents,
            scroll_events: metricsData.current.scrollEvents,
            focus_switches: metricsData.current.focusSwitches,
            low_attention_count: metricsData.current.lowAttentionCount,
            over_engagement_count: metricsData.current.overEngagementCount,
            away_count: metricsData.current.awayCount,
            simplify_requests: metricsData.current.simplifyRequests,
            alerts_dismissed: metricsData.current.alertsDismissed,
            // Emotion data (Requirement 9.4)
            emotion_distribution: metricsData.current.emotionDistribution,
            emotion_based_interventions: metricsData.current.emotionBasedInterventions,
            average_emotion_confidence: metricsData.current.averageEmotionConfidence,
            emotion_confidence_trend: metricsData.current.emotionConfidenceTrend,
          },
          timestamp: Date.now(),
        }),
      });
      
      if (response.ok) {
        console.log('📊 Metrics sent to backend successfully (including emotion data)');
      } else {
        console.warn('Failed to send metrics to backend:', response.status);
      }
    } catch (error) {
      console.warn('Failed to send metrics to backend:', error);
      // Fail silently - metrics still saved locally
    }
  };

  // ==========================================================================
  // Tracking Lifecycle
  // Requirements: 1.7
  // ==========================================================================

  /**
   * Starts tracking by adding all event listeners
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  const startTracking = () => {
    try {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleMouseClick);
      
      // Keyboard events
      document.addEventListener('keypress', handleKeyPress);
      document.addEventListener('keydown', handleKeyPress);
      
      // Scroll events
      document.addEventListener('scroll', handleScroll);
      
      // Focus events
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      
      // Visibility change
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      console.log('🎯 AttentionTracker initialized for session:', sessionId);
      
      // Store cleanup function in window object for proper cleanup
      (window as any).attentionCleanup = stopTracking;
    } catch (error) {
      console.error('Failed to initialize attention tracking:', error);
    }
  };

  /**
   * Stops tracking by removing all event listeners
   * Requirements: 1.7, 9.7, 10.6
   */
  const stopTracking = () => {
    try {
      // Remove mouse events
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      
      // Remove keyboard events
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('keydown', handleKeyPress);
      
      // Remove scroll events
      document.removeEventListener('scroll', handleScroll);
      
      // Remove focus events
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      // Remove visibility change
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      console.log('🛑 AttentionTracker stopped');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // ==========================================================================
  // Lifecycle Effects
  // Requirements: 1.7, 4.7, 9.7, 10.6
  // ==========================================================================

  /**
   * Initialize tracking on component mount
   * Requirements: 1.7
   * 
   * This effect runs once on mount to:
   * - Request notification permission for cross-tab alerts
   * - Add all event listeners via startTracking()
   * - Start the evaluation interval (every 10 seconds)
   * - Log initialization to console
   */
  useEffect(() => {
    // Request notification permission for cross-tab alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        } else {
          console.log('⚠️  Notification permission denied - alerts will only show on active tab');
        }
      });
    }
    
    // Initialize tracking
    startTracking();
    
    // Start evaluation interval (every 10 seconds)
    // Requirements: 5.1, 10.5
    evaluationInterval.current = setInterval(evaluateAttention, 10000);
    console.log('⏱️  Evaluation interval started (10s)');
    
    // Cleanup function runs on unmount
    // Requirements: 1.7, 9.7, 10.6
    return () => {
      // Remove all event listeners
      stopTracking();
      
      // Clear evaluation interval
      if (evaluationInterval.current) {
        clearInterval(evaluationInterval.current);
        evaluationInterval.current = null;
        console.log('⏱️  Evaluation interval cleared');
      }
      
      // Save metrics to local storage
      // Requirements: 8.6
      saveMetricsToLocalStorage();
      
      // Send metrics to backend (if configured)
      // Requirements: 8.7
      sendMetricsToBackend();
      
      console.log('🧹 AttentionTracker cleanup complete');
    };
  }, []); // Empty dependency array - run only on mount/unmount

  /**
   * Reset tracking when chunk changes
   * Requirements: 4.7
   * 
   * This effect runs whenever the currentChunk changes to:
   * - Reset the activity window (clear all timestamps)
   * - Reset activity counters (start fresh for new chunk)
   * - Dismiss any visible alerts (old alerts no longer relevant)
   * - Update metrics tracking for new chunk
   * - Log chunk change to console
   * 
   * Rationale: Each chunk should be tracked independently. When a user
   * navigates to a new chunk, their previous activity patterns are no
   * longer relevant for attention detection. This ensures:
   * - Over-engagement detection uses correct time baseline
   * - Activity counts reflect current chunk engagement
   * - Alerts are contextual to current content
   */
  useEffect(() => {
    // Skip on initial mount (currentChunk will be set initially)
    // Only run when chunk actually changes
    // This prevents unnecessary resets on component initialization
    if (metricsData.current.chunkId === currentChunk) {
      return;
    }
    
    // Reset activity window - clear all timestamps
    // This ensures activity density calculations start fresh
    activityWindow.current = [];
    
    // Reset activity counters for new chunk
    // Preserves tab focus state but resets interaction counts
    setActivity(prev => ({
      ...prev,
      mouseEvents: 0,
      keyboardEvents: 0,
      scrollEvents: 0,
      lastActivity: Date.now(),
    }));
    
    // Dismiss any visible alerts
    // Old alerts about previous chunk are no longer relevant
    if (alert.show) {
      dismissAlert();
    }
    
    // Update metrics for new chunk
    metricsData.current.chunkId = currentChunk;
    metricsData.current.chunkStartTime = chunkStartTime;
    metricsData.current.updatedAt = Date.now();
    
    // Reset time tracking for accurate active/idle time calculation
    lastEvaluationTime.current = Date.now();
    
    console.log('📖 Chunk changed, resetting attention tracking', {
      newChunk: currentChunk,
      chunkStartTime: new Date(chunkStartTime).toISOString()
    });
  }, [currentChunk, chunkStartTime]); // Run when chunk changes

  /**
   * Track emotion state changes and update metrics
   * Requirements: 9.4
   */
  useEffect(() => {
    if (!emotionState) return;
    
    // Update emotion distribution
    if (metricsData.current.emotionDistribution) {
      metricsData.current.emotionDistribution[emotionState.currentEmotion]++;
    }
    
    // Track emotion confidence trend (keep last 20 values)
    if (metricsData.current.emotionConfidenceTrend) {
      metricsData.current.emotionConfidenceTrend.push(emotionState.confidenceScore);
      if (metricsData.current.emotionConfidenceTrend.length > 20) {
        metricsData.current.emotionConfidenceTrend.shift();
      }
      
      // Calculate average confidence
      const sum = metricsData.current.emotionConfidenceTrend.reduce((a, b) => a + b, 0);
      metricsData.current.averageEmotionConfidence = sum / metricsData.current.emotionConfidenceTrend.length;
    }
    
    metricsData.current.updatedAt = Date.now();
    
    console.log('📊 Emotion metrics updated:', {
      emotion: emotionState.currentEmotion,
      confidence: emotionState.confidenceScore,
      engagement: emotionState.engagementState,
      distribution: metricsData.current.emotionDistribution
    });
    
    // Requirement 9.3: Flag potential false positives (emotion vs activity mismatch)
    detectFalsePositives();
  }, [emotionState]);

  /**
   * Detect potential false positives when emotion and activity disagree
   * Requirements: 9.3
   */
  const detectFalsePositives = () => {
    if (!emotionState) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const recentActivityCount = activityWindow.current.length;
    
    // Case 1: Emotion indicates Focused but activity is very low
    if (emotionState.currentEmotion === 'Focused' && 
        emotionState.confidenceScore >= 0.8 &&
        recentActivityCount < 3 &&
        timeSinceLastActivity > 45000) {
      console.log('⚠️  Potential false positive: Emotion=Focused but activity is very low', {
        emotion: emotionState.currentEmotion,
        confidence: emotionState.confidenceScore,
        activityCount: recentActivityCount,
        idleTime: Math.floor(timeSinceLastActivity / 1000) + 's'
      });
    }
    
    // Case 2: Emotion indicates Unfocused but activity is high
    if ((emotionState.currentEmotion === 'Bored' || emotionState.currentEmotion === 'Tired') &&
        recentActivityCount > 15 &&
        timeSinceLastActivity < 10000) {
      console.log('⚠️  Potential false positive: Emotion=Unfocused but activity is high', {
        emotion: emotionState.currentEmotion,
        confidence: emotionState.confidenceScore,
        activityCount: recentActivityCount,
        idleTime: Math.floor(timeSinceLastActivity / 1000) + 's'
      });
    }
  };

  // ==========================================================================
  // Status Display Helper Functions
  // Requirements: 7.2, 7.3, 7.6
  // ==========================================================================

  /**
   * Gets the current status text based on attention state
   * Requirements: 7.2, 7.3, 7.6, 9.1, 9.2
   * 
   * Combines emotion and activity for engagement score
   */
  const getStatusText = () => {
    // If emotion state is available, use it to enhance status
    if (emotionState) {
      // Emotion takes priority for status display
      if (emotionState.engagementState === 'Focused' && emotionState.confidenceScore >= 0.8) {
        return 'Focused';
      }
      if (emotionState.engagementState === 'Unfocused') {
        return `Unfocused (${emotionState.currentEmotion})`;
      }
      if (emotionState.engagementState === 'Uncertain') {
        return `Uncertain (${emotionState.currentEmotion})`;
      }
    }
    
    // Fallback to activity-based status
    if (!activity.tabFocused) return 'Away';
    const idleTime = Date.now() - activity.lastActivity;
    if (idleTime < 30000) return 'Focused';
    return 'Idle';
  };

  /**
   * Gets the status color based on attention state
   * Requirements: 7.2, 7.3, 7.6, 9.1, 9.2
   */
  const getStatusColor = () => {
    // If emotion state is available, use it for color
    if (emotionState) {
      if (emotionState.engagementState === 'Focused' && emotionState.confidenceScore >= 0.8) {
        return 'text-green-400';
      }
      if (emotionState.engagementState === 'Unfocused') {
        return 'text-red-400';
      }
      if (emotionState.engagementState === 'Uncertain') {
        return 'text-yellow-400';
      }
    }
    
    // Fallback to activity-based color
    const status = getStatusText();
    if (status === 'Focused') return 'text-green-400';
    if (status === 'Idle') return 'text-yellow-400';
    return 'text-red-400';
  };

  // ==========================================================================
  // Alert Helper Functions
  // Requirements: 6.2
  // ==========================================================================

  /**
   * Gets the gradient styling for alert type
   * Requirements: 6.2
   */
  const getAlertGradient = () => {
    switch (alert.type) {
      case 'away': return 'from-orange-600 to-red-600';
      case 'low_attention': return 'from-blue-600 to-indigo-600';
      case 'over_engagement': return 'from-purple-600 to-pink-600';
    }
  };

  /**
   * Gets the icon for alert type
   * Requirements: 6.2
   */
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'away': return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'low_attention': return <Lightbulb className="h-5 w-5 text-blue-400" />;
      case 'over_engagement': return <Lightbulb className="h-5 w-5 text-purple-400" />;
    }
  };

  /**
   * Handles simplify button click
   * Requirements: 3.6, 6.3, 6.6
   */
  const handleSimplifyClick = () => {
    metricsData.current.simplifyRequests++;
    onSimplifyRequest();
    dismissAlert();
  };

  /**
   * Renders action buttons based on alert type
   * Requirements: 6.3, 6.4
   */
  const renderActionButtons = () => {
    if (alert.type === 'away') {
      return (
        <button 
          onClick={dismissAlert} 
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
        >
          Continue
        </button>
      );
    }
    
    // For low_attention and over_engagement
    return (
      <>
        <button 
          onClick={handleSimplifyClick} 
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
        >
          Simplify Content
        </button>
        <button 
          onClick={dismissAlert} 
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Continue
        </button>
      </>
    );
  };

  // ==========================================================================
  // Component Render
  // ==========================================================================
  
  return (
    <>
      {/* Status Display - Bottom Left Corner */}
      {/* Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.1, 9.2 */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="bg-gray-900/95 border border-blue-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm min-w-[200px]">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className={`h-4 w-4 ${
              activity.tabFocused && (Date.now() - activity.lastActivity < 30000) 
                ? 'text-green-400 animate-pulse' 
                : activity.tabFocused 
                  ? 'text-yellow-400' 
                  : 'text-red-400'
            }`} />
            <span className="text-sm font-semibold text-white">Attention</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Activity:</span>
              <span className="text-white font-mono">
                {activityWindow.current.length}
              </span>
            </div>
            {emotionState && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Emotion:</span>
                  <span className="text-white font-medium">
                    {emotionState.currentEmotion}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white font-mono">
                    {(emotionState.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Intervention Popup */}
      {/* Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7 */}
      {/* Only show popup when tab is focused - Chrome extension handles cross-tab notifications */}
      <AnimatePresence>
        {alert.show && activity.tabFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className={`bg-gradient-to-r ${getAlertGradient()} p-6 rounded-xl shadow-2xl max-w-md mx-4 border border-white/20`}>
              <div className="flex items-start space-x-3">
                {getAlertIcon()}
                <div className="flex-1">
                  <p className="text-white font-medium mb-4">{alert.message}</p>
                  <div className="flex space-x-2">
                    {renderActionButtons()}
                  </div>
                </div>
                <button 
                  onClick={dismissAlert} 
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AttentionTracker;
