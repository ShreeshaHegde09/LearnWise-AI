/**
 * EmotionAnalyticsService Tests
 * Tests for emotion analytics storage and metrics tracking
 */

import { EmotionAnalyticsService } from '../EmotionAnalyticsService';
import { EmotionPrediction, EmotionClass } from '../../config/emotionModels';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('EmotionAnalyticsService', () => {
  let service: EmotionAnalyticsService;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Get fresh instance
    service = EmotionAnalyticsService.getInstance();
  });

  afterEach(() => {
    // End session if active
    service.endSession();
  });

  // ============================================================================
  // Session Management Tests
  // ============================================================================

  describe('Session Management', () => {
    test('should start a new session', () => {
      service.startSession(testSessionId);
      
      const metrics = service.getSessionMetrics(testSessionId);
      
      expect(metrics).not.toBeNull();
      expect(metrics?.sessionId).toBe(testSessionId);
      expect(metrics?.totalPredictions).toBe(0);
    });

    test('should end a session', () => {
      service.startSession(testSessionId);
      service.endSession();
      
      const metrics = service.getSessionMetrics(testSessionId);
      
      expect(metrics).not.toBeNull();
      expect(metrics?.endTime).toBeDefined();
      expect(metrics?.totalDuration).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Prediction Storage Tests
  // ============================================================================

  describe('Prediction Storage', () => {
    beforeEach(() => {
      service.startSession(testSessionId);
    });

    test('should store emotion prediction', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: {
          Focused: 0.85,
          Confused: 0.10,
          Bored: 0.03,
          Tired: 0.02
        },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };

      service.storePrediction(prediction, 1, true, 0.95);

      const predictions = service.getSessionPredictions(testSessionId);
      
      expect(predictions.length).toBe(1);
      expect(predictions[0].emotion).toBe('Focused');
      expect(predictions[0].confidence).toBe(0.85);
      expect(predictions[0].chunkId).toBe(1);
    });

    test('should update session metrics when storing predictions', () => {
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: {
          Focused: 0.85,
          Confused: 0.10,
          Bored: 0.03,
          Tired: 0.02
        },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };

      service.storePrediction(prediction, 1);

      const metrics = service.getSessionMetrics(testSessionId);
      
      expect(metrics?.totalPredictions).toBe(1);
      expect(metrics?.emotionDistribution.Focused).toBe(1);
      expect(metrics?.averageConfidence).toBe(0.85);
    });

    test('should get recent predictions', () => {
      // Store multiple predictions
      for (let i = 0; i < 5; i++) {
        const prediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: {
            Focused: 0.85,
            Confused: 0.10,
            Bored: 0.03,
            Tired: 0.02
          },
          confidence: 0.85,
          timestamp: Date.now() + i,
          source: 'local'
        };
        service.storePrediction(prediction, 1);
      }

      const recent = service.getRecentPredictions(3);
      
      expect(recent.length).toBe(3);
      // Should be in reverse chronological order
      expect(recent[0].timestamp).toBeGreaterThan(recent[1].timestamp);
    });
  });

  // ============================================================================
  // Intervention Logging Tests
  // ============================================================================

  describe('Intervention Logging', () => {
    beforeEach(() => {
      service.startSession(testSessionId);
    });

    test('should log intervention', () => {
      const interventionId = service.logIntervention(
        1,
        'Confused',
        'Seems tough — shall I simplify this?',
        'persistent_confusion'
      );

      expect(interventionId).toBeTruthy();

      const interventions = service.getSessionInterventions(testSessionId);
      
      expect(interventions.length).toBe(1);
      expect(interventions[0].tier).toBe(1);
      expect(interventions[0].emotion).toBe('Confused');
    });

    test('should record intervention response', () => {
      const interventionId = service.logIntervention(
        1,
        'Confused',
        'Test message',
        'test_reason'
      );

      service.recordInterventionResponse(interventionId, true);

      const interventions = service.getSessionInterventions(testSessionId);
      
      expect(interventions[0].accepted).toBe(true);
      expect(interventions[0].dismissed).toBe(false);
    });

    test('should update metrics when logging interventions', () => {
      service.logIntervention(1, 'Confused', 'Test', 'test');
      service.logIntervention(2, 'Tired', 'Test', 'test');

      const metrics = service.getSessionMetrics(testSessionId);
      
      expect(metrics?.tier1Interventions).toBe(1);
      expect(metrics?.tier2Interventions).toBe(1);
    });
  });

  // ============================================================================
  // Visibility Issue Logging Tests
  // ============================================================================

  describe('Visibility Issue Logging', () => {
    beforeEach(() => {
      service.startSession(testSessionId);
    });

    test('should log visibility issue', () => {
      const issueId = service.logVisibilityIssue(
        'no_face',
        'Face not visible',
        'warning',
        3
      );

      expect(issueId).toBeTruthy();

      const issues = service.getSessionVisibilityIssues(testSessionId);
      
      expect(issues.length).toBe(1);
      expect(issues[0].type).toBe('no_face');
      expect(issues[0].consecutiveFrames).toBe(3);
    });

    test('should resolve visibility issue', () => {
      const issueId = service.logVisibilityIssue(
        'poor_lighting',
        'Poor lighting',
        'warning',
        3
      );

      service.resolveVisibilityIssue(issueId);

      const issues = service.getSessionVisibilityIssues(testSessionId);
      
      expect(issues[0].resolved).toBe(true);
      expect(issues[0].resolvedAt).toBeDefined();
    });
  });

  // ============================================================================
  // Metrics Tests
  // ============================================================================

  describe('Session Metrics', () => {
    beforeEach(() => {
      service.startSession(testSessionId);
    });

    test('should calculate emotion distribution', () => {
      // Store predictions with different emotions
      const emotions: EmotionClass[] = ['Focused', 'Focused', 'Confused', 'Bored'];
      
      emotions.forEach((emotion, i) => {
        const prediction: EmotionPrediction = {
          emotion,
          probabilities: {
            Focused: 0.5,
            Confused: 0.2,
            Bored: 0.2,
            Tired: 0.1
          },
          confidence: 0.7,
          timestamp: Date.now() + i,
          source: 'local'
        };
        service.storePrediction(prediction, 1);
      });

      const metrics = service.getSessionMetrics(testSessionId);
      
      expect(metrics?.emotionDistribution.Focused).toBe(2);
      expect(metrics?.emotionDistribution.Confused).toBe(1);
      expect(metrics?.emotionDistribution.Bored).toBe(1);
      expect(metrics?.emotionDistribution.Tired).toBe(0);
    });

    test('should calculate average confidence', () => {
      const confidences = [0.8, 0.9, 0.7];
      
      confidences.forEach((confidence, i) => {
        const prediction: EmotionPrediction = {
          emotion: 'Focused',
          probabilities: {
            Focused: confidence,
            Confused: 0.1,
            Bored: 0.05,
            Tired: 0.05
          },
          confidence,
          timestamp: Date.now() + i,
          source: 'local'
        };
        service.storePrediction(prediction, 1);
      });

      const metrics = service.getSessionMetrics(testSessionId);
      const expectedAvg = (0.8 + 0.9 + 0.7) / 3;
      
      expect(metrics?.averageConfidence).toBeCloseTo(expectedAvg, 2);
    });

    test('should record cloud recalibration', () => {
      service.recordCloudRecalibration();

      const metrics = service.getSessionMetrics(testSessionId);
      
      expect(metrics?.cloudRecalibrations).toBe(1);
    });
  });

  // ============================================================================
  // Data Management Tests
  // ============================================================================

  describe('Data Management', () => {
    test('should clear session data', () => {
      service.startSession(testSessionId);
      
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: {
          Focused: 0.85,
          Confused: 0.10,
          Bored: 0.03,
          Tired: 0.02
        },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };
      
      service.storePrediction(prediction, 1);
      service.logIntervention(1, 'Confused', 'Test', 'test');
      
      service.clearSessionData(testSessionId);

      const predictions = service.getSessionPredictions(testSessionId);
      const interventions = service.getSessionInterventions(testSessionId);
      
      expect(predictions.length).toBe(0);
      expect(interventions.length).toBe(0);
    });

    test('should export data', () => {
      service.startSession(testSessionId);
      
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: {
          Focused: 0.85,
          Confused: 0.10,
          Bored: 0.03,
          Tired: 0.02
        },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };
      
      service.storePrediction(prediction, 1);
      
      const exportedData = service.exportData();
      const parsed = JSON.parse(exportedData);
      
      expect(parsed.predictions).toBeDefined();
      expect(parsed.sessionMetrics).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
    });

    test('should get storage statistics', () => {
      service.startSession(testSessionId);
      
      const prediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: {
          Focused: 0.85,
          Confused: 0.10,
          Bored: 0.03,
          Tired: 0.02
        },
        confidence: 0.85,
        timestamp: Date.now(),
        source: 'local'
      };
      
      service.storePrediction(prediction, 1);
      service.logIntervention(1, 'Confused', 'Test', 'test');
      
      const stats = service.getStorageStats();
      
      expect(stats.predictions).toBe(1);
      expect(stats.interventions).toBe(1);
      expect(stats.sessions).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });
});
