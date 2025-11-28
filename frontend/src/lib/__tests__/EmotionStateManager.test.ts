/**
 * EmotionStateManager Tests
 * Tests for sliding window, EMA smoothing, engagement classification, and action suggestions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionStateManager } from '../EmotionStateManager';
import { EmotionPrediction } from '../../config/emotionModels';

describe('EmotionStateManager', () => {
  let manager: EmotionStateManager;

  beforeEach(() => {
    manager = EmotionStateManager.getInstance();
    manager.reset();
  });

  // ============================================================================
  // Sliding Window Tests (Subtask 3.1)
  // ============================================================================

  describe('Sliding Window Buffer', () => {
    it('should add predictions to the window', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const history = manager.getPredictionHistory();

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(prediction);
    });

    it('should maintain maximum window size of 15', () => {
      // Add 20 predictions
      for (let i = 0; i < 20; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + i,
          source: 'local'
        };
        manager.addPrediction(prediction);
      }

      const history = manager.getPredictionHistory();
      expect(history).toHaveLength(15);
    });

    it('should remove oldest predictions when buffer is full', () => {
      // Add predictions with unique timestamps
      for (let i = 0; i < 20; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: 1000 + i,
          source: 'local'
        };
        manager.addPrediction(prediction);
      }

      const history = manager.getPredictionHistory();
      
      // Should have the last 15 predictions (timestamps 1005-1019)
      expect(history[0].timestamp).toBe(1005);
      expect(history[14].timestamp).toBe(1019);
    });

    it('should clear window on reset', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      expect(manager.getPredictionHistory()).toHaveLength(1);

      manager.reset();
      expect(manager.getPredictionHistory()).toHaveLength(0);
    });
  });

  // ============================================================================
  // EMA Smoothing Tests (Subtask 3.2)
  // ============================================================================

  describe('EMA Smoothing', () => {
    it('should initialize with equal probabilities (0.25 each)', () => {
      const state = manager.getCurrentState();
      
      expect(state.emotionScores.Bored).toBeCloseTo(0.25, 2);
      expect(state.emotionScores.Confused).toBeCloseTo(0.25, 2);
      expect(state.emotionScores.Focused).toBeCloseTo(0.25, 2);
      expect(state.emotionScores.Tired).toBeCloseTo(0.25, 2);
    });

    it('should apply EMA smoothing with alpha = 0.2', () => {
      // First prediction: Focused = 0.9
      const prediction1: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.0, Confused: 0.0, Focused: 0.9, Tired: 0.1 },
        confidence: 0.9,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction1);
      const state1 = manager.getCurrentState();

      // EMA formula: new_score = 0.8 * old_score + 0.2 * new_prob
      // Focused: 0.8 * 0.25 + 0.2 * 0.9 = 0.2 + 0.18 = 0.38
      expect(state1.emotionScores.Focused).toBeCloseTo(0.38, 2);
    });

    it('should smooth out noisy predictions', () => {
      // Add alternating predictions
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.0, Confused: 0.0, Focused: 1.0, Tired: 0.0 },
          confidence: 1.0,
          timestamp: Date.now(),
          source: 'local'
        },
        {
          emotion: 'Bored',
          probabilities: { Bored: 1.0, Confused: 0.0, Focused: 0.0, Tired: 0.0 },
          confidence: 1.0,
          timestamp: Date.now() + 1,
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.0, Confused: 0.0, Focused: 1.0, Tired: 0.0 },
          confidence: 1.0,
          timestamp: Date.now() + 2,
          source: 'local'
        }
      ];

      predictions.forEach(p => manager.addPrediction(p));
      const state = manager.getCurrentState();

      // Smoothed scores should be more balanced than raw predictions
      expect(state.emotionScores.Focused).toBeGreaterThan(0.3);
      expect(state.emotionScores.Focused).toBeLessThan(0.7);
    });

    it('should identify dominant emotion from smoothed scores', () => {
      // Add multiple Focused predictions
      for (let i = 0; i < 5; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + i,
          source: 'local'
        };
        manager.addPrediction(prediction);
      }

      const state = manager.getCurrentState();
      expect(state.currentEmotion).toBe('Focused');
    });
  });

  // ============================================================================
  // Engagement State Classification Tests (Subtask 3.3)
  // ============================================================================

  describe('Engagement State Classification', () => {
    it('should classify as Focused when confidence >= 0.8', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.05, Confused: 0.05, Focused: 0.85, Tired: 0.05 },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const state = manager.getCurrentState();

      expect(state.engagementState).toBe('Focused');
    });

    it('should classify as Uncertain when confidence < 0.5', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Confused',
        probabilities: { Bored: 0.3, Confused: 0.4, Focused: 0.2, Tired: 0.1 },
        confidence: 0.4,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const state = manager.getCurrentState();

      expect(state.engagementState).toBe('Uncertain');
    });

    it('should classify as Unfocused when Bored is dominant', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Bored',
        probabilities: { Bored: 0.7, Confused: 0.1, Focused: 0.1, Tired: 0.1 },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const state = manager.getCurrentState();

      expect(state.engagementState).toBe('Unfocused');
    });

    it('should classify as Unfocused when Tired is dominant', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Tired',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.1, Tired: 0.7 },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const state = manager.getCurrentState();

      expect(state.engagementState).toBe('Unfocused');
    });

    it('should detect potential confusion with consecutive confidence drops', () => {
      // Add 3 Focused predictions with decreasing confidence
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.9,
          timestamp: Date.now(),
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.75,
          timestamp: Date.now() + 1,
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.6,
          timestamp: Date.now() + 2,
          source: 'local'
        }
      ];

      predictions.forEach(p => manager.addPrediction(p));
      const state = manager.getCurrentState();

      expect(state.isPotentialConfusion).toBe(true);
    });

    it('should not flag confusion without consecutive drops', () => {
      // Add 3 Focused predictions with fluctuating confidence
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.9,
          timestamp: Date.now(),
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.95,
          timestamp: Date.now() + 1,
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.85,
          timestamp: Date.now() + 2,
          source: 'local'
        }
      ];

      predictions.forEach(p => manager.addPrediction(p));
      const state = manager.getCurrentState();

      expect(state.isPotentialConfusion).toBe(false);
    });
  });

  // ============================================================================
  // Action Suggestion Tests (Subtask 3.4)
  // ============================================================================

  describe('Action Suggestion Logic', () => {
    it('should suggest None for Focused state with high confidence', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.05, Confused: 0.05, Focused: 0.85, Tired: 0.05 },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const state = manager.getCurrentState();

      expect(state.actionSuggestion).toBe('None');
    });

    it('should suggest Simplify for persistent Confused emotion', () => {
      // Add 3 Confused predictions
      for (let i = 0; i < 3; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + i,
          source: 'local'
        };
        manager.addPrediction(prediction);
      }

      const state = manager.getCurrentState();
      expect(state.actionSuggestion).toBe('Simplify');
    });

    it('should suggest Simplify for persistent Bored emotion', () => {
      // Add 3 Bored predictions
      for (let i = 0; i < 3; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Bored',
          probabilities: { Bored: 0.7, Confused: 0.1, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + i,
          source: 'local'
        };
        manager.addPrediction(prediction);
      }

      const state = manager.getCurrentState();
      expect(state.actionSuggestion).toBe('Simplify');
    });

    it('should suggest Break for prolonged Tired emotion', () => {
      // Add 3 Tired predictions
      for (let i = 0; i < 3; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Tired',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.1, Tired: 0.7 },
          confidence: 0.7,
          timestamp: Date.now() + i,
          source: 'local'
        };
        manager.addPrediction(prediction);
      }

      const state = manager.getCurrentState();
      expect(state.actionSuggestion).toBe('Break');
    });

    it('should suggest Break for prolonged unfocused state (Bored + Tired)', () => {
      // Add mix of Bored and Tired predictions (4 out of 5)
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Bored',
          probabilities: { Bored: 0.7, Confused: 0.1, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now(),
          source: 'local'
        },
        {
          emotion: 'Tired',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.1, Tired: 0.7 },
          confidence: 0.7,
          timestamp: Date.now() + 1,
          source: 'local'
        },
        {
          emotion: 'Bored',
          probabilities: { Bored: 0.7, Confused: 0.1, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + 2,
          source: 'local'
        },
        {
          emotion: 'Tired',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.1, Tired: 0.7 },
          confidence: 0.7,
          timestamp: Date.now() + 3,
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + 4,
          source: 'local'
        }
      ];

      predictions.forEach(p => manager.addPrediction(p));
      const state = manager.getCurrentState();

      expect(state.actionSuggestion).toBe('Break');
    });

    it('should not suggest action for single negative prediction', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Confused',
        probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };

      manager.addPrediction(prediction);
      const state = manager.getCurrentState();

      // Should not suggest action with only 1 prediction
      expect(state.actionSuggestion).toBe('None');
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('Statistics', () => {
    it('should calculate emotion distribution', () => {
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now(),
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + 1,
          source: 'local'
        },
        {
          emotion: 'Bored',
          probabilities: { Bored: 0.7, Confused: 0.1, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + 2,
          source: 'local'
        },
        {
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: Date.now() + 3,
          source: 'local'
        }
      ];

      predictions.forEach(p => manager.addPrediction(p));
      const stats = manager.getStatistics();

      expect(stats.windowSize).toBe(4);
      expect(stats.emotionDistribution.Focused).toBe(50); // 2 out of 4
      expect(stats.emotionDistribution.Bored).toBe(25); // 1 out of 4
      expect(stats.emotionDistribution.Confused).toBe(25); // 1 out of 4
      expect(stats.emotionDistribution.Tired).toBe(0);
    });

    it('should calculate average confidence', () => {
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: Date.now(),
          source: 'local'
        },
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.6,
          timestamp: Date.now() + 1,
          source: 'local'
        }
      ];

      predictions.forEach(p => manager.addPrediction(p));
      const stats = manager.getStatistics();

      expect(stats.averageConfidence).toBeCloseTo(0.7, 2);
    });
  });
});
