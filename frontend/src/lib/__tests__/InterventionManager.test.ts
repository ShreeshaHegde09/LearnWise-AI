/**
 * Unit tests for InterventionManager
 * Tests Tier 1 and Tier 2 intervention logic, cooldowns, and response tracking
 */

import { InterventionManager } from '../InterventionManager';
import { EmotionPrediction, EmotionClass } from '../../config/emotionModels';
import { EmotionState } from '../EmotionStateManager';

describe('InterventionManager', () => {
  let manager: InterventionManager;

  beforeEach(() => {
    manager = InterventionManager.getInstance();
    manager.reset();
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const createPrediction = (
    emotion: EmotionClass,
    confidence: number,
    timestamp: number
  ): EmotionPrediction => ({
    emotion,
    confidence,
    timestamp,
    probabilities: {
      Bored: emotion === 'Bored' ? confidence : (1 - confidence) / 3,
      Confused: emotion === 'Confused' ? confidence : (1 - confidence) / 3,
      Focused: emotion === 'Focused' ? confidence : (1 - confidence) / 3,
      Tired: emotion === 'Tired' ? confidence : (1 - confidence) / 3
    }
  });

  const createMockState = (emotion: EmotionClass, confidence: number): EmotionState => ({
    currentEmotion: emotion,
    confidenceScore: confidence,
    engagementState: 'Uncertain',
    actionSuggestion: 'None',
    emotionScores: {
      Bored: 0.25,
      Confused: 0.25,
      Focused: 0.25,
      Tired: 0.25
    },
    isPotentialConfusion: false
  });

  // ============================================================================
  // Tier 1 Intervention Tests
  // ============================================================================

  describe('Tier 1 Intervention Detection', () => {
    test('should trigger Tier 1 for 3 consecutive Confused predictions within 1-3 minutes', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 120000), // 2 minutes ago
        createPrediction('Confused', 0.75, now - 60000),  // 1 minute ago
        createPrediction('Confused', 0.8, now)            // now
      ];

      const currentState = createMockState('Confused', 0.8);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
      expect(decision.message).toBe('Seems tough — shall I simplify this?');
      expect(decision.reason).toBe('persistent_confusion');
    });

    test('should trigger Tier 1 for 3 consecutive Bored predictions within 1-3 minutes', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Bored', 0.7, now - 150000), // 2.5 minutes ago
        createPrediction('Bored', 0.75, now - 90000), // 1.5 minutes ago
        createPrediction('Bored', 0.8, now)           // now
      ];

      const currentState = createMockState('Bored', 0.8);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
    });

    test('should trigger Tier 1 for mixed Confused/Bored predictions', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 120000),
        createPrediction('Bored', 0.75, now - 60000),
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(1);
    });

    test('should NOT trigger Tier 1 if less than 3 consecutive Confused/Bored', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 120000),
        createPrediction('Focused', 0.85, now - 60000),
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(false);
    });

    test('should NOT trigger Tier 1 if time range is less than 1 minute', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 30000), // 30 seconds ago
        createPrediction('Confused', 0.75, now - 15000), // 15 seconds ago
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(false);
    });

    test('should NOT trigger Tier 1 if time range exceeds 3 minutes', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 240000), // 4 minutes ago
        createPrediction('Confused', 0.75, now - 120000), // 2 minutes ago
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(false);
    });

    test('should respect 60-second cooldown for Tier 1', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 120000),
        createPrediction('Confused', 0.75, now - 60000),
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      
      // First intervention should trigger
      const decision1 = manager.evaluateIntervention(history, currentState);
      expect(decision1.shouldIntervene).toBe(true);
      expect(decision1.tier).toBe(1);

      // Second intervention within 60 seconds should NOT trigger
      const decision2 = manager.evaluateIntervention(history, currentState);
      expect(decision2.shouldIntervene).toBe(false);
    });
  });

  // ============================================================================
  // Tier 2 Intervention Tests
  // ============================================================================

  describe('Tier 2 Intervention Detection', () => {
    test('should trigger Tier 2 for >60% unfocused ratio over 5 minutes', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Bored', 0.7, now - 300000),    // 5 min ago
        createPrediction('Tired', 0.75, now - 240000),   // 4 min ago
        createPrediction('Bored', 0.7, now - 180000),    // 3 min ago
        createPrediction('Tired', 0.8, now - 120000),    // 2 min ago
        createPrediction('Bored', 0.75, now - 60000),    // 1 min ago
        createPrediction('Focused', 0.6, now - 30000),   // 30 sec ago
        createPrediction('Tired', 0.7, now)              // now
      ];

      const currentState = createMockState('Tired', 0.7);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
      expect(decision.message).toBe("You've been disengaged for a while — would you like a short break?");
      expect(decision.reason).toBe('prolonged_disengagement');
    });

    test('should trigger Tier 2 for repeated Tired/Bored states', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [];
      
      // Create 10 predictions with 60% Tired/Bored
      for (let i = 10; i >= 0; i--) {
        const emotion: EmotionClass = i % 5 < 3 ? 'Tired' : 'Focused';
        history.push(createPrediction(emotion, 0.7, now - (i * 30000)));
      }

      const currentState = createMockState('Tired', 0.7);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
    });

    test('should NOT trigger Tier 2 if unfocused ratio is below 60%', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Focused', 0.85, now - 300000),
        createPrediction('Focused', 0.9, now - 240000),
        createPrediction('Bored', 0.7, now - 180000),
        createPrediction('Focused', 0.85, now - 120000),
        createPrediction('Focused', 0.9, now - 60000),
        createPrediction('Tired', 0.7, now)
      ];

      const currentState = createMockState('Tired', 0.7);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(false);
    });

    test('should respect 120-second cooldown for Tier 2', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [];
      
      // Create history with >60% unfocused
      for (let i = 10; i >= 0; i--) {
        history.push(createPrediction('Tired', 0.7, now - (i * 30000)));
      }

      const currentState = createMockState('Tired', 0.7);
      
      // First intervention should trigger
      const decision1 = manager.evaluateIntervention(history, currentState);
      expect(decision1.shouldIntervene).toBe(true);
      expect(decision1.tier).toBe(2);

      // Second intervention within 120 seconds should NOT trigger
      const decision2 = manager.evaluateIntervention(history, currentState);
      expect(decision2.shouldIntervene).toBe(false);
    });

    test('should escalate from Tier 1 to Tier 2 if disengagement continues', () => {
      const now = Date.now();
      
      // First trigger Tier 1
      const tier1History: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 180000),
        createPrediction('Confused', 0.75, now - 120000),
        createPrediction('Confused', 0.8, now - 60000)
      ];
      
      const state1 = createMockState('Confused', 0.8);
      const decision1 = manager.evaluateIntervention(tier1History, state1);
      expect(decision1.tier).toBe(1);
      
      // Simulate dismissing Tier 1
      manager.recordInterventionResponse(1, false, 'Confused', 0.8);
      
      // Add more disengaged predictions after Tier 1
      const tier2History: EmotionPrediction[] = [
        ...tier1History,
        createPrediction('Bored', 0.7, now - 45000),
        createPrediction('Tired', 0.75, now - 30000),
        createPrediction('Bored', 0.7, now - 15000),
        createPrediction('Tired', 0.8, now)
      ];
      
      const state2 = createMockState('Tired', 0.8);
      const decision2 = manager.evaluateIntervention(tier2History, state2);
      
      expect(decision2.shouldIntervene).toBe(true);
      expect(decision2.tier).toBe(2);
      expect(decision2.reason).toBe('escalation_from_tier1');
    });
  });

  // ============================================================================
  // Intervention Response Tracking Tests
  // ============================================================================

  describe('Intervention Response Tracking', () => {
    test('should record accepted Tier 1 intervention', () => {
      manager.recordInterventionResponse(1, true, 'Confused', 0.8);
      
      const metrics = manager.getMetrics();
      expect(metrics.tier1Accepted).toBe(1);
      expect(metrics.tier1Dismissed).toBe(0);
      
      const history = manager.getResponseHistory();
      expect(history.length).toBe(1);
      expect(history[0].tier).toBe(1);
      expect(history[0].accepted).toBe(true);
    });

    test('should record dismissed Tier 1 intervention', () => {
      manager.recordInterventionResponse(1, false, 'Confused', 0.8);
      
      const metrics = manager.getMetrics();
      expect(metrics.tier1Accepted).toBe(0);
      expect(metrics.tier1Dismissed).toBe(1);
    });

    test('should record accepted Tier 2 intervention', () => {
      manager.recordInterventionResponse(2, true, 'Tired', 0.7);
      
      const metrics = manager.getMetrics();
      expect(metrics.tier2Accepted).toBe(1);
      expect(metrics.tier2Dismissed).toBe(0);
    });

    test('should record dismissed Tier 2 intervention', () => {
      manager.recordInterventionResponse(2, false, 'Tired', 0.7);
      
      const metrics = manager.getMetrics();
      expect(metrics.tier2Accepted).toBe(0);
      expect(metrics.tier2Dismissed).toBe(1);
    });

    test('should reset timers when intervention is accepted', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 120000),
        createPrediction('Confused', 0.75, now - 60000),
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      
      // Trigger intervention
      const decision1 = manager.evaluateIntervention(history, currentState);
      expect(decision1.shouldIntervene).toBe(true);
      
      // Accept intervention (resets timers)
      manager.recordInterventionResponse(1, true, 'Confused', 0.8);
      
      // Should be able to trigger again immediately after reset
      const decision2 = manager.evaluateIntervention(history, currentState);
      expect(decision2.shouldIntervene).toBe(true);
    });

    test('should calculate effectiveness statistics correctly', () => {
      // Record multiple interventions
      manager.recordInterventionResponse(1, true, 'Confused', 0.8);
      manager.recordInterventionResponse(1, false, 'Confused', 0.7);
      manager.recordInterventionResponse(1, true, 'Bored', 0.75);
      manager.recordInterventionResponse(2, true, 'Tired', 0.7);
      manager.recordInterventionResponse(2, false, 'Tired', 0.65);
      
      const stats = manager.getEffectivenessStats();
      
      // Tier 1: 2 accepted, 1 dismissed = 66.67% acceptance
      expect(stats.tier1AcceptanceRate).toBeCloseTo(66.67, 1);
      
      // Tier 2: 1 accepted, 1 dismissed = 50% acceptance
      expect(stats.tier2AcceptanceRate).toBe(50);
      
      // Overall: 3 accepted, 2 dismissed = 60% acceptance
      expect(stats.overallAcceptanceRate).toBe(60);
      
      expect(stats.totalInterventions).toBe(5);
    });

    test('should limit response history to 50 entries', () => {
      // Record 60 interventions
      for (let i = 0; i < 60; i++) {
        manager.recordInterventionResponse(1, i % 2 === 0, 'Confused', 0.8);
      }
      
      const history = manager.getResponseHistory();
      expect(history.length).toBe(50);
    });
  });

  // ============================================================================
  // Priority and Edge Cases
  // ============================================================================

  describe('Priority and Edge Cases', () => {
    test('should prioritize Tier 2 over Tier 1 when both conditions are met', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [];
      
      // Create history that satisfies both Tier 1 and Tier 2
      for (let i = 10; i >= 0; i--) {
        history.push(createPrediction('Confused', 0.7, now - (i * 30000)));
      }

      const currentState = createMockState('Confused', 0.7);
      const decision = manager.evaluateIntervention(history, currentState);

      // Should trigger Tier 2 (higher priority)
      expect(decision.shouldIntervene).toBe(true);
      expect(decision.tier).toBe(2);
    });

    test('should handle insufficient history gracefully', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now)
      ];

      const currentState = createMockState('Confused', 0.7);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(false);
    });

    test('should handle empty history gracefully', () => {
      const history: EmotionPrediction[] = [];
      const currentState = createMockState('Confused', 0.7);
      const decision = manager.evaluateIntervention(history, currentState);

      expect(decision.shouldIntervene).toBe(false);
    });

    test('should reset all data correctly', () => {
      const now = Date.now();
      const history: EmotionPrediction[] = [
        createPrediction('Confused', 0.7, now - 120000),
        createPrediction('Confused', 0.75, now - 60000),
        createPrediction('Confused', 0.8, now)
      ];

      const currentState = createMockState('Confused', 0.8);
      
      // Trigger intervention and record response
      manager.evaluateIntervention(history, currentState);
      manager.recordInterventionResponse(1, true, 'Confused', 0.8);
      
      // Reset
      manager.reset();
      
      // Check all data is cleared
      const metrics = manager.getMetrics();
      expect(metrics.tier1Count).toBe(0);
      expect(metrics.tier2Count).toBe(0);
      expect(metrics.tier1Accepted).toBe(0);
      expect(metrics.tier1Dismissed).toBe(0);
      
      const responseHistory = manager.getResponseHistory();
      expect(responseHistory.length).toBe(0);
      
      // Should be able to trigger again immediately
      const decision = manager.evaluateIntervention(history, currentState);
      expect(decision.shouldIntervene).toBe(true);
    });
  });
});
