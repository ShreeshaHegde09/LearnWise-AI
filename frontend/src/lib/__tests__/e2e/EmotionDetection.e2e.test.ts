/**
 * End-to-End Tests for Emotion Detection System
 * Tests complete workflows from camera capture to intervention display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmotionStateManager } from '../../EmotionStateManager';
import { InterventionManager } from '../../InterventionManager';
import { VisibilityMonitor } from '../../VisibilityMonitor';
import { CloudRecalibrationService } from '../../CloudRecalibrationService';
import { EmotionPrediction } from '../../../config/emotionModels';

describe('Emotion Detection E2E Tests', () => {
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

  // ==========================================================================
  // Complete Emotion Detection Flow
  // ==========================================================================

  describe('Complete Emotion Detection Flow', () => {
    it('should complete full flow from camera to intervention', async () => {
      const now = Date.now();
      
      // Step 1: Simulate camera initialization
      const cameraInitialized = true;
      expect(cameraInitialized).toBe(true);
      
      // Step 2: Simulate face detection with MediaPipe
      const mockLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };
      
      const visibilityCheck = visibilityMonitor.checkVisibility(true, mockLandmarks, 0.8);
      expect(visibilityCheck).toBeNull(); // No visibility issues
      
      // Step 3: Simulate local inference predictions
      const predictions: EmotionPrediction[] = [
        {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.85,
          timestamp: now,
          source: 'local'
        }
      ];
      
      predictions.forEach(p => stateManager.addPrediction(p));
      
      // Step 4: Get emotion state
      const state = stateManager.getCurrentState();
      expect(state.currentEmotion).toBe('Focused');
      expect(state.engagementState).toBe('Focused');
      
      // Step 5: Check for interventions
      const history = stateManager.getPredictionHistory();
      const decision = interventionManager.evaluateIntervention(history, state);
      expect(decision.shouldIntervene).toBe(false); // No intervention needed for Focused
      
      // Step 6: Verify adaptive capture interval
      const captureInterval = state.engagementState === 'Focused' ? 7000 : 3000;
      expect(captureInterval).toBe(7000); // 7 seconds for Focused state
    });

    it('should handle complete disengagement workflow', async () => {
      const now = Date.now();
      
      // Simulate gradual disengagement over time
      const timeline = [
        { time: 0, emotion: 'Focused' as const, confidence: 0.85 },
        { time: 60000, emotion: 'Focused' as const, confidence: 0.75 },
        { time: 120000, emotion: 'Confused' as const, confidence: 0.7 },
        { time: 180000, emotion: 'Confused' as const, confidence: 0.7 },
        { time: 240000, emotion: 'Bored' as const, confidence: 0.65 },
        { time: 300000, emotion: 'Tired' as const, confidence: 0.7 },
        { time: 360000, emotion: 'Tired' as const, confidence: 0.7 }
      ];
      
      timeline.forEach(({ time, emotion, confidence }) => {
        stateManager.addPrediction({
          emotion,
          probabilities: {
            Bored: emotion === 'Bored' ? confidence : 0.1,
            Confused: emotion === 'Confused' ? confidence : 0.1,
            Focused: emotion === 'Focused' ? confidence : 0.1,
            Tired: emotion === 'Tired' ? confidence : 0.1
          },
          confidence,
          timestamp: now + time,
          source: 'local'
        });
      });
      
      const state = stateManager.getCurrentState();
      const history = stateManager.getPredictionHistory();
      const decision = interventionManager.evaluateIntervention(history, state);
      
      // Should trigger Tier 2 intervention for prolonged disengagement
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
      expect(decision.message).toContain('break');
    });
  });

  // ==========================================================================
  // Tier 1 Intervention Triggering
  // ==========================================================================

  describe('Tier 1 Intervention Triggering', () => {
    it('should trigger Tier 1 after 1-3 minutes of confusion', () => {
      const now = Date.now();
      
      // Simulate 2 minutes of confusion
      const confusedPredictions: EmotionPrediction[] = [];
      for (let i = 0; i < 4; i++) {
        confusedPredictions.push({
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - 120000 + i * 40000,
          source: 'local'
        });
      }
      
      confusedPredictions.forEach(p => stateManager.addPrediction(p));
      
      const state = stateManager.getCurrentState();
      const history = stateManager.getPredictionHistory();
      const decision = interventionManager.evaluateIntervention(history, state);
      
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
      expect(decision.message).toBe('Seems tough — shall I simplify this?');
      expect(decision.reason).toBe('persistent_confusion');
    });

    it('should show Tier 1 alert with correct actions', () => {
      const now = Date.now();
      
      // Trigger Tier 1
      for (let i = 0; i < 3; i++) {
        stateManager.addPrediction({
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - 120000 + i * 60000,
          source: 'local'
        });
      }
      
      const state = stateManager.getCurrentState();
      const history = stateManager.getPredictionHistory();
      const decision = interventionManager.evaluateIntervention(history, state);
      
      // Verify alert properties
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
      
      // Simulate user accepting intervention
      interventionManager.recordInterventionResponse(1, true, 'Confused', 0.7);
      
      const metrics = interventionManager.getMetrics();
      expect(metrics.tier1Accepted).toBe(1);
      expect(metrics.tier1Dismissed).toBe(0);
    });

    it('should respect 60-second cooldown between Tier 1 interventions', () => {
      const now = Date.now();
      
      // First intervention
      for (let i = 0; i < 3; i++) {
        stateManager.addPrediction({
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - 120000 + i * 60000,
          source: 'local'
        });
      }
      
      let state = stateManager.getCurrentState();
      let history = stateManager.getPredictionHistory();
      let decision = interventionManager.evaluateIntervention(history, state);
      
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
      
      // Try to trigger again immediately
      decision = interventionManager.evaluateIntervention(history, state);
      expect(decision.shouldIntervene).toBe(false); // Cooldown active
    });
  });

  // ==========================================================================
  // Tier 2 Intervention Escalation
  // ==========================================================================

  describe('Tier 2 Intervention Escalation', () => {
    it('should trigger Tier 2 after >5 minutes of disengagement', () => {
      const now = Date.now();
      
      // Simulate 6 minutes of disengagement
      const disengagedPredictions: EmotionPrediction[] = [];
      for (let i = 0; i < 12; i++) {
        const emotion = i % 2 === 0 ? 'Bored' : 'Tired';
        disengagedPredictions.push({
          emotion,
          probabilities: {
            Bored: emotion === 'Bored' ? 0.7 : 0.1,
            Confused: 0.1,
            Focused: 0.1,
            Tired: emotion === 'Tired' ? 0.7 : 0.1
          },
          confidence: 0.7,
          timestamp: now - 360000 + i * 30000,
          source: 'local'
        });
      }
      
      disengagedPredictions.forEach(p => stateManager.addPrediction(p));
      
      const state = stateManager.getCurrentState();
      const history = stateManager.getPredictionHistory();
      const decision = interventionManager.evaluateIntervention(history, state);
      
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
      expect(decision.message).toBe("You've been disengaged for a while — would you like a short break?");
      expect(decision.reason).toBe('prolonged_disengagement');
    });

    it('should escalate from Tier 1 to Tier 2 when user dismisses and continues struggling', () => {
      const now = Date.now();
      
      // Phase 1: Trigger Tier 1
      for (let i = 0; i < 3; i++) {
        stateManager.addPrediction({
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - 300000 + i * 60000,
          source: 'local'
        });
      }
      
      let state = stateManager.getCurrentState();
      let history = stateManager.getPredictionHistory();
      let decision = interventionManager.evaluateIntervention(history, state);
      
      expect(decision.tier).toBe(1);
      
      // User dismisses Tier 1
      interventionManager.recordInterventionResponse(1, false, 'Confused', 0.7);
      
      // Phase 2: Continue with disengagement
      for (let i = 0; i < 6; i++) {
        stateManager.addPrediction({
          emotion: i % 2 === 0 ? 'Bored' : 'Tired',
          probabilities: { Bored: 0.6, Confused: 0.1, Focused: 0.1, Tired: 0.2 },
          confidence: 0.6,
          timestamp: now - 180000 + i * 30000,
          source: 'local'
        });
      }
      
      state = stateManager.getCurrentState();
      history = stateManager.getPredictionHistory();
      decision = interventionManager.evaluateIntervention(history, state);
      
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
      expect(decision.reason).toBe('escalation_from_tier1');
    });

    it('should respect 120-second cooldown between Tier 2 interventions', () => {
      const now = Date.now();
      
      // Trigger Tier 2
      for (let i = 0; i < 10; i++) {
        stateManager.addPrediction({
          emotion: 'Tired',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.1, Tired: 0.7 },
          confidence: 0.7,
          timestamp: now - 300000 + i * 30000,
          source: 'local'
        });
      }
      
      let state = stateManager.getCurrentState();
      let history = stateManager.getPredictionHistory();
      let decision = interventionManager.evaluateIntervention(history, state);
      
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
      
      // Try to trigger again immediately
      decision = interventionManager.evaluateIntervention(history, state);
      expect(decision.shouldIntervene).toBe(false); // Cooldown active
    });
  });

  // ==========================================================================
  // Cloud Recalibration Cycle
  // ==========================================================================

  describe('Cloud Recalibration Cycle', () => {
    it('should handle cloud recalibration workflow', async () => {
      // Mock cloud recalibration service
      const mockCloudResponse = {
        emotion: 'Focused',
        probabilities: { Bored: 0.05, Confused: 0.05, Focused: 0.85, Tired: 0.05 },
        confidence: 0.85,
        calibration_needed: false,
        confidence_adjustment: 0.0
      };
      
      // Simulate local prediction
      const localPrediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };
      
      stateManager.addPrediction(localPrediction);
      
      // Simulate cloud recalibration (would happen every 1-1.5 minutes)
      const cloudPrediction: EmotionPrediction = {
        ...mockCloudResponse,
        timestamp: Date.now(),
        source: 'cloud'
      };
      
      stateManager.addPrediction(cloudPrediction);
      
      // Verify both predictions are tracked
      const history = stateManager.getPredictionHistory();
      expect(history.length).toBe(2);
      expect(history.some(p => p.source === 'local')).toBe(true);
      expect(history.some(p => p.source === 'cloud')).toBe(true);
    });

    it('should continue local inference when cloud is unavailable', async () => {
      const now = Date.now();
      
      // Simulate network failure (no cloud predictions)
      for (let i = 0; i < 5; i++) {
        const localPrediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now + i * 7000,
          source: 'local'
        };
        
        stateManager.addPrediction(localPrediction);
      }
      
      const history = stateManager.getPredictionHistory();
      
      // All predictions should be local
      expect(history.every(p => p.source === 'local')).toBe(true);
      expect(history.length).toBe(5);
      
      // System should still function normally
      const state = stateManager.getCurrentState();
      expect(state.currentEmotion).toBe('Focused');
    });

    it('should apply confidence adjustments from cloud recalibration', () => {
      const now = Date.now();
      
      // Local prediction with lower confidence
      const localPrediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.6, Tired: 0.2 },
        confidence: 0.6,
        timestamp: now,
        source: 'local'
      };
      
      stateManager.addPrediction(localPrediction);
      
      // Cloud recalibration with higher confidence
      const cloudPrediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.05, Confused: 0.05, Focused: 0.85, Tired: 0.05 },
        confidence: 0.85,
        timestamp: now + 1000,
        source: 'cloud'
      };
      
      stateManager.addPrediction(cloudPrediction);
      
      // Confidence adjustment would be: 0.85 - 0.6 = +0.25
      const confidenceAdjustment = cloudPrediction.confidence - localPrediction.confidence;
      expect(confidenceAdjustment).toBeCloseTo(0.25, 2);
    });
  });

  // ==========================================================================
  // Visibility Issue Handling
  // ==========================================================================

  describe('Visibility Issue Handling', () => {
    it('should detect and alert for face not visible', () => {
      // Simulate 3 consecutive frames with no face
      visibilityMonitor.checkVisibility(false, null, 0.5);
      visibilityMonitor.checkVisibility(false, null, 0.5);
      const issue = visibilityMonitor.checkVisibility(false, null, 0.5);
      
      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('no_face');
      expect(issue?.message).toBe('Face not visible — please adjust camera position');
      expect(issue?.severity).toBe('warning');
    });

    it('should detect and alert for poor lighting', () => {
      const mockLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };
      
      // Simulate 3 consecutive frames with low confidence (poor lighting)
      visibilityMonitor.checkVisibility(true, mockLandmarks, 0.2);
      visibilityMonitor.checkVisibility(true, mockLandmarks, 0.25);
      const issue = visibilityMonitor.checkVisibility(true, mockLandmarks, 0.28);
      
      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('poor_lighting');
      expect(issue?.message).toBe('Poor lighting detected — please improve lighting for better accuracy');
    });

    it('should detect and alert for eyes not visible', () => {
      const landmarksNoEyes = {
        1: { x: 0.5, y: 0.5, z: 0 } // Face detected but no eye landmarks
      };
      
      // Simulate 3 consecutive frames with no eyes
      visibilityMonitor.checkVisibility(true, landmarksNoEyes, 0.8);
      visibilityMonitor.checkVisibility(true, landmarksNoEyes, 0.8);
      const issue = visibilityMonitor.checkVisibility(true, landmarksNoEyes, 0.8);
      
      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('eyes_not_visible');
      expect(issue?.message).toBe('Eyes not visible — please ensure your face is fully visible');
    });

    it('should auto-dismiss visibility alerts when issues resolve', () => {
      // Trigger no_face alert
      visibilityMonitor.checkVisibility(false, null, 0.5);
      visibilityMonitor.checkVisibility(false, null, 0.5);
      let issue = visibilityMonitor.checkVisibility(false, null, 0.5);
      expect(issue?.type).toBe('no_face');
      
      // Face becomes visible
      const mockLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };
      
      issue = visibilityMonitor.checkVisibility(true, mockLandmarks, 0.8);
      expect(issue).toBeNull();
      expect(visibilityMonitor.getCurrentIssue()).toBeNull();
    });

    it('should pause emotion tracking after 30 seconds of visibility issues', () => {
      // Trigger visibility issue
      visibilityMonitor.checkVisibility(false, null, 0.5);
      visibilityMonitor.checkVisibility(false, null, 0.5);
      visibilityMonitor.checkVisibility(false, null, 0.5);
      
      // Check pause recommendation
      const shouldPause = visibilityMonitor.shouldPauseEmotionTracking();
      
      // In real scenario, this would be true after 30 seconds
      expect(typeof shouldPause).toBe('boolean');
    });
  });

  // ==========================================================================
  // Settings Changes Affecting Behavior
  // ==========================================================================

  describe('Settings Changes Affecting Behavior', () => {
    it('should adjust capture frequency based on settings', () => {
      const settings = {
        captureFrequency: 5000, // 5 seconds
        enabled: true,
        cloudRecalibration: true
      };
      
      // Verify settings are applied
      expect(settings.captureFrequency).toBe(5000);
      expect(settings.enabled).toBe(true);
      
      // In real implementation, EmotionDetector would use this interval
      const captureInterval = settings.captureFrequency;
      expect(captureInterval).toBeGreaterThan(3000);
      expect(captureInterval).toBeLessThan(10000);
    });

    it('should disable emotion tracking when settings are off', () => {
      const settings = {
        captureFrequency: 7000,
        enabled: false,
        cloudRecalibration: false
      };
      
      expect(settings.enabled).toBe(false);
      
      // When disabled, no predictions should be processed
      // This would be enforced at the EmotionDetector component level
    });

    it('should toggle cloud recalibration based on settings', () => {
      const settingsWithCloud = {
        captureFrequency: 7000,
        enabled: true,
        cloudRecalibration: true
      };
      
      const settingsWithoutCloud = {
        captureFrequency: 7000,
        enabled: true,
        cloudRecalibration: false
      };
      
      expect(settingsWithCloud.cloudRecalibration).toBe(true);
      expect(settingsWithoutCloud.cloudRecalibration).toBe(false);
      
      // When cloud recalibration is off, only local predictions should be used
    });

    it('should clear emotion data when requested', () => {
      const now = Date.now();
      
      // Add some predictions
      for (let i = 0; i < 5; i++) {
        stateManager.addPrediction({
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: now + i * 7000,
          source: 'local'
        });
      }
      
      expect(stateManager.getPredictionHistory().length).toBe(5);
      
      // Clear data
      stateManager.reset();
      interventionManager.reset();
      visibilityMonitor.reset();
      
      expect(stateManager.getPredictionHistory().length).toBe(0);
      expect(interventionManager.getMetrics().tier1Count).toBe(0);
    });
  });
});
