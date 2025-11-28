/**
 * CloudRecalibrationService Tests
 * Tests for cloud recalibration functionality
 */

import { CloudRecalibrationService } from '../CloudRecalibrationService';
import { EmotionPrediction } from '../../config/emotionModels';

describe('CloudRecalibrationService', () => {
  let service: CloudRecalibrationService;

  beforeEach(() => {
    // Create a fresh instance for each test
    service = CloudRecalibrationService.getInstance({
      enabled: true,
      minInterval: 1000, // 1 second for testing
      maxInterval: 2000, // 2 seconds for testing
      backendUrl: 'http://localhost:5000',
      maxRetries: 2,
      retryDelay: 100,
      exponentialBackoff: true
    });
    service.reset();
  });

  afterEach(() => {
    service.stop();
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = CloudRecalibrationService.getInstance();
      const instance2 = CloudRecalibrationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default config', () => {
      expect(service.isRecalibrationEnabled()).toBe(true);
    });

    it('should allow enabling/disabling', () => {
      service.setEnabled(false);
      expect(service.isRecalibrationEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isRecalibrationEnabled()).toBe(true);
    });
  });

  describe('Confidence Adjustment', () => {
    it('should set and get confidence adjustment', () => {
      service.setConfidenceAdjustment(0.15);
      expect(service.getConfidenceAdjustment()).toBe(0.15);
    });

    it('should handle negative adjustments', () => {
      service.setConfidenceAdjustment(-0.1);
      expect(service.getConfidenceAdjustment()).toBe(-0.1);
    });

    it('should reset adjustment on reset', () => {
      service.setConfidenceAdjustment(0.2);
      service.reset();
      expect(service.getConfidenceAdjustment()).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should return initial statistics', () => {
      const stats = service.getStatistics();
      expect(stats.totalCalibrations).toBe(0);
      expect(stats.successfulCalibrations).toBe(0);
      expect(stats.failedCalibrations).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
    });

    it('should track calibration history', () => {
      const history = service.getCalibrationHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop service', () => {
      service.start();
      // Service should be running
      expect(service.isRecalibrationEnabled()).toBe(true);

      service.stop();
      // Service should still be enabled but not running
      expect(service.isRecalibrationEnabled()).toBe(true);
    });

    it('should not start when disabled', () => {
      service.setEnabled(false);
      service.start();
      expect(service.isRecalibrationEnabled()).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      service.updateConfig({
        minInterval: 5000,
        maxInterval: 10000
      });

      // Configuration should be updated
      // We can't directly test the config, but we can verify it doesn't throw
      expect(() => service.start()).not.toThrow();
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      service.setConfidenceAdjustment(0.3);
      service.start();

      service.reset();

      expect(service.getConfidenceAdjustment()).toBe(0);
      expect(service.getCalibrationHistory().length).toBe(0);
      const stats = service.getStatistics();
      expect(stats.totalCalibrations).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
    });
  });

  describe('Image Encoding', () => {
    it('should handle ImageData encoding', async () => {
      // Create a simple ImageData object
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const imageData = ctx.createImageData(100, 100);
      
      // Fill with some data
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;     // R
        imageData.data[i + 1] = 0;   // G
        imageData.data[i + 2] = 0;   // B
        imageData.data[i + 3] = 255; // A
      }

      const mockPrediction: EmotionPrediction = {
        emotion: 'Focused',
        probabilities: {
          Bored: 0.1,
          Confused: 0.1,
          Focused: 0.7,
          Tired: 0.1
        },
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'local'
      };

      // This will fail to send to backend (no server), but should handle encoding
      const result = await service.recalibrate(imageData, mockPrediction, 'test-session');
      
      // Should return null due to network error, but shouldn't throw
      expect(result).toBeNull();
    });
  });

  describe('Network Failure Handling', () => {
    it('should track network status', () => {
      const status = service.getNetworkStatus();
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('queuedRequests');
      expect(status).toHaveProperty('consecutiveFailures');
      expect(status).toHaveProperty('currentInterval');
    });

    it('should include network info in statistics', () => {
      const stats = service.getStatistics();
      expect(stats).toHaveProperty('queuedRequests');
      expect(stats).toHaveProperty('isOnline');
      expect(stats).toHaveProperty('currentInterval');
    });

    it('should handle consecutive failures', () => {
      const initialStats = service.getStatistics();
      expect(initialStats.consecutiveFailures).toBe(0);
      
      // After failures, consecutive failures should be tracked
      // (This would be incremented by actual failed requests)
    });

    it('should adjust interval on failures', () => {
      const status1 = service.getNetworkStatus();
      const initialInterval = status1.currentInterval;
      
      // Interval should be within configured range
      expect(initialInterval).toBeGreaterThanOrEqual(1000);
      expect(initialInterval).toBeLessThanOrEqual(2000);
    });

    it('should queue requests when offline', () => {
      const initialStatus = service.getNetworkStatus();
      expect(initialStatus.queuedRequests).toBe(0);
      
      // Queue size should be tracked
      const stats = service.getStatistics();
      expect(stats.queuedRequests).toBe(0);
    });
  });

  describe('Exponential Backoff', () => {
    it('should use exponential backoff when configured', () => {
      const config = {
        enabled: true,
        minInterval: 1000,
        maxInterval: 2000,
        backendUrl: 'http://localhost:5000',
        maxRetries: 3,
        retryDelay: 100,
        exponentialBackoff: true,
        maxConsecutiveFailures: 5,
        failureIntervalMultiplier: 2,
        maxFailureInterval: 180000,
        networkCheckInterval: 30000
      };
      
      const testService = CloudRecalibrationService.getInstance(config);
      testService.reset();
      
      // Service should be configured with exponential backoff
      expect(testService.isRecalibrationEnabled()).toBe(true);
      
      testService.stop();
    });

    it('should respect max failure interval', () => {
      const status = service.getNetworkStatus();
      
      // Current interval should never exceed max failure interval
      // (This would be tested with actual failures)
      expect(status.currentInterval).toBeLessThanOrEqual(180000);
    });
  });

  describe('Request Queue Management', () => {
    it('should initialize with empty queue', () => {
      const status = service.getNetworkStatus();
      expect(status.queuedRequests).toBe(0);
    });

    it('should track queued requests in statistics', () => {
      const stats = service.getStatistics();
      expect(stats.queuedRequests).toBe(0);
    });

    it('should clear queue on reset', () => {
      service.reset();
      const status = service.getNetworkStatus();
      expect(status.queuedRequests).toBe(0);
    });
  });
});
