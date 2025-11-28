/**
 * EmotionStateManager
 * Manages emotion state tracking with sliding window, EMA smoothing,
 * engagement state classification, and action suggestions
 */

import { EmotionPrediction, EmotionProbabilities, EmotionClass } from '../config/emotionModels';

// ============================================================================
// Type Definitions
// ============================================================================

export type EngagementState = 'Focused' | 'Uncertain' | 'Unfocused';
export type ActionSuggestion = 'Simplify' | 'Break' | 'None';

export interface EmotionState {
  currentEmotion: EmotionClass;
  confidenceScore: number;
  engagementState: EngagementState;
  actionSuggestion: ActionSuggestion;
  emotionScores: EmotionProbabilities; // EMA smoothed scores
  isPotentialConfusion: boolean;
}

// ============================================================================
// SlidingWindow Class (Subtask 3.1)
// ============================================================================

/**
 * SlidingWindow maintains a rolling buffer of recent emotion predictions
 * Automatically removes oldest items when max size is reached
 */
class SlidingWindow {
  private buffer: EmotionPrediction[] = [];
  private readonly maxSize: number;
  private readonly absoluteMaxSize: number = 15; // Hard limit to prevent memory issues

  constructor(maxSize: number = 15) {
    this.maxSize = Math.min(maxSize, this.absoluteMaxSize);
  }

  /**
   * Add a new prediction to the window
   * Automatically removes oldest prediction if buffer is full
   */
  add(prediction: EmotionPrediction): void {
    this.buffer.push(prediction);
    
    // Remove oldest item if buffer exceeds max size
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  /**
   * Get all predictions in the window
   */
  getAll(): EmotionPrediction[] {
    return [...this.buffer];
  }

  /**
   * Get the most recent N predictions
   */
  getRecent(count: number): EmotionPrediction[] {
    if (count >= this.buffer.length) {
      return [...this.buffer];
    }
    return this.buffer.slice(-count);
  }

  /**
   * Get the number of predictions in the window
   */
  size(): number {
    return this.buffer.length;
  }

  /**
   * Clear all predictions from the window
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Check if window is empty
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Get memory usage estimate (in bytes)
   */
  getMemoryUsage(): number {
    // Rough estimate: each prediction object is ~200 bytes
    return this.buffer.length * 200;
  }

  /**
   * Trim buffer to reduce memory usage
   */
  trim(newSize: number): void {
    if (newSize < this.buffer.length) {
      this.buffer = this.buffer.slice(-newSize);
    }
  }
}

// ============================================================================
// EMASmoothing Class (Subtask 3.2)
// ============================================================================

/**
 * EMASmoothing applies Exponential Moving Average to emotion probabilities
 * Smooths out noise and provides more stable emotion detection
 */
class EMASmoothing {
  private scores: EmotionProbabilities;
  private readonly alpha: number;

  constructor(alpha: number = 0.2) {
    this.alpha = alpha;
    
    // Initialize all emotion scores to 0.25 (equal probability)
    this.scores = {
      Bored: 0.25,
      Confused: 0.25,
      Focused: 0.25,
      Tired: 0.25
    };
  }

  /**
   * Update smoothed scores with new probabilities using EMA formula:
   * score[emotion] = (1 - alpha) * previous_score[emotion] + alpha * current_prob[emotion]
   */
  update(newProbs: EmotionProbabilities): EmotionProbabilities {
    const emotions: EmotionClass[] = ['Bored', 'Confused', 'Focused', 'Tired'];
    
    for (const emotion of emotions) {
      this.scores[emotion] = 
        (1 - this.alpha) * this.scores[emotion] + 
        this.alpha * newProbs[emotion];
    }
    
    return { ...this.scores };
  }

  /**
   * Get the emotion with the highest smoothed score
   */
  getDominant(): EmotionClass {
    let maxScore = 0;
    let dominantEmotion: EmotionClass = 'Focused';
    
    const emotions: EmotionClass[] = ['Bored', 'Confused', 'Focused', 'Tired'];
    
    for (const emotion of emotions) {
      if (this.scores[emotion] > maxScore) {
        maxScore = this.scores[emotion];
        dominantEmotion = emotion;
      }
    }
    
    return dominantEmotion;
  }

  /**
   * Get all smoothed emotion scores
   */
  getScores(): EmotionProbabilities {
    return { ...this.scores };
  }

  /**
   * Reset scores to initial state (equal probability)
   */
  reset(): void {
    this.scores = {
      Bored: 0.25,
      Confused: 0.25,
      Focused: 0.25,
      Tired: 0.25
    };
  }
}

// ============================================================================
// EmotionStateManager Class (Main Service)
// ============================================================================

export class EmotionStateManager {
  private static instance: EmotionStateManager;
  
  private slidingWindow: SlidingWindow;
  private emaSmoothing: EMASmoothing;
  private currentState: EmotionState;
  private confidenceAdjustment: number = 0; // Cloud calibration adjustment
  private emaAlpha: number = 0.2; // EMA smoothing parameter
  private lastCleanupTime: number = Date.now();
  private cleanupInterval: number = 60000; // Cleanup every 60 seconds

  private constructor() {
    this.slidingWindow = new SlidingWindow(15);
    this.emaSmoothing = new EMASmoothing(this.emaAlpha);
    
    // Initialize with default state
    this.currentState = {
      currentEmotion: 'Focused',
      confidenceScore: 0.0,
      engagementState: 'Uncertain',
      actionSuggestion: 'None',
      emotionScores: this.emaSmoothing.getScores(),
      isPotentialConfusion: false
    };
  }

  static getInstance(): EmotionStateManager {
    if (!EmotionStateManager.instance) {
      EmotionStateManager.instance = new EmotionStateManager();
    }
    return EmotionStateManager.instance;
  }

  /**
   * Add a new emotion prediction and update state
   */
  addPrediction(prediction: EmotionPrediction): void {
    // Apply confidence adjustment from cloud calibration
    const adjustedPrediction = this.applyConfidenceAdjustment(prediction);
    
    // Add to sliding window
    this.slidingWindow.add(adjustedPrediction);
    
    // Periodic cleanup to manage memory
    this.performPeriodicCleanup();
    
    // Update EMA smoothed scores
    const smoothedScores = this.emaSmoothing.update(adjustedPrediction.probabilities);
    
    // Get dominant emotion from smoothed scores
    const dominantEmotion = this.emaSmoothing.getDominant();
    
    // Update current state
    this.currentState = {
      currentEmotion: dominantEmotion,
      confidenceScore: adjustedPrediction.confidence,
      engagementState: this.classifyEngagementState(adjustedPrediction.confidence, dominantEmotion),
      actionSuggestion: this.determineActionSuggestion(dominantEmotion, adjustedPrediction.confidence),
      emotionScores: smoothedScores,
      isPotentialConfusion: this.detectPotentialConfusion()
    };
  }

  /**
   * Get the current emotion state
   */
  getCurrentState(): EmotionState {
    return { ...this.currentState };
  }

  /**
   * Get the current engagement state
   */
  getEngagementState(): EngagementState {
    return this.currentState.engagementState;
  }

  /**
   * Reset the state manager (clear history and reset smoothing)
   */
  reset(): void {
    this.slidingWindow.clear();
    this.emaSmoothing.reset();
    
    this.currentState = {
      currentEmotion: 'Focused',
      confidenceScore: 0.0,
      engagementState: 'Uncertain',
      actionSuggestion: 'None',
      emotionScores: this.emaSmoothing.getScores(),
      isPotentialConfusion: false
    };
  }

  /**
   * Get all predictions in the sliding window
   */
  getPredictionHistory(): EmotionPrediction[] {
    return this.slidingWindow.getAll();
  }

  // ============================================================================
  // Engagement State Classification (Subtask 3.3)
  // ============================================================================

  /**
   * Classify engagement state based on confidence and emotion
   * - Focused: confidence ≥ 0.8
   * - Uncertain: confidence < 0.5
   * - Unfocused: Bored/Tired dominant
   */
  private classifyEngagementState(confidence: number, emotion: EmotionClass): EngagementState {
    // High confidence indicates focused state
    if (confidence >= 0.8) {
      return 'Focused';
    }
    
    // Low confidence indicates uncertainty
    if (confidence < 0.5) {
      return 'Uncertain';
    }
    
    // Bored or Tired indicates unfocused state
    if (emotion === 'Bored' || emotion === 'Tired') {
      return 'Unfocused';
    }
    
    // Default to Uncertain for moderate confidence with Confused
    if (emotion === 'Confused') {
      return 'Uncertain';
    }
    
    // Otherwise, consider as Focused
    return 'Focused';
  }

  /**
   * Detect potential confusion by tracking confidence trends
   * Flags when Focused confidence drops steadily across 3+ consecutive predictions
   */
  private detectPotentialConfusion(): boolean {
    const recentPredictions = this.slidingWindow.getRecent(3);
    
    // Need at least 3 predictions to detect trend
    if (recentPredictions.length < 3) {
      return false;
    }
    
    // Check if all recent predictions show Focused emotion
    const allFocused = recentPredictions.every(p => p.emotion === 'Focused');
    
    if (!allFocused) {
      return false;
    }
    
    // Check for consecutive confidence drops
    let consecutiveDrops = 0;
    
    for (let i = 1; i < recentPredictions.length; i++) {
      if (recentPredictions[i].confidence < recentPredictions[i - 1].confidence) {
        consecutiveDrops++;
      }
    }
    
    // Flag as potential confusion if confidence dropped in all intervals
    return consecutiveDrops >= 2; // 3 predictions = 2 intervals
  }

  // ============================================================================
  // Action Suggestion Logic (Subtask 3.4)
  // ============================================================================

  /**
   * Determine action suggestion based on emotion and confidence
   * - 'Simplify': for persistent Confused/Bored
   * - 'Break': for prolonged Tired/Unfocused
   * - 'None': for Focused state
   */
  private determineActionSuggestion(emotion: EmotionClass, confidence: number): ActionSuggestion {
    // No action needed for focused state with high confidence
    if (emotion === 'Focused' && confidence >= 0.8) {
      return 'None';
    }
    
    // Check for persistent Confused or Bored (suggest simplification)
    if (emotion === 'Confused' || emotion === 'Bored') {
      const recentPredictions = this.slidingWindow.getRecent(5);
      
      if (recentPredictions.length >= 3) {
        const confusedOrBoredCount = recentPredictions.filter(
          p => p.emotion === 'Confused' || p.emotion === 'Bored'
        ).length;
        
        // If majority of recent predictions are Confused/Bored, suggest simplification
        if (confusedOrBoredCount >= 3) {
          return 'Simplify';
        }
      }
    }
    
    // Check for prolonged Tired or Unfocused (suggest break)
    if (emotion === 'Tired') {
      const recentPredictions = this.slidingWindow.getRecent(5);
      
      if (recentPredictions.length >= 3) {
        const tiredCount = recentPredictions.filter(p => p.emotion === 'Tired').length;
        
        // If majority of recent predictions are Tired, suggest break
        if (tiredCount >= 3) {
          return 'Break';
        }
      }
    }
    
    // Check for general unfocused state (Bored + Tired)
    const recentPredictions = this.slidingWindow.getRecent(5);
    if (recentPredictions.length >= 3) {
      const unfocusedCount = recentPredictions.filter(
        p => p.emotion === 'Bored' || p.emotion === 'Tired'
      ).length;
      
      // If majority are unfocused, suggest break
      if (unfocusedCount >= 4) {
        return 'Break';
      }
    }
    
    // Default: no action
    return 'None';
  }

  // ============================================================================
  // Cloud Calibration Integration (Task 10.2)
  // ============================================================================

  /**
   * Apply confidence adjustment from cloud calibration
   */
  private applyConfidenceAdjustment(prediction: EmotionPrediction): EmotionPrediction {
    if (this.confidenceAdjustment === 0) {
      return prediction;
    }

    // Apply adjustment to confidence
    let adjustedConfidence = prediction.confidence + this.confidenceAdjustment;
    
    // Clamp to valid range [0, 1]
    adjustedConfidence = Math.max(0, Math.min(1, adjustedConfidence));

    // Create adjusted prediction
    return {
      ...prediction,
      confidence: adjustedConfidence
    };
  }

  /**
   * Set confidence adjustment from cloud calibration
   */
  setConfidenceAdjustment(adjustment: number): void {
    this.confidenceAdjustment = adjustment;
    console.log(`EmotionStateManager: Confidence adjustment set to ${adjustment.toFixed(3)}`);
  }

  /**
   * Get current confidence adjustment
   */
  getConfidenceAdjustment(): number {
    return this.confidenceAdjustment;
  }

  /**
   * Adjust EMA smoothing parameter (alpha)
   * Lower alpha = more smoothing (slower response)
   * Higher alpha = less smoothing (faster response)
   */
  setEMAAlpha(alpha: number): void {
    // Clamp alpha to valid range [0, 1]
    this.emaAlpha = Math.max(0, Math.min(1, alpha));
    
    // Update EMA smoothing instance
    this.emaSmoothing = new EMASmoothing(this.emaAlpha);
    
    console.log(`EmotionStateManager: EMA alpha adjusted to ${this.emaAlpha.toFixed(3)}`);
  }

  /**
   * Get current EMA alpha value
   */
  getEMAAlpha(): number {
    return this.emaAlpha;
  }

  /**
   * Apply calibration recommendations from cloud service
   */
  applyCalibrationRecommendation(recommendation: {
    action: string;
    suggested_threshold_adjustment: number;
    severity: string;
  }): void {
    console.log('Applying calibration recommendation:', recommendation);

    switch (recommendation.action) {
      case 'adjust_confidence':
        // Apply suggested confidence adjustment
        this.setConfidenceAdjustment(recommendation.suggested_threshold_adjustment);
        break;

      case 'recalibrate_model':
        // Significant mismatch - apply adjustment and increase smoothing
        this.setConfidenceAdjustment(recommendation.suggested_threshold_adjustment);
        
        // Increase smoothing temporarily (lower alpha)
        if (recommendation.severity === 'high') {
          this.setEMAAlpha(Math.max(0.1, this.emaAlpha - 0.05));
        }
        break;

      case 'adjust_distribution':
        // Probability distribution divergence - increase smoothing
        this.setEMAAlpha(Math.max(0.15, this.emaAlpha - 0.03));
        break;

      case 'monitor':
        // Moderate mismatch - slight adjustment
        if (Math.abs(recommendation.suggested_threshold_adjustment) > 0.1) {
          this.setConfidenceAdjustment(recommendation.suggested_threshold_adjustment * 0.5);
        }
        break;

      case 'uncertain':
      case 'none':
      default:
        // No action needed
        break;
    }
  }

  /**
   * Reset calibration adjustments to defaults
   */
  resetCalibration(): void {
    this.confidenceAdjustment = 0;
    this.emaAlpha = 0.2;
    this.emaSmoothing = new EMASmoothing(this.emaAlpha);
    console.log('EmotionStateManager: Calibration reset to defaults');
  }

  /**
   * Get statistics about the current emotion state
   */
  getStatistics(): {
    windowSize: number;
    emotionDistribution: Record<EmotionClass, number>;
    averageConfidence: number;
  } {
    const predictions = this.slidingWindow.getAll();
    
    if (predictions.length === 0) {
      return {
        windowSize: 0,
        emotionDistribution: { Bored: 0, Confused: 0, Focused: 0, Tired: 0 },
        averageConfidence: 0
      };
    }
    
    // Calculate emotion distribution
    const distribution: Record<EmotionClass, number> = {
      Bored: 0,
      Confused: 0,
      Focused: 0,
      Tired: 0
    };
    
    let totalConfidence = 0;
    
    for (const prediction of predictions) {
      distribution[prediction.emotion]++;
      totalConfidence += prediction.confidence;
    }
    
    // Convert counts to percentages
    for (const emotion in distribution) {
      distribution[emotion as EmotionClass] = 
        (distribution[emotion as EmotionClass] / predictions.length) * 100;
    }
    
    return {
      windowSize: predictions.length,
      emotionDistribution: distribution,
      averageConfidence: totalConfidence / predictions.length
    };
  }

  /**
   * Perform periodic cleanup to manage memory
   */
  private performPeriodicCleanup(): void {
    const now = Date.now();
    
    if (now - this.lastCleanupTime > this.cleanupInterval) {
      // Trim sliding window if needed
      const currentSize = this.slidingWindow.size();
      if (currentSize > 10) {
        // Keep only the most recent 10 predictions during cleanup
        this.slidingWindow.trim(10);
      }
      
      this.lastCleanupTime = now;
      console.log('EmotionStateManager: Periodic cleanup performed');
    }
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): number {
    return this.slidingWindow.getMemoryUsage();
  }

  /**
   * Optimize memory usage by reducing buffer size
   */
  optimizeMemory(): void {
    this.slidingWindow.trim(8); // Reduce to minimum viable size
    console.log('EmotionStateManager: Memory optimized');
  }
}

// Export singleton instance
export const emotionStateManager = EmotionStateManager.getInstance();
