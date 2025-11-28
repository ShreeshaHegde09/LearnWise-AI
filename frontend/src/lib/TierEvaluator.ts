/**
 * Tier Evaluator
 * 
 * Evaluates emotional patterns and determines intervention tiers.
 * Implements the 5-tier intervention system with time-based triggers
 * and cooldown periods to prevent spam.
 */

import {
  EmotionClass,
  EmotionDistribution,
  AttentionState,
  TierEvaluation,
  RecommendedAction,
  TierConfig
} from '../types/kiro.types';
import { DEFAULT_KIRO_CONFIG } from '../config/kiro.config';

export class TierEvaluator {
  private config: TierConfig;
  private emotionDurations: Map<EmotionClass, number> = new Map();
  private lastTriggerTimes: Map<number, number> = new Map();
  private emotionStartTimes: Map<EmotionClass, number> = new Map();
  private currentEmotion: EmotionClass | null = null;

  constructor(config: TierConfig = DEFAULT_KIRO_CONFIG.tiers) {
    this.config = config;
    this.initializeEmotionDurations();
  }

  /**
   * Initialize emotion duration trackers
   */
  private initializeEmotionDurations(): void {
    this.emotionDurations.set('Focused', 0);
    this.emotionDurations.set('Confused', 0);
    this.emotionDurations.set('Bored', 0);
    this.emotionDurations.set('Tired', 0);
  }

  /**
   * Update emotion duration tracking
   * 
   * @param emotion - Current dominant emotion
   * @param frameInterval - Time since last frame (seconds)
   */
  updateEmotionDuration(emotion: EmotionClass, frameInterval: number = 4): void {
    const now = Date.now();

    // If emotion changed, reset duration for new emotion
    if (this.currentEmotion !== emotion) {
      this.currentEmotion = emotion;
      this.emotionStartTimes.set(emotion, now);
      this.emotionDurations.set(emotion, 0);
    } else {
      // Increment duration for current emotion
      const currentDuration = this.emotionDurations.get(emotion) || 0;
      this.emotionDurations.set(emotion, currentDuration + frameInterval);
    }
  }

  /**
   * Evaluate current emotional state and determine intervention tier
   * 
   * @param dominantEmotion - Current dominant emotion from EMA
   * @param window20s - 20-second window aggregate
   * @param window60s - 60-second window aggregate
   * @param attentionState - Current attention state
   * @returns Tier evaluation result
   */
  evaluateTier(
    dominantEmotion: EmotionClass,
    window20s: EmotionDistribution,
    window60s: EmotionDistribution,
    attentionState: AttentionState
  ): TierEvaluation {
    // Update duration tracking
    this.updateEmotionDuration(dominantEmotion);

    const duration = this.emotionDurations.get(dominantEmotion) || 0;

    // Tier 0: Focused - Do Not Disturb
    if (dominantEmotion === 'Focused' && attentionState.level !== 'away') {
      return {
        tier: 0,
        reason: 'learner_focused',
        duration,
        should_trigger: false
      };
    }

    // Tier 4: Away State (attention-based only, highest priority)
    if (attentionState.level === 'away' && attentionState.idleDuration >= this.config.tier4_idle) {
      if (this.canTriggerGlobal()) {
        return {
          tier: 4,
          reason: 'user_away',
          duration: attentionState.idleDuration,
          should_trigger: true
        };
      }
    }

    // Tier 1: Confusion (1.5-2 minutes, any attention state)
    if (dominantEmotion === 'Confused') {
      if (duration >= this.config.tier1_min && duration <= this.config.tier1_max) {
        if (this.canTriggerGlobal()) {
          return {
            tier: 1,
            reason: 'sustained_confusion',
            duration,
            should_trigger: true
          };
        }
      }
    }

    // Tier 2: Bored/Low Attention (3-4 minutes)
    if (dominantEmotion === 'Bored') {
      if (duration >= this.config.tier2_min && duration <= this.config.tier2_max) {
        // Require low attention
        if (attentionState.level === 'low' || attentionState.level === 'medium') {
          if (this.canTriggerGlobal()) {
            return {
              tier: 2,
              reason: 'boredom_detected',
              duration,
              should_trigger: true
            };
          }
        }
      }
    }

    // Tier 3: Tired/Sleepy (4-5 minutes + low attention)
    if (dominantEmotion === 'Tired') {
      if (duration >= this.config.tier3_min && duration <= this.config.tier3_max) {
        // Require low activity or idle state
        if (attentionState.level === 'low' || !attentionState.isActive) {
          if (this.canTriggerGlobal()) {
            return {
              tier: 3,
              reason: 'fatigue_detected',
              duration,
              should_trigger: true
            };
          }
        }
      }
    }

    // No intervention needed
    return {
      tier: null,
      reason: 'no_intervention_needed',
      duration,
      should_trigger: false
    };
  }

  /**
   * Check if ANY intervention can be triggered (GLOBAL cooldown check)
   * This prevents alert flooding by enforcing cooldown across ALL tiers
   * 
   * @returns true if can trigger, false if in global cooldown
   */
  canTriggerGlobal(): boolean {
    if (this.lastTriggerTimes.size === 0) {
      return true; // Never triggered before
    }

    const now = Date.now();
    
    // Check if ANY tier was triggered recently
    const triggers = Array.from(this.lastTriggerTimes.values());
    for (const lastTrigger of triggers) {
      const timeSinceLastTrigger = (now - lastTrigger) / 1000;
      if (timeSinceLastTrigger < this.config.cooldown) {
        return false; // Still in global cooldown
      }
    }

    return true; // Cooldown period has passed for all tiers
  }

  /**
   * Check if a specific tier can be triggered (per-tier cooldown check)
   * 
   * @param tier - Tier number to check
   * @returns true if tier can trigger, false if in cooldown
   */
  canTrigger(tier: number): boolean {
    const lastTrigger = this.lastTriggerTimes.get(tier);
    
    if (!lastTrigger) {
      return true; // Never triggered before
    }

    const now = Date.now();
    const timeSinceLastTrigger = (now - lastTrigger) / 1000; // Convert to seconds

    return timeSinceLastTrigger >= this.config.cooldown;
  }

  /**
   * Record that a tier was triggered
   * 
   * @param tier - Tier number that was triggered
   */
  recordTrigger(tier: number): void {
    this.lastTriggerTimes.set(tier, Date.now());
  }

  /**
   * Get recommended action based on tier (STRICT TIER SYSTEM)
   * 
   * @param tier - Tier number
   * @returns Recommended action
   */
  getRecommendedAction(tier: number | null): RecommendedAction {
    switch (tier) {
      case 1:
        return 'simplify';      // Confusion → Simplify content
      case 2:
        return 'quiz';          // Bored → Interactive content
      case 3:
        return 'break';         // Tired → Take a break
      case 4:
        return 'continue';      // Away → Resume learning
      default:
        return 'none';
    }
  }

  /**
   * Get current emotion durations for debugging
   * 
   * @returns Map of emotion durations
   */
  getEmotionDurations(): Map<EmotionClass, number> {
    return new Map(this.emotionDurations);
  }

  /**
   * Get time until next possible trigger for a tier
   * 
   * @param tier - Tier number
   * @returns Seconds until tier can trigger again, or 0 if ready
   */
  getTimeUntilNextTrigger(tier: number): number {
    const lastTrigger = this.lastTriggerTimes.get(tier);
    
    if (!lastTrigger) {
      return 0; // Can trigger immediately
    }

    const now = Date.now();
    const timeSinceLastTrigger = (now - lastTrigger) / 1000;
    const timeRemaining = this.config.cooldown - timeSinceLastTrigger;

    return Math.max(0, timeRemaining);
  }

  /**
   * Reset all emotion durations and trigger times
   */
  reset(): void {
    this.initializeEmotionDurations();
    this.lastTriggerTimes.clear();
    this.emotionStartTimes.clear();
    this.currentEmotion = null;
  }

  /**
   * Update configuration
   * 
   * @param newConfig - New tier configuration
   */
  updateConfig(newConfig: Partial<TierConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * 
   * @returns Current tier configuration
   */
  getConfig(): TierConfig {
    return { ...this.config };
  }

  /**
   * Check if currently in cooldown for any tier
   * 
   * @returns true if any tier is in cooldown
   */
  isInCooldown(): boolean {
    const now = Date.now();
    const entries = Array.from(this.lastTriggerTimes.entries());
    
    for (const [tier, lastTrigger] of entries) {
      const timeSinceLastTrigger = (now - lastTrigger) / 1000;
      if (timeSinceLastTrigger < this.config.cooldown) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get the most recent trigger information
   * 
   * @returns Object with tier and time of most recent trigger, or null
   */
  getLastTrigger(): { tier: number; timestamp: number } | null {
    let mostRecentTier: number | null = null;
    let mostRecentTime = 0;

    const entries = Array.from(this.lastTriggerTimes.entries());
    for (const [tier, timestamp] of entries) {
      if (timestamp > mostRecentTime) {
        mostRecentTime = timestamp;
        mostRecentTier = tier;
      }
    }

    if (mostRecentTier === null) {
      return null;
    }

    return {
      tier: mostRecentTier,
      timestamp: mostRecentTime
    };
  }
}
