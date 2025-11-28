/**
 * EMA (Exponential Moving Average) Smoother
 * 
 * Applies exponential moving average smoothing to emotion probabilities
 * to prevent sudden jumps and provide human-like emotional continuity.
 * 
 * Formula: EMA = (1 - alpha) * previous_EMA + alpha * current_value
 * Default alpha = 0.2 means 80% previous, 20% current
 */

import { EmotionProbabilities, EmotionClass, EMAConfig } from '../types/kiro.types';
import { DEFAULT_KIRO_CONFIG } from '../config/kiro.config';

export class EMASmoother {
  private emaScores: EmotionProbabilities;
  private alpha: number;
  private isInitialized: boolean = false;

  constructor(config: EMAConfig = DEFAULT_KIRO_CONFIG.ema) {
    this.alpha = config.alpha;
    // Initialize with equal distribution (0.25 each)
    this.emaScores = {
      Focused: 0.25,
      Confused: 0.25,
      Bored: 0.25,
      Tired: 0.25
    };
  }

  /**
   * Update EMA scores with new emotion probabilities
   * 
   * @param probabilities - Current emotion probabilities
   * @returns Updated EMA scores
   */
  update(probabilities: EmotionProbabilities): EmotionProbabilities {
    if (!this.isInitialized) {
      // First frame: use current probabilities directly
      this.emaScores = { ...probabilities };
      this.isInitialized = true;
      return this.emaScores;
    }

    // Apply EMA formula: EMA = (1 - alpha) * prev + alpha * current
    const oneMinusAlpha = 1 - this.alpha;

    this.emaScores = {
      Focused: oneMinusAlpha * this.emaScores.Focused + this.alpha * probabilities.Focused,
      Confused: oneMinusAlpha * this.emaScores.Confused + this.alpha * probabilities.Confused,
      Bored: oneMinusAlpha * this.emaScores.Bored + this.alpha * probabilities.Bored,
      Tired: oneMinusAlpha * this.emaScores.Tired + this.alpha * probabilities.Tired
    };

    return { ...this.emaScores };
  }

  /**
   * Get the dominant emotion (highest EMA score)
   * 
   * @returns Emotion class with highest EMA score
   */
  getDominantEmotion(): EmotionClass {
    const emotions: Array<keyof EmotionProbabilities> = ['Focused', 'Confused', 'Bored', 'Tired'];
    
    // Find emotion with maximum EMA score
    const dominant = emotions.reduce((maxEmotion, currentEmotion) => {
      return this.emaScores[currentEmotion] > this.emaScores[maxEmotion] 
        ? currentEmotion 
        : maxEmotion;
    });

    return dominant as EmotionClass;
  }

  /**
   * Get current EMA scores for all emotions
   * 
   * @returns Current EMA probabilities
   */
  getEMAScores(): EmotionProbabilities {
    return { ...this.emaScores };
  }

  /**
   * Reset EMA scores to initial state (equal distribution)
   */
  reset(): void {
    this.emaScores = {
      Focused: 0.25,
      Confused: 0.25,
      Bored: 0.25,
      Tired: 0.25
    };
    this.isInitialized = false;
  }

  /**
   * Update the alpha (smoothing factor) value
   * 
   * @param newAlpha - New alpha value (0-1)
   * @throws Error if alpha is out of range
   */
  setAlpha(newAlpha: number): void {
    if (newAlpha < 0 || newAlpha > 1) {
      throw new Error('Alpha must be between 0 and 1');
    }
    this.alpha = newAlpha;
  }

  /**
   * Get current alpha value
   * 
   * @returns Current smoothing factor
   */
  getAlpha(): number {
    return this.alpha;
  }

  /**
   * Check if smoother has been initialized with at least one frame
   * 
   * @returns true if initialized, false otherwise
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the confidence of the dominant emotion
   * (i.e., the EMA score of the dominant emotion)
   * 
   * @returns Confidence value (0-1)
   */
  getDominantConfidence(): number {
    const dominant = this.getDominantEmotion();
    return this.emaScores[dominant];
  }

  /**
   * Get the difference between top two emotions
   * Useful for detecting uncertain states
   * 
   * @returns Difference between highest and second-highest EMA scores
   */
  getConfidenceMargin(): number {
    const scores = Object.values(this.emaScores).sort((a, b) => b - a);
    return scores[0] - scores[1];
  }
}
