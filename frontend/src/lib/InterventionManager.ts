/**
 * InterventionManager
 * Implements tiered intervention logic with temporal pattern analysis
 * Manages intervention timing, cooldowns, and response tracking
 */

import { EmotionPrediction, EmotionClass } from '../config/emotionModels';
import { EmotionState } from './EmotionStateManager';

// ============================================================================
// Type Definitions
// ============================================================================

export interface InterventionDecision {
  shouldIntervene: boolean;
  tier: 1 | 2 | null;
  message: string;
  reason: string;
}

export interface InterventionResponse {
  timestamp: number;
  tier: 1 | 2;
  accepted: boolean;
  emotion: EmotionClass;
  confidence: number;
}

export interface InterventionMetrics {
  tier1Count: number;
  tier2Count: number;
  tier1Accepted: number;
  tier1Dismissed: number;
  tier2Accepted: number;
  tier2Dismissed: number;
  lastTier1Trigger: number;
  lastTier2Trigger: number;
}

// ============================================================================
// InterventionManager Class
// ============================================================================

export class InterventionManager {
  private static instance: InterventionManager;
  
  // Cooldown timers (in milliseconds)
  private readonly tier1Cooldown: number = 60000; // 60 seconds
  private readonly tier2Cooldown: number = 120000; // 120 seconds
  
  // Last trigger timestamps
  private tier1LastTrigger: number = 0;
  private tier2LastTrigger: number = 0;
  
  // Intervention response tracking
  private interventionHistory: InterventionResponse[] = [];
  
  // Metrics
  private metrics: InterventionMetrics = {
    tier1Count: 0,
    tier2Count: 0,
    tier1Accepted: 0,
    tier1Dismissed: 0,
    tier2Accepted: 0,
    tier2Dismissed: 0,
    lastTier1Trigger: 0,
    lastTier2Trigger: 0
  };

  private constructor() {}

  static getInstance(): InterventionManager {
    if (!InterventionManager.instance) {
      InterventionManager.instance = new InterventionManager();
    }
    return InterventionManager.instance;
  }

  // ============================================================================
  // Main Evaluation Method
  // ============================================================================

  /**
   * Evaluate whether an intervention should be triggered
   * Checks Tier 2 first (higher priority), then Tier 1
   */
  evaluateIntervention(
    emotionHistory: EmotionPrediction[],
    currentState: EmotionState
  ): InterventionDecision {
    const now = Date.now();
    
    // Check Tier 2 first (higher priority - prolonged disengagement)
    const tier2Decision = this.checkTier2Intervention(emotionHistory, now);
    if (tier2Decision.shouldIntervene) {
      this.tier2LastTrigger = now;
      this.metrics.tier2Count++;
      this.metrics.lastTier2Trigger = now;
      return tier2Decision;
    }
    
    // Check Tier 1 (persistent confusion/boredom)
    const tier1Decision = this.checkTier1Intervention(emotionHistory, now);
    if (tier1Decision.shouldIntervene) {
      this.tier1LastTrigger = now;
      this.metrics.tier1Count++;
      this.metrics.lastTier1Trigger = now;
      return tier1Decision;
    }
    
    // No intervention needed
    return {
      shouldIntervene: false,
      tier: null,
      message: '',
      reason: ''
    };
  }

  // ============================================================================
  // Tier 1 Intervention Detection (Subtask 4.1)
  // ============================================================================

  /**
   * Check for Tier 1 intervention conditions:
   * - 3+ consecutive windows of Confused/Bored
   * - Time range is 1-3 minutes
   * - 60-second cooldown check
   * 
   * Requirements: 5.1, 5.4
   */
  private checkTier1Intervention(
    history: EmotionPrediction[],
    now: number
  ): InterventionDecision {
    // Check cooldown - don't trigger if within 60 seconds of last Tier 1
    if (now - this.tier1LastTrigger < this.tier1Cooldown) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'tier1_cooldown'
      };
    }
    
    // Need at least 3 predictions to check for consecutive windows
    if (history.length < 3) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'insufficient_history'
      };
    }
    
    // Check for 3+ consecutive windows of Confused/Bored
    const recentWindows = history.slice(-3);
    const confusedOrBoredCount = recentWindows.filter(
      p => p.emotion === 'Confused' || p.emotion === 'Bored'
    ).length;
    
    if (confusedOrBoredCount < 3) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'not_enough_confused_bored'
      };
    }
    
    // Verify time range is 1-3 minutes
    const oldestTimestamp = recentWindows[0].timestamp;
    const newestTimestamp = recentWindows[recentWindows.length - 1].timestamp;
    const timeRangeMs = newestTimestamp - oldestTimestamp;
    const timeRangeMinutes = timeRangeMs / 60000;
    
    // Check if within 1-3 minute range
    if (timeRangeMinutes < 1 || timeRangeMinutes > 3) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'time_range_outside_1_3_minutes'
      };
    }
    
    // All conditions met - trigger Tier 1 intervention
    return {
      shouldIntervene: true,
      tier: 1,
      message: 'Seems tough — shall I simplify this?',
      reason: 'persistent_confusion'
    };
  }

  // ============================================================================
  // Tier 2 Intervention Detection (Subtask 4.2)
  // ============================================================================

  /**
   * Check for Tier 2 intervention conditions:
   * - >5 minutes of disengagement
   * - Calculate unfocused ratio (>60% threshold)
   * - Check for repeated Tired/Bored states
   * - 120-second cooldown check
   * - Handle escalation from Tier 1
   * 
   * Requirements: 5.2, 5.3, 5.4
   */
  private checkTier2Intervention(
    history: EmotionPrediction[],
    now: number
  ): InterventionDecision {
    // Check cooldown - don't trigger if within 120 seconds of last Tier 2
    if (now - this.tier2LastTrigger < this.tier2Cooldown) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'tier2_cooldown'
      };
    }
    
    // Need sufficient history to evaluate prolonged disengagement
    if (history.length < 5) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'insufficient_history'
      };
    }
    
    // Check for prolonged disengagement (>5 minutes)
    const fiveMinutesAgo = now - 300000; // 5 minutes in milliseconds
    const recentHistory = history.filter(p => p.timestamp > fiveMinutesAgo);
    
    // Need at least some predictions in the 5-minute window
    if (recentHistory.length === 0) {
      return {
        shouldIntervene: false,
        tier: null,
        message: '',
        reason: 'no_recent_predictions'
      };
    }
    
    // Calculate unfocused ratio (Bored + Tired)
    const unfocusedCount = recentHistory.filter(
      p => p.emotion === 'Bored' || p.emotion === 'Tired'
    ).length;
    
    const unfocusedRatio = unfocusedCount / recentHistory.length;
    
    // Check if unfocused ratio exceeds 60% threshold
    if (unfocusedRatio > 0.6) {
      return {
        shouldIntervene: true,
        tier: 2,
        message: "You've been disengaged for a while — would you like a short break?",
        reason: 'prolonged_disengagement'
      };
    }
    
    // Check for repeated Tired/Bored states (alternative trigger)
    // Look for patterns of repeated disengagement even if not continuous
    const tiredOrBoredCount = recentHistory.filter(
      p => p.emotion === 'Tired' || p.emotion === 'Bored'
    ).length;
    
    // If more than 50% are Tired/Bored and we have enough history
    if (tiredOrBoredCount >= recentHistory.length * 0.5 && recentHistory.length >= 10) {
      return {
        shouldIntervene: true,
        tier: 2,
        message: "You've been disengaged for a while — would you like a short break?",
        reason: 'repeated_tired_bored'
      };
    }
    
    // Check for escalation from Tier 1
    // If Tier 1 was triggered recently but disengagement continues
    const timeSinceTier1 = now - this.tier1LastTrigger;
    if (timeSinceTier1 > 0 && timeSinceTier1 < 180000) { // Within 3 minutes of Tier 1
      // Check if disengagement continued after Tier 1
      const postTier1History = history.filter(p => p.timestamp > this.tier1LastTrigger);
      
      if (postTier1History.length >= 3) {
        const postTier1Unfocused = postTier1History.filter(
          p => p.emotion === 'Bored' || p.emotion === 'Tired' || p.emotion === 'Confused'
        ).length;
        
        const postTier1UnfocusedRatio = postTier1Unfocused / postTier1History.length;
        
        // If still mostly unfocused after Tier 1, escalate to Tier 2
        if (postTier1UnfocusedRatio > 0.7) {
          return {
            shouldIntervene: true,
            tier: 2,
            message: "You've been disengaged for a while — would you like a short break?",
            reason: 'escalation_from_tier1'
          };
        }
      }
    }
    
    // No Tier 2 intervention needed
    return {
      shouldIntervene: false,
      tier: null,
      message: '',
      reason: 'no_tier2_conditions_met'
    };
  }

  // ============================================================================
  // Intervention Response Tracking (Subtask 4.3)
  // ============================================================================

  /**
   * Record when an intervention is accepted or dismissed
   * Reset timers on positive response
   * Track intervention effectiveness metrics
   * 
   * Requirements: 5.5
   */
  recordInterventionResponse(
    tier: 1 | 2,
    accepted: boolean,
    emotion: EmotionClass,
    confidence: number
  ): void {
    const response: InterventionResponse = {
      timestamp: Date.now(),
      tier,
      accepted,
      emotion,
      confidence
    };
    
    // Add to history
    this.interventionHistory.push(response);
    
    // Update metrics
    if (tier === 1) {
      if (accepted) {
        this.metrics.tier1Accepted++;
        // Reset timers on positive response
        this.resetTimers();
      } else {
        this.metrics.tier1Dismissed++;
      }
    } else if (tier === 2) {
      if (accepted) {
        this.metrics.tier2Accepted++;
        // Reset timers on positive response
        this.resetTimers();
      } else {
        this.metrics.tier2Dismissed++;
      }
    }
    
    // Keep only last 50 responses to prevent memory bloat
    if (this.interventionHistory.length > 50) {
      this.interventionHistory = this.interventionHistory.slice(-50);
    }
  }

  /**
   * Reset intervention timers (called when user responds positively)
   */
  resetTimers(): void {
    this.tier1LastTrigger = 0;
    this.tier2LastTrigger = 0;
  }

  /**
   * Get intervention effectiveness metrics
   */
  getMetrics(): InterventionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get intervention response history
   */
  getResponseHistory(): InterventionResponse[] {
    return [...this.interventionHistory];
  }

  /**
   * Calculate intervention effectiveness statistics
   */
  getEffectivenessStats(): {
    tier1AcceptanceRate: number;
    tier2AcceptanceRate: number;
    overallAcceptanceRate: number;
    totalInterventions: number;
  } {
    const tier1Total = this.metrics.tier1Accepted + this.metrics.tier1Dismissed;
    const tier2Total = this.metrics.tier2Accepted + this.metrics.tier2Dismissed;
    const totalInterventions = tier1Total + tier2Total;
    
    const tier1AcceptanceRate = tier1Total > 0 
      ? (this.metrics.tier1Accepted / tier1Total) * 100 
      : 0;
    
    const tier2AcceptanceRate = tier2Total > 0 
      ? (this.metrics.tier2Accepted / tier2Total) * 100 
      : 0;
    
    const overallAcceptanceRate = totalInterventions > 0
      ? ((this.metrics.tier1Accepted + this.metrics.tier2Accepted) / totalInterventions) * 100
      : 0;
    
    return {
      tier1AcceptanceRate,
      tier2AcceptanceRate,
      overallAcceptanceRate,
      totalInterventions
    };
  }

  /**
   * Reset all intervention data (for testing or new session)
   */
  reset(): void {
    this.tier1LastTrigger = 0;
    this.tier2LastTrigger = 0;
    this.interventionHistory = [];
    this.metrics = {
      tier1Count: 0,
      tier2Count: 0,
      tier1Accepted: 0,
      tier1Dismissed: 0,
      tier2Accepted: 0,
      tier2Dismissed: 0,
      lastTier1Trigger: 0,
      lastTier2Trigger: 0
    };
  }
}

// Export singleton instance
export const interventionManager = InterventionManager.getInstance();
