/**
 * Kiro Emotion Intelligence System - Type Definitions
 * 
 * Core types for emotion analysis, temporal tracking, and intervention logic.
 */

// ============================================================================
// Emotion Types
// ============================================================================

/**
 * Four emotion classes detected by the ensemble models
 */
export type EmotionClass = 'Focused' | 'Confused' | 'Bored' | 'Tired';

/**
 * Probability distribution across all emotion classes
 * All values should sum to approximately 1.0
 */
export interface EmotionProbabilities {
  Focused: number;
  Confused: number;
  Bored: number;
  Tired: number;
}

/**
 * Single emotion prediction frame from the ensemble
 */
export interface EmotionFrame {
  emotion: EmotionClass;
  probabilities: EmotionProbabilities;
  confidence: number;
  timestamp: number;
}

/**
 * Aggregated emotion distribution over a time window
 */
export interface EmotionDistribution {
  dominant: EmotionClass;
  distribution: EmotionProbabilities;
  confidence: number;
}

// ============================================================================
// Attention Types
// ============================================================================

/**
 * Attention level categories
 */
export type AttentionLevel = 'high' | 'medium' | 'low' | 'away';

/**
 * Current attention state of the learner
 */
export interface AttentionState {
  level: AttentionLevel;
  isActive: boolean;
  isLookingAtScreen: boolean;
  isTabFocused: boolean;
  idleDuration: number; // in seconds
}

// ============================================================================
// Intervention Types
// ============================================================================

/**
 * Recommended actions for interventions
 */
export type RecommendedAction = 'simplify' | 'break' | 'quiz' | 'continue' | 'none';

/**
 * Tier evaluation result
 */
export interface TierEvaluation {
  tier: number | null;
  reason: string;
  duration: number;
  should_trigger: boolean;
}

/**
 * Intervention configuration for UI
 */
export interface InterventionConfig {
  tier: number;
  message: string;
  actions: InterventionAction[];
}

/**
 * Action button in intervention UI
 */
export interface InterventionAction {
  label: string;
  action: () => void;
}

// ============================================================================
// Kiro Analysis Output
// ============================================================================

/**
 * Complete analysis output from Kiro engine
 */
export interface KiroAnalysis {
  dominant_emotion: EmotionClass;
  emotion_20s_aggregate: EmotionDistribution;
  emotion_60s_aggregate: EmotionDistribution;
  ema_trend: EmotionProbabilities;
  attention_state: AttentionState;
  recommended_action: RecommendedAction;
  trigger_tier: number | null;
  should_intervene: boolean;
  timestamp: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * EMA smoothing configuration
 */
export interface EMAConfig {
  alpha: number; // Smoothing factor (0-1), default: 0.2
}

/**
 * Sliding window configuration
 */
export interface WindowConfig {
  short: number; // Short window duration in seconds, default: 20
  long: number;  // Long window duration in seconds, default: 60
}

/**
 * Tier trigger duration configuration
 */
export interface TierConfig {
  tier1_min: number;  // Minimum duration for Tier 1 (confusion), default: 90s
  tier1_max: number;  // Maximum duration for Tier 1, default: 120s
  tier2_min: number;  // Minimum duration for Tier 2 (tired), default: 180s
  tier2_max: number;  // Maximum duration for Tier 2, default: 240s
  tier3_min: number;  // Minimum duration for Tier 3 (bored), default: 180s
  tier3_max: number;  // Maximum duration for Tier 3, default: 240s
  tier4_idle: number; // Idle duration for Tier 4 (away), default: 120s
  cooldown: number;   // Cooldown period between interventions, default: 60s
}

/**
 * Complete Kiro system configuration
 */
export interface KiroConfig {
  ema: EMAConfig;
  windows: WindowConfig;
  tiers: TierConfig;
  frameRate: number; // Frames per second, default: 0.25 (1 frame every 4 seconds)
}

// ============================================================================
// Internal State Types
// ============================================================================

/**
 * Internal state of the Kiro engine
 */
export interface KiroState {
  currentEmotion: EmotionClass;
  emaScores: EmotionProbabilities;
  emotionDurations: Map<EmotionClass, number>;
  lastTriggerTimes: Map<number, number>;
  frameCount: number;
  sessionStartTime: number;
}

/**
 * Emotion duration tracker
 */
export interface EmotionDurationTracker {
  emotion: EmotionClass;
  startTime: number;
  duration: number;
}

/**
 * Trigger history entry
 */
export interface TriggerHistoryEntry {
  tier: number;
  timestamp: number;
  emotion: EmotionClass;
  action: RecommendedAction;
  userResponse: string | null;
}
