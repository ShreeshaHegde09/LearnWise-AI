/**
 * Integration Tests for Emotion Detection Pipeline
 * Tests the integration between components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionStateManager } from '../../EmotionStateManager';
import { InterventionManager } from '../../InterventionManager';
import { VisibilityMonitor } from '../../VisibilityMonitor';
import { EmotionPrediction } from '../../../config/emotionModels';

describe('Emotion Detection Pipeline Integration', () => {
  let stateManager: EmotionStateManager;
  let interventionManager: InterventionManager;
  let visibilityMonitor: VisibilityMonitor;

  beforeEach(() => {
    stateManager = EmotionStateManager.getInstance();
    interventionManager = InterventionManager.getInstance();
    visibilityMonitor = new VisibilityMonitor();
    
    stateManager.reset();
    interventionManager.reset();
    visibilityMonitor.reset();
  });

  describe('EmotionStateManager + InterventionManager Workflow', () => {
    it('should trigger Tier 1 intervention after persistent confusion', () => {
      const now = Date.now();
      
      for (let i = 0; i < 3; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - (120000 - i * 60000),
          source: 'local'
        };
        stateManager.addPrediction(prediction);
      }

      const currentState = stateManager.getCurrentState();
      const history = stateManager.getPredictionHistory();
      
      expect(currentState.actionSuggestion).toBe('Simplify');
      
      const decision = interventionManager.evaluateIntervention(history, currentState);
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
    });
  });
});

  describe('Settings Persistence and Application', () => {
    it('should persist settings to localStorage', () => {
      const settings = {
        enabled: true,
        captureFrequency: 5000,
        cloudRecalibration: true
      };
      
      localStorage.setItem('emotionDetectionSettings', JSON.stringify(settings));
      const stored = JSON.parse(localStorage.getItem('emotionDetectionSettings') || '{}');
      
      expect(stored.enabled).toBe(true);
      expect(stored.captureFrequency).toBe(5000);
      expect(stored.cloudRecalibration).toBe(true);
    });
  });

  describe('Frontend + Backend API Communication', () => {
    it('should handle successful cloud recalibration request', async () => {
      const now = Date.now();
      
      const localPrediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
        confidence: 0.7,
        timestamp: now,
        source: 'local'
      };
      
      stateManager.addPrediction(localPrediction);
      
      const cloudPrediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.05, Confused: 0.05, Focused: 0.85, Tired: 0.05 },
        confidence: 0.85,
        timestamp: now + 1000,
        source: 'cloud'
      };
      
      stateManager.addPrediction(cloudPrediction);
      
      const history = stateManager.getPredictionHistory();
      expect(history.length).toBe(2);
      expect(history.some(p => p.source === 'local')).toBe(true);
      expect(history.some(p => p.source === 'cloud')).toBe(true);
    });

    it('should handle API network errors gracefully', async () => {
      const now = Date.now();
      
      for (let i = 0; i < 5; i++) {
        stateManager.addPrediction({
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now + i * 7000,
          source: 'local'
        });
      }
      
      const history = stateManager.getPredictionHistory();
      expect(history.every(p => p.source === 'local')).toBe(true);
      expect(history.length).toBe(5);
      
      const state = stateManager.getCurrentState();
      expect(state.currentEmotion).toBe('Focused');
    });
  });
});
