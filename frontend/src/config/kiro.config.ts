/**
 * Kiro Emotion Intelligence System - Configuration
 * 
 * Default configuration values for the Kiro emotion analysis engine.
 * These values can be overridden at runtime using the configure() method.
 */

import { KiroConfig } from '../types/kiro.types';

/**
 * Default Kiro configuration
 * 
 * Tuned for optimal balance between responsiveness and stability:
 * - EMA alpha of 0.2 provides smooth transitions without lag
 * - 20s window captures immediate emotional shifts
 * - 60s window identifies sustained emotional trends
 * - Tier durations prevent premature interventions
 * - Cooldown period prevents alert fatigue
 */
export const DEFAULT_KIRO_CONFIG: KiroConfig = {
  // Exponential Moving Average configuration
  ema: {
    alpha: 0.2  // 80% previous, 20% current - smooth but responsive
  },

  // Sliding window durations
  windows: {
    short: 20,  // 20 seconds - short-term emotional snapshot
    long: 60    // 60 seconds - trend-level emotional state
  },

  // Tier trigger durations (in seconds) - STRICT TIMING
  tiers: {
    // Tier 1: Confusion - intervene early (1.5-2 min)
    tier1_min: 90,   // 1.5 minutes minimum
    tier1_max: 120,  // 2 minutes maximum
    
    // Tier 2: Bored/Low Attention (3-4 min)
    tier2_min: 180,  // 3 minutes minimum
    tier2_max: 240,  // 4 minutes maximum
    
    // Tier 3: Tired/Sleepy (4-5 min)
    tier3_min: 240,  // 4 minutes minimum
    tier3_max: 300,  // 5 minutes maximum
    
    // Tier 4: Away/Idle - immediate
    tier4_idle: 60,  // 1 minute idle (immediate detection)
    
    // Global cooldown between ANY interventions
    cooldown: 120    // 2 minutes minimum between ANY alerts (prevents flooding)
  },

  // Frame rate for emotion capture
  frameRate: 0.25  // 1 frame every 4 seconds (15 frames per minute)
};

/**
 * Calculate expected frame count for a given duration
 * 
 * @param durationSeconds - Duration in seconds
 * @param frameRate - Frames per second (default: 0.25)
 * @returns Expected number of frames
 */
export function getExpectedFrameCount(
  durationSeconds: number,
  frameRate: number = DEFAULT_KIRO_CONFIG.frameRate
): number {
  return Math.ceil(durationSeconds * frameRate);
}

/**
 * Window size constants (in frames)
 */
export const WINDOW_SIZES = {
  SHORT: getExpectedFrameCount(DEFAULT_KIRO_CONFIG.windows.short),  // 5 frames
  LONG: getExpectedFrameCount(DEFAULT_KIRO_CONFIG.windows.long)     // 15 frames
};

/**
 * Tier messages for interventions (STRICT TIER SYSTEM)
 */
export const TIER_MESSAGES = {
  1: "Looks like this is getting tough… Want me to simplify it?",  // Confusion (1.5-2 min)
  2: "Feeling bored? Should we try a quick quiz or flash cards?",  // Bored (3-4 min)
  3: "You look tired… Want a short break or some water?",          // Tired (4-5 min)
  4: "You've been away for a while. Shall we continue learning?"   // Away/Idle
};

/**
 * Tier action labels (STRICT TIER SYSTEM)
 */
export const TIER_ACTIONS = {
  1: [  // Confusion Intervention
    { label: "Simplify Content", action: "simplify" },
    { label: "Alternative Explanation", action: "explain" },
    { label: "Continue As Is", action: "continue" }
  ],
  2: [  // Bored/Low Attention
    { label: "Try a Quiz", action: "quiz" },
    { label: "Flash Cards", action: "flashcards" },
    { label: "Interactive Content", action: "interactive" },
    { label: "Continue Reading", action: "continue" }
  ],
  3: [  // Tired/Sleepy
    { label: "Take a Break", action: "break" },
    { label: "Get Water", action: "water" },
    { label: "Micro Exercise", action: "exercise" },
    { label: "Continue Learning", action: "continue" }
  ],
  4: [  // Away/Idle
    { label: "Continue Learning", action: "continue" },
    { label: "End Session", action: "end" }
  ]
};

/**
 * Emotion class colors for UI visualization
 */
export const EMOTION_COLORS = {
  Focused: '#10b981',   // Green
  Confused: '#f59e0b',  // Amber
  Bored: '#6366f1',     // Indigo
  Tired: '#ef4444'      // Red
};

/**
 * Attention level colors for UI visualization
 */
export const ATTENTION_COLORS = {
  high: '#10b981',    // Green
  medium: '#f59e0b',  // Amber
  low: '#ef4444',     // Red
  away: '#6b7280'     // Gray
};

/**
 * Validate Kiro configuration
 * 
 * @param config - Configuration to validate
 * @returns true if valid, throws error if invalid
 */
export function validateKiroConfig(config: Partial<KiroConfig>): boolean {
  if (config.ema?.alpha !== undefined) {
    if (config.ema.alpha < 0 || config.ema.alpha > 1) {
      throw new Error('EMA alpha must be between 0 and 1');
    }
  }

  if (config.windows) {
    if (config.windows.short && config.windows.short <= 0) {
      throw new Error('Short window duration must be positive');
    }
    if (config.windows.long && config.windows.long <= 0) {
      throw new Error('Long window duration must be positive');
    }
    if (config.windows.short && config.windows.long && config.windows.short >= config.windows.long) {
      throw new Error('Short window must be shorter than long window');
    }
  }

  if (config.tiers) {
    const tiers = config.tiers;
    if (tiers.tier1_min && tiers.tier1_max && tiers.tier1_min > tiers.tier1_max) {
      throw new Error('Tier 1 min duration must be <= max duration');
    }
    if (tiers.tier2_min && tiers.tier2_max && tiers.tier2_min > tiers.tier2_max) {
      throw new Error('Tier 2 min duration must be <= max duration');
    }
    if (tiers.tier3_min && tiers.tier3_max && tiers.tier3_min > tiers.tier3_max) {
      throw new Error('Tier 3 min duration must be <= max duration');
    }
    if (tiers.cooldown && tiers.cooldown < 0) {
      throw new Error('Cooldown period must be non-negative');
    }
  }

  if (config.frameRate !== undefined && config.frameRate <= 0) {
    throw new Error('Frame rate must be positive');
  }

  return true;
}
