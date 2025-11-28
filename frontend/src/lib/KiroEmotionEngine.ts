/**
 * Kiro Emotion Intelligence Engine
 * 
 * Main orchestrator for emotion analysis and intervention logic.
 * Combines sliding windows, EMA smoothing, and tier evaluation
 * to provide intelligent, non-intrusive emotional support.
 */

import {
  EmotionFrame,
  AttentionState,
  KiroAnalysis,
  KiroConfig,
  KiroState,
  EmotionClass
} from '../types/kiro.types';
import { DEFAULT_KIRO_CONFIG } from '../config/kiro.config';
import { SlidingWindowManager } from './SlidingWindowManager';
import { EMASmoother } from './EMASmoother';
import { TierEvaluator } from './TierEvaluator';

export class KiroEmotionEngine {
  private windowManager: SlidingWindowManager;
  private emaSmoother: EMASmoother;
  private tierEvaluator: TierEvaluator;
  private config: KiroConfig;
  private frameCount: number = 0;
  private sessionStartTime: number;

  constructor(config: KiroConfig = DEFAULT_KIRO_CONFIG) {
    this.config = config;
    this.sessionStartTime = Date.now();

    // Initialize components
    this.windowManager = new SlidingWindowManager(
      Math.ceil(config.windows.short * config.frameRate),
      Math.ceil(config.windows.long * config.frameRate)
    );
    this.emaSmoother = new EMASmoother(config.ema);
    this.tierEvaluator = new TierEvaluator(config.tiers);

    console.log('🧠 Kiro Emotion Intelligence Engine initialized');
  }

  /**
   * Process a new emotion frame and generate analysis
   * 
   * @param frame - Emotion frame from ensemble
   * @param attentionState - Current attention state
   * @returns Complete Kiro analysis with intervention recommendation
   */
  processFrame(frame: EmotionFrame, attentionState: AttentionState): KiroAnalysis {
    this.frameCount++;

    // Step 1: Add frame to sliding windows
    this.windowManager.addFrame(frame);

    // Step 2: Update EMA scores
    const emaScores = this.emaSmoother.update(frame.probabilities);
    const dominantEmotion = this.emaSmoother.getDominantEmotion();

    // Step 3: Get window aggregates
    const emotion_20s_aggregate = this.windowManager.get20sAggregate();
    const emotion_60s_aggregate = this.windowManager.get60sAggregate();

    // Step 4: Evaluate intervention tier
    const tierEvaluation = this.tierEvaluator.evaluateTier(
      dominantEmotion,
      emotion_20s_aggregate,
      emotion_60s_aggregate,
      attentionState
    );

    // Step 5: Determine if intervention should trigger
    const should_intervene = tierEvaluation.should_trigger;
    
    // Record trigger if intervention is needed
    if (should_intervene && tierEvaluation.tier !== null) {
      this.tierEvaluator.recordTrigger(tierEvaluation.tier);
      console.log(`🚨 Kiro Intervention: Tier ${tierEvaluation.tier} - ${tierEvaluation.reason}`);
    }

    // Step 6: Get recommended action
    const recommended_action = this.tierEvaluator.getRecommendedAction(tierEvaluation.tier);

    // Step 7: Build analysis output
    const analysis: KiroAnalysis = {
      dominant_emotion: dominantEmotion,
      emotion_20s_aggregate,
      emotion_60s_aggregate,
      ema_trend: emaScores,
      attention_state: attentionState,
      recommended_action,
      trigger_tier: tierEvaluation.tier,
      should_intervene,
      timestamp: Date.now()
    };

    // Log analysis for debugging (can be disabled in production)
    if (this.frameCount % 5 === 0) {
      this.logAnalysis(analysis);
    }

    return analysis;
  }

  /**
   * Get current internal state for debugging
   * 
   * @returns Current Kiro state
   */
  getState(): KiroState {
    return {
      currentEmotion: this.emaSmoother.getDominantEmotion(),
      emaScores: this.emaSmoother.getEMAScores(),
      emotionDurations: this.tierEvaluator.getEmotionDurations(),
      lastTriggerTimes: new Map(), // TierEvaluator doesn't expose this directly
      frameCount: this.frameCount,
      sessionStartTime: this.sessionStartTime
    };
  }

  /**
   * Reset all state (useful for new learning session)
   */
  reset(): void {
    this.windowManager.clear();
    this.emaSmoother.reset();
    this.tierEvaluator.reset();
    this.frameCount = 0;
    this.sessionStartTime = Date.now();
    console.log('🔄 Kiro Engine reset');
  }

  /**
   * Update configuration at runtime
   * 
   * @param newConfig - Partial configuration to update
   */
  configure(newConfig: Partial<KiroConfig>): void {
    // Validate configuration
    if (newConfig.ema?.alpha !== undefined) {
      if (newConfig.ema.alpha < 0 || newConfig.ema.alpha > 1) {
        throw new Error('EMA alpha must be between 0 and 1');
      }
      this.emaSmoother.setAlpha(newConfig.ema.alpha);
    }

    if (newConfig.tiers) {
      this.tierEvaluator.updateConfig(newConfig.tiers);
    }

    // Update stored config
    this.config = { ...this.config, ...newConfig };
    
    console.log('⚙️ Kiro configuration updated', newConfig);
  }

  /**
   * Get current configuration
   * 
   * @returns Current Kiro configuration
   */
  getConfig(): KiroConfig {
    return { ...this.config };
  }

  /**
   * Get session statistics
   * 
   * @returns Session statistics object
   */
  getSessionStats(): {
    duration: number;
    frameCount: number;
    avgFrameRate: number;
    emotionDurations: Map<EmotionClass, number>;
  } {
    const duration = (Date.now() - this.sessionStartTime) / 1000; // seconds
    const avgFrameRate = this.frameCount / duration;

    return {
      duration,
      frameCount: this.frameCount,
      avgFrameRate,
      emotionDurations: this.tierEvaluator.getEmotionDurations()
    };
  }

  /**
   * Check if Kiro is ready to make decisions
   * (needs at least a few frames for reliable analysis)
   * 
   * @returns true if ready, false if needs more frames
   */
  isReady(): boolean {
    return this.frameCount >= 3 && this.emaSmoother.isReady();
  }

  /**
   * Get time until next possible intervention
   * 
   * @returns Seconds until next intervention can trigger
   */
  getTimeUntilNextIntervention(): number {
    const times = [1, 2, 3, 4].map(tier => 
      this.tierEvaluator.getTimeUntilNextTrigger(tier)
    );
    return Math.min(...times);
  }

  /**
   * Log analysis for debugging
   * 
   * @param analysis - Kiro analysis to log
   */
  private logAnalysis(analysis: KiroAnalysis): void {
    const emoji = this.getEmotionEmoji(analysis.dominant_emotion);
    const confidence = (analysis.ema_trend[analysis.dominant_emotion] * 100).toFixed(1);
    
    console.log(
      `${emoji} Kiro: ${analysis.dominant_emotion} (${confidence}%) | ` +
      `Attention: ${analysis.attention_state.level} | ` +
      `Frames: ${this.frameCount}`
    );

    if (analysis.should_intervene) {
      console.log(
        `  → Intervention: Tier ${analysis.trigger_tier} - ${analysis.recommended_action}`
      );
    }
  }

  /**
   * Get emoji for emotion (for logging)
   * 
   * @param emotion - Emotion class
   * @returns Emoji string
   */
  private getEmotionEmoji(emotion: EmotionClass): string {
    const emojiMap: Record<EmotionClass, string> = {
      Focused: '🎯',
      Confused: '😕',
      Bored: '😐',
      Tired: '😴'
    };
    return emojiMap[emotion] || '❓';
  }

  /**
   * Export current state for analytics
   * 
   * @returns Serializable state object
   */
  exportState(): object {
    const stats = this.getSessionStats();
    const state = this.getState();

    return {
      session: {
        startTime: this.sessionStartTime,
        duration: stats.duration,
        frameCount: stats.frameCount,
        avgFrameRate: stats.avgFrameRate
      },
      current: {
        emotion: state.currentEmotion,
        emaScores: state.emaScores,
        emotionDurations: Object.fromEntries(state.emotionDurations)
      },
      config: this.config
    };
  }
}
