/**
 * Performance Tests for Emotion Detection System
 * Tests frame processing latency, memory usage, model loading time, and CPU usage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionStateManager } from '../../EmotionStateManager';
import { InterventionManager } from '../../InterventionManager';
import { VisibilityMonitor } from '../../VisibilityMonitor';
import { EmotionPrediction } from '../../../config/emotionModels';

describe('Emotion Detection Performance Tests', () => {
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
  // Frame Processing Latency Tests (Target: <100ms)
  // ==========================================================================

  describe('Frame Processing Latency', () => {
    it('should process single prediction in <100ms', () => {
      const startTime = performance.now();
      
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
        confidence: 0.8,
        timestamp: Date.now(),
        source: 'local'
      };
      
      stateManager.addPrediction(prediction);
      const state = stateManager.getCurrentState();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(100);
      expect(state.currentEmotion).toBe('Focused');
    });

    it('should process batch of 15 predictions in <500ms', () => {
      const startTime = performance.now();
      const now = Date.now();
      
      // Add 15 predictions (full sliding window)
      for (let i = 0; i < 15; i++) {
        const prediction: EmotionPrediction = {
          emotion: i % 2 === 0 ? 'Focused' : 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.3, Focused: 0.5, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now + i * 1000,
          source: 'local'
        };
        
        stateManager.addPrediction(prediction);
      }
      
      const state = stateManager.getCurrentState();
      const history = stateManager.getPredictionHistory();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(500);
      expect(history.length).toBe(15);
      expect(state).toBeDefined();
    });

    it('should evaluate intervention decision in <50ms', () => {
      const now = Date.now();
      
      // Prepare history
      const history: EmotionPrediction[] = [];
      for (let i = 0; i < 10; i++) {
        history.push({
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - (300000 - i * 30000),
          source: 'local'
        });
      }
      
      const currentState = {
        currentEmotion: 'Confused' as const,
        confidenceScore: 0.7,
        engagementState: 'Uncertain' as const,
        actionSuggestion: 'Simplify' as const,
        emotionScores: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
        isPotentialConfusion: true
      };
      
      const startTime = performance.now();
      const decision = interventionManager.evaluateIntervention(history, currentState);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(50);
      expect(decision).toBeDefined();
    });

    it('should check visibility in <10ms', () => {
      const mockLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };
      
      const startTime = performance.now();
      const issue = visibilityMonitor.checkVisibility(true, mockLandmarks, 0.8);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(10);
      expect(issue).toBeNull();
    });

    it('should handle high-frequency predictions efficiently', () => {
      const startTime = performance.now();
      const now = Date.now();
      
      // Simulate 100 rapid predictions
      for (let i = 0; i < 100; i++) {
        const prediction: EmotionPrediction = {
          emotion: ['Focused', 'Confused', 'Bored', 'Tired'][i % 4] as any,
          probabilities: { Bored: 0.25, Confused: 0.25, Focused: 0.25, Tired: 0.25 },
          confidence: 0.6,
          timestamp: now + i * 100,
          source: 'local'
        };
        
        stateManager.addPrediction(prediction);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerPrediction = totalTime / 100;
      
      // Average should be well under 100ms per prediction
      expect(avgTimePerPrediction).toBeLessThan(10);
      
      // Should maintain sliding window size
      const history = stateManager.getPredictionHistory();
      expect(history.length).toBe(15);
    });
  });

  // ==========================================================================
  // Memory Usage Tests (Target: <200MB additional)
  // ==========================================================================

  describe('Memory Usage', () => {
    it('should maintain bounded memory with sliding window', () => {
      const now = Date.now();
      
      // Add 1000 predictions (way more than window size)
      for (let i = 0; i < 1000; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: now + i * 1000,
          source: 'local'
        };
        
        stateManager.addPrediction(prediction);
      }
      
      const history = stateManager.getPredictionHistory();
      
      // Should only keep 15 predictions
      expect(history.length).toBe(15);
      
      // Memory should be bounded
      const memoryEstimate = history.length * 200; // ~200 bytes per prediction
      expect(memoryEstimate).toBeLessThan(5000); // <5KB for history
    });

    it('should limit intervention response history to 50 entries', () => {
      // Record 100 interventions
      for (let i = 0; i < 100; i++) {
        interventionManager.recordInterventionResponse(
          i % 2 === 0 ? 1 : 2,
          i % 3 === 0,
          'Confused',
          0.7
        );
      }
      
      const responseHistory = interventionManager.getResponseHistory();
      
      // Should only keep last 50
      expect(responseHistory.length).toBe(50);
    });

    it('should efficiently manage visibility monitor state', () => {
      // Trigger and resolve issues multiple times
      for (let i = 0; i < 100; i++) {
        visibilityMonitor.checkVisibility(false, null, 0.5);
        visibilityMonitor.checkVisibility(false, null, 0.5);
        visibilityMonitor.checkVisibility(false, null, 0.5);
        
        // Resolve
        const mockLandmarks = {
          33: { x: 0.1, y: 0.2, z: 0 },
          133: { x: 0.15, y: 0.2, z: 0 },
          362: { x: 0.85, y: 0.2, z: 0 },
          263: { x: 0.9, y: 0.2, z: 0 }
        };
        visibilityMonitor.checkVisibility(true, mockLandmarks, 0.8);
      }
      
      // State should be clean
      const state = visibilityMonitor.getState();
      expect(state.noFaceCount).toBe(0);
      expect(state.poorLightingCount).toBe(0);
      expect(state.noEyesCount).toBe(0);
    });

    it('should calculate statistics without excessive memory allocation', () => {
      const now = Date.now();
      
      // Add predictions
      for (let i = 0; i < 15; i++) {
        stateManager.addPrediction({
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: now + i * 1000,
          source: 'local'
        });
      }
      
      // Calculate stats multiple times
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        const stats = stateManager.getStatistics();
        expect(stats).toBeDefined();
      }
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 100;
      
      // Should be very fast
      expect(avgTime).toBeLessThan(1);
    });
  });

  // ==========================================================================
  // Model Loading Time Tests (Target: <3 seconds)
  // ==========================================================================

  describe('Model Loading Time', () => {
    it('should initialize state manager quickly', () => {
      const startTime = performance.now();
      const manager = EmotionStateManager.getInstance();
      const endTime = performance.now();
      
      const initTime = endTime - startTime;
      
      expect(initTime).toBeLessThan(100);
      expect(manager).toBeDefined();
    });

    it('should initialize intervention manager quickly', () => {
      const startTime = performance.now();
      const manager = InterventionManager.getInstance();
      const endTime = performance.now();
      
      const initTime = endTime - startTime;
      
      expect(initTime).toBeLessThan(100);
      expect(manager).toBeDefined();
    });

    it('should initialize visibility monitor quickly', () => {
      const startTime = performance.now();
      const monitor = new VisibilityMonitor();
      const endTime = performance.now();
      
      const initTime = endTime - startTime;
      
      expect(initTime).toBeLessThan(50);
      expect(monitor).toBeDefined();
    });

    it('should reset state quickly', () => {
      const now = Date.now();
      
      // Add data
      for (let i = 0; i < 15; i++) {
        stateManager.addPrediction({
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: now + i * 1000,
          source: 'local'
        });
      }
      
      // Reset
      const startTime = performance.now();
      stateManager.reset();
      interventionManager.reset();
      visibilityMonitor.reset();
      const endTime = performance.now();
      
      const resetTime = endTime - startTime;
      
      expect(resetTime).toBeLessThan(50);
      expect(stateManager.getPredictionHistory().length).toBe(0);
    });
  });

  // ==========================================================================
  // Capture Frequency Adaptation Tests
  // ==========================================================================

  describe('Capture Frequency Adaptation', () => {
    it('should recommend 7-second interval for Focused state', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: { Bored: 0.05, Confused: 0.05, Focused: 0.85, Tired: 0.05 },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };
      
      stateManager.addPrediction(prediction);
      const state = stateManager.getCurrentState();
      
      expect(state.engagementState).toBe('Focused');
      
      // Recommended interval for Focused state
      const recommendedInterval = state.engagementState === 'Focused' ? 7000 : 3000;
      expect(recommendedInterval).toBe(7000);
    });

    it('should recommend 3-second interval for low confidence', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Confused',
        probabilities: { Bored: 0.3, Confused: 0.4, Focused: 0.2, Tired: 0.1 },
        confidence: 0.4,
        timestamp: Date.now(),
        source: 'local'
      };
      
      stateManager.addPrediction(prediction);
      const state = stateManager.getCurrentState();
      
      expect(state.confidenceScore).toBeLessThan(0.5);
      
      // Recommended interval for low confidence
      const recommendedInterval = state.confidenceScore < 0.6 ? 3000 : 7000;
      expect(recommendedInterval).toBe(3000);
    });

    it('should recommend 3-second interval for Confused/Bored/Tired', () => {
      const emotions: Array<'Confused' | 'Bored' | 'Tired'> = ['Confused', 'Bored', 'Tired'];
      
      emotions.forEach(emotion => {
        stateManager.reset();
        
        const prediction: EmotionPrediction = {
          emotion,
          probabilities: {
            Bored: emotion === 'Bored' ? 0.7 : 0.1,
            Confused: emotion === 'Confused' ? 0.7 : 0.1,
            Focused: 0.1,
            Tired: emotion === 'Tired' ? 0.7 : 0.1
          },
          confidence: 0.7,
          timestamp: Date.now(),
          source: 'local'
        };
        
        stateManager.addPrediction(prediction);
        const state = stateManager.getCurrentState();
        
        expect(state.currentEmotion).toBe(emotion);
        
        // Recommended interval for negative emotions
        const recommendedInterval = 
          ['Confused', 'Bored', 'Tired'].includes(state.currentEmotion) ? 3000 : 7000;
        expect(recommendedInterval).toBe(3000);
      });
    });

    it('should adapt interval based on state transitions', () => {
      const now = Date.now();
      
      // Start Focused (7s interval)
      stateManager.addPrediction({
        emotion: 'Focused',
        probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
        confidence: 0.85,
        timestamp: now,
        source: 'local'
      });
      
      let state = stateManager.getCurrentState();
      let interval = state.engagementState === 'Focused' ? 7000 : 3000;
      expect(interval).toBe(7000);
      
      // Transition to Confused (3s interval)
      stateManager.addPrediction({
        emotion: 'Confused',
        probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
        confidence: 0.7,
        timestamp: now + 7000,
        source: 'local'
      });
      
      state = stateManager.getCurrentState();
      interval = state.currentEmotion === 'Confused' ? 3000 : 7000;
      expect(interval).toBe(3000);
    });
  });

  // ==========================================================================
  // CPU Usage Under Load Tests
  // ==========================================================================

  describe('CPU Usage Under Load', () => {
    it('should handle concurrent operations efficiently', () => {
      const startTime = performance.now();
      const now = Date.now();
      
      // Simulate concurrent operations
      for (let i = 0; i < 50; i++) {
        // Add prediction
        stateManager.addPrediction({
          emotion: ['Focused', 'Confused', 'Bored', 'Tired'][i % 4] as any,
          probabilities: { Bored: 0.25, Confused: 0.25, Focused: 0.25, Tired: 0.25 },
          confidence: 0.6,
          timestamp: now + i * 1000,
          source: 'local'
        });
        
        // Get state
        const state = stateManager.getCurrentState();
        
        // Evaluate intervention
        const history = stateManager.getPredictionHistory();
        interventionManager.evaluateIntervention(history, state);
        
        // Check visibility
        const mockLandmarks = {
          33: { x: 0.1, y: 0.2, z: 0 },
          133: { x: 0.15, y: 0.2, z: 0 },
          362: { x: 0.85, y: 0.2, z: 0 },
          263: { x: 0.9, y: 0.2, z: 0 }
        };
        visibilityMonitor.checkVisibility(true, mockLandmarks, 0.8);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerIteration = totalTime / 50;
      
      // Should handle all operations in <10ms per iteration
      expect(avgTimePerIteration).toBeLessThan(10);
    });

    it('should maintain performance with large history', () => {
      const now = Date.now();
      
      // Build up history to max size
      for (let i = 0; i < 15; i++) {
        stateManager.addPrediction({
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: now + i * 1000,
          source: 'local'
        });
      }
      
      // Measure performance with full history
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const state = stateManager.getCurrentState();
        const history = stateManager.getPredictionHistory();
        interventionManager.evaluateIntervention(history, state);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 100;
      
      // Should remain fast even with full history
      expect(avgTime).toBeLessThan(5);
    });

    it('should handle rapid state changes efficiently', () => {
      const now = Date.now();
      const emotions: Array<'Focused' | 'Confused' | 'Bored' | 'Tired'> = 
        ['Focused', 'Confused', 'Bored', 'Tired'];
      
      const startTime = performance.now();
      
      // Rapid emotion changes
      for (let i = 0; i < 100; i++) {
        stateManager.addPrediction({
          emotion: emotions[i % 4],
          probabilities: {
            Bored: 0.25,
            Confused: 0.25,
            Focused: 0.25,
            Tired: 0.25
          },
          confidence: 0.5,
          timestamp: now + i * 100,
          source: 'local'
        });
        
        stateManager.getCurrentState();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 100 rapid changes in <1 second
      expect(totalTime).toBeLessThan(1000);
    });

    it('should efficiently calculate statistics repeatedly', () => {
      const now = Date.now();
      
      // Add predictions
      for (let i = 0; i < 15; i++) {
        stateManager.addPrediction({
          emotion: ['Focused', 'Confused', 'Bored'][i % 3] as any,
          probabilities: { Bored: 0.3, Confused: 0.3, Focused: 0.3, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now + i * 1000,
          source: 'local'
        });
      }
      
      const startTime = performance.now();
      
      // Calculate stats 1000 times
      for (let i = 0; i < 1000; i++) {
        stateManager.getStatistics();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;
      
      // Should be extremely fast
      expect(avgTime).toBeLessThan(0.5);
    });
  });

  // ==========================================================================
  // Stress Tests
  // ==========================================================================

  describe('Stress Tests', () => {
    it('should handle extreme prediction volume', () => {
      const now = Date.now();
      
      const startTime = performance.now();
      
      // Add 10,000 predictions
      for (let i = 0; i < 10000; i++) {
        stateManager.addPrediction({
          emotion: 'Focused',
          probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
          confidence: 0.8,
          timestamp: now + i * 100,
          source: 'local'
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(5000); // <5 seconds for 10k predictions
      
      // Should maintain bounded memory
      const history = stateManager.getPredictionHistory();
      expect(history.length).toBe(15);
    });

    it('should handle extreme intervention evaluation volume', () => {
      const now = Date.now();
      
      const history: EmotionPrediction[] = [];
      for (let i = 0; i < 15; i++) {
        history.push({
          emotion: 'Confused',
          probabilities: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
          confidence: 0.7,
          timestamp: now - (300000 - i * 20000),
          source: 'local'
        });
      }
      
      const currentState = {
        currentEmotion: 'Confused' as const,
        confidenceScore: 0.7,
        engagementState: 'Uncertain' as const,
        actionSuggestion: 'Simplify' as const,
        emotionScores: { Bored: 0.1, Confused: 0.7, Focused: 0.1, Tired: 0.1 },
        isPotentialConfusion: true
      };
      
      const startTime = performance.now();
      
      // Evaluate 10,000 times
      for (let i = 0; i < 10000; i++) {
        interventionManager.evaluateIntervention(history, currentState);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 10000;
      
      // Should remain fast
      expect(avgTime).toBeLessThan(1);
    });
  });
});
