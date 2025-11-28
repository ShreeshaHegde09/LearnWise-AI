/**
 * Unit tests for VisibilityMonitor
 * Tests face detection monitoring, lighting quality detection, and eye visibility checking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VisibilityMonitor, FaceLandmarks, VisibilityIssue } from '../VisibilityMonitor';

describe('VisibilityMonitor', () => {
  let monitor: VisibilityMonitor;

  beforeEach(() => {
    monitor = new VisibilityMonitor();
  });

  // ==========================================================================
  // Subtask 5.1: Face Detection Monitoring Tests
  // ==========================================================================

  describe('Face Detection Monitoring', () => {
    it('should not trigger alert for 1-2 consecutive face detection failures', () => {
      // First failure
      let issue = monitor.checkVisibility(false, null, 0.5);
      expect(issue).toBeNull();

      // Second failure
      issue = monitor.checkVisibility(false, null, 0.5);
      expect(issue).toBeNull();
    });

    it('should trigger alert after 3 consecutive face detection failures', () => {
      // First two failures - no alert
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      // Third failure - should trigger alert
      const issue = monitor.checkVisibility(false, null, 0.5);
      
      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('no_face');
      expect(issue?.message).toBe('Face not visible — please adjust camera position');
      expect(issue?.severity).toBe('warning');
      expect(issue?.consecutiveFrames).toBe(3);
    });

    it('should continue reporting no_face issue for subsequent failures', () => {
      // Trigger initial alert
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      // Fourth and fifth failures should still report issue
      let issue = monitor.checkVisibility(false, null, 0.5);
      expect(issue?.type).toBe('no_face');
      expect(issue?.consecutiveFrames).toBe(4);

      issue = monitor.checkVisibility(false, null, 0.5);
      expect(issue?.type).toBe('no_face');
      expect(issue?.consecutiveFrames).toBe(5);
    });

    it('should auto-dismiss alert when face is detected', () => {
      // Trigger no_face alert
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      const issue = monitor.checkVisibility(false, null, 0.5);
      expect(issue?.type).toBe('no_face');

      // Face detected - should dismiss alert
      const mockLandmarks: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };
      
      const resolvedIssue = monitor.checkVisibility(true, mockLandmarks, 0.8);
      expect(resolvedIssue).toBeNull();
      expect(monitor.getCurrentIssue()).toBeNull();
    });

    it('should track issue duration for pause logic', () => {
      // Trigger alert
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      // Check that duration is being tracked
      const duration = monitor.getIssueDuration();
      expect(duration).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Subtask 5.2: Lighting Quality Detection Tests
  // ==========================================================================

  describe('Lighting Quality Detection', () => {
    const mockLandmarks: FaceLandmarks = {
      33: { x: 0.1, y: 0.2, z: 0 },
      133: { x: 0.15, y: 0.2, z: 0 },
      362: { x: 0.85, y: 0.2, z: 0 },
      263: { x: 0.9, y: 0.2, z: 0 }
    };

    it('should not trigger alert for 1-2 frames of low confidence', () => {
      // First low confidence frame
      let issue = monitor.checkVisibility(true, mockLandmarks, 0.2);
      expect(issue).toBeNull();

      // Second low confidence frame
      issue = monitor.checkVisibility(true, mockLandmarks, 0.25);
      expect(issue).toBeNull();
    });

    it('should trigger alert when confidence < 0.3 for 3 frames', () => {
      // First two low confidence frames
      monitor.checkVisibility(true, mockLandmarks, 0.2);
      monitor.checkVisibility(true, mockLandmarks, 0.25);

      // Third low confidence frame - should trigger alert
      const issue = monitor.checkVisibility(true, mockLandmarks, 0.28);
      
      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('poor_lighting');
      expect(issue?.message).toBe('Poor lighting detected — please improve lighting for better accuracy');
      expect(issue?.severity).toBe('warning');
      expect(issue?.consecutiveFrames).toBe(3);
    });

    it('should not trigger alert when confidence >= 0.3', () => {
      // Good confidence - no alert
      const issue = monitor.checkVisibility(true, mockLandmarks, 0.8);
      expect(issue).toBeNull();
    });

    it('should auto-dismiss alert when lighting improves', () => {
      // Trigger poor_lighting alert
      monitor.checkVisibility(true, mockLandmarks, 0.2);
      monitor.checkVisibility(true, mockLandmarks, 0.25);
      const issue = monitor.checkVisibility(true, mockLandmarks, 0.28);
      expect(issue?.type).toBe('poor_lighting');

      // Lighting improves - should dismiss alert
      const resolvedIssue = monitor.checkVisibility(true, mockLandmarks, 0.8);
      expect(resolvedIssue).toBeNull();
      expect(monitor.getCurrentIssue()).toBeNull();
    });

    it('should handle confidence exactly at threshold (0.3)', () => {
      // Confidence at threshold should not trigger alert
      monitor.checkVisibility(true, mockLandmarks, 0.3);
      monitor.checkVisibility(true, mockLandmarks, 0.3);
      const issue = monitor.checkVisibility(true, mockLandmarks, 0.3);
      
      expect(issue).toBeNull();
    });
  });

  // ==========================================================================
  // Subtask 5.3: Eye Visibility Detection Tests
  // ==========================================================================

  describe('Eye Visibility Detection', () => {
    it('should not trigger alert when both eyes are visible', () => {
      const landmarksWithEyes: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },   // Left eye outer
        133: { x: 0.15, y: 0.2, z: 0 }, // Left eye inner
        362: { x: 0.85, y: 0.2, z: 0 }, // Right eye outer
        263: { x: 0.9, y: 0.2, z: 0 }   // Right eye inner
      };

      const issue = monitor.checkVisibility(true, landmarksWithEyes, 0.8);
      expect(issue).toBeNull();
    });

    it('should trigger alert when left eye landmarks are missing', () => {
      const landmarksNoLeftEye: FaceLandmarks = {
        // Missing landmarks 33 and 133 (left eye)
        362: { x: 0.85, y: 0.2, z: 0 }, // Right eye outer
        263: { x: 0.9, y: 0.2, z: 0 }   // Right eye inner
      };

      // Trigger alert after 3 frames
      monitor.checkVisibility(true, landmarksNoLeftEye, 0.8);
      monitor.checkVisibility(true, landmarksNoLeftEye, 0.8);
      const issue = monitor.checkVisibility(true, landmarksNoLeftEye, 0.8);

      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('eyes_not_visible');
      expect(issue?.message).toBe('Eyes not visible — please ensure your face is fully visible');
      expect(issue?.consecutiveFrames).toBe(3);
    });

    it('should trigger alert when right eye landmarks are missing', () => {
      const landmarksNoRightEye: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },   // Left eye outer
        133: { x: 0.15, y: 0.2, z: 0 }  // Left eye inner
        // Missing landmarks 362 and 263 (right eye)
      };

      // Trigger alert after 3 frames
      monitor.checkVisibility(true, landmarksNoRightEye, 0.8);
      monitor.checkVisibility(true, landmarksNoRightEye, 0.8);
      const issue = monitor.checkVisibility(true, landmarksNoRightEye, 0.8);

      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('eyes_not_visible');
    });

    it('should trigger alert when both eyes are missing', () => {
      const landmarksNoEyes: FaceLandmarks = {
        // No eye landmarks at all
        1: { x: 0.5, y: 0.5, z: 0 } // Some other landmark
      };

      // Trigger alert after 3 frames
      monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      const issue = monitor.checkVisibility(true, landmarksNoEyes, 0.8);

      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('eyes_not_visible');
    });

    it('should auto-dismiss alert when eyes become visible', () => {
      const landmarksNoEyes: FaceLandmarks = {
        1: { x: 0.5, y: 0.5, z: 0 }
      };

      // Trigger eyes_not_visible alert
      monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      const issue = monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      expect(issue?.type).toBe('eyes_not_visible');

      // Eyes become visible - should dismiss alert
      const landmarksWithEyes: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };

      const resolvedIssue = monitor.checkVisibility(true, landmarksWithEyes, 0.8);
      expect(resolvedIssue).toBeNull();
      expect(monitor.getCurrentIssue()).toBeNull();
    });
  });

  // ==========================================================================
  // Pause Logic Tests (Requirement 6.5)
  // ==========================================================================

  describe('Pause Emotion Tracking Logic', () => {
    it('should not pause tracking immediately when issues start', () => {
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      expect(monitor.shouldPauseEmotionTracking()).toBe(false);
    });

    it('should pause tracking after 30 seconds of persistent issues', (done) => {
      // Trigger an issue
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      // Wait 30+ seconds (simulated by manually setting timestamp)
      // In real scenario, this would be time-based
      setTimeout(() => {
        // After 30 seconds, should recommend pause
        expect(monitor.shouldPauseEmotionTracking()).toBe(true);
        done();
      }, 31000);
    }, 35000); // Increase test timeout

    it('should reset pause timer when issues are resolved', () => {
      // Trigger issue
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      // Resolve issue
      const mockLandmarks: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };
      monitor.checkVisibility(true, mockLandmarks, 0.8);

      // Should not pause after resolution
      expect(monitor.shouldPauseEmotionTracking()).toBe(false);
      expect(monitor.getIssueDuration()).toBe(0);
    });
  });

  // ==========================================================================
  // Priority and State Management Tests
  // ==========================================================================

  describe('Issue Priority and State Management', () => {
    it('should prioritize no_face over other issues', () => {
      // No face detected - should report no_face regardless of other conditions
      monitor.checkVisibility(false, null, 0.1); // Low confidence too
      monitor.checkVisibility(false, null, 0.1);
      const issue = monitor.checkVisibility(false, null, 0.1);

      expect(issue?.type).toBe('no_face');
    });

    it('should check lighting when face is detected', () => {
      const mockLandmarks: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };

      // Face detected but poor lighting
      monitor.checkVisibility(true, mockLandmarks, 0.2);
      monitor.checkVisibility(true, mockLandmarks, 0.2);
      const issue = monitor.checkVisibility(true, mockLandmarks, 0.2);

      expect(issue?.type).toBe('poor_lighting');
    });

    it('should check eyes when face is detected and lighting is good', () => {
      const landmarksNoEyes: FaceLandmarks = {
        1: { x: 0.5, y: 0.5, z: 0 } // Face detected but no eye landmarks
      };

      // Face detected, good lighting, but no eyes
      monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      monitor.checkVisibility(true, landmarksNoEyes, 0.8);
      const issue = monitor.checkVisibility(true, landmarksNoEyes, 0.8);

      expect(issue?.type).toBe('eyes_not_visible');
    });

    it('should return null when all conditions are good', () => {
      const mockLandmarks: FaceLandmarks = {
        33: { x: 0.1, y: 0.2, z: 0 },
        133: { x: 0.15, y: 0.2, z: 0 },
        362: { x: 0.85, y: 0.2, z: 0 },
        263: { x: 0.9, y: 0.2, z: 0 }
      };

      // All conditions good
      const issue = monitor.checkVisibility(true, mockLandmarks, 0.8);
      expect(issue).toBeNull();
    });
  });

  // ==========================================================================
  // Utility Methods Tests
  // ==========================================================================

  describe('Utility Methods', () => {
    it('should reset all counters and state', () => {
      // Trigger some issues
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      // Reset
      monitor.reset();

      // Check state is cleared
      const state = monitor.getState();
      expect(state.noFaceCount).toBe(0);
      expect(state.poorLightingCount).toBe(0);
      expect(state.noEyesCount).toBe(0);
      expect(state.issueDuration).toBe(0);
      expect(state.shouldPause).toBe(false);
      expect(monitor.getCurrentIssue()).toBeNull();
    });

    it('should return current issue', () => {
      // Trigger issue
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      const currentIssue = monitor.getCurrentIssue();
      expect(currentIssue).not.toBeNull();
      expect(currentIssue?.type).toBe('no_face');
    });

    it('should return state for debugging', () => {
      // Trigger some failures
      monitor.checkVisibility(false, null, 0.5);
      monitor.checkVisibility(false, null, 0.5);

      const state = monitor.getState();
      expect(state.noFaceCount).toBe(2);
      expect(state.poorLightingCount).toBe(0);
      expect(state.noEyesCount).toBe(0);
      expect(state.shouldPause).toBe(false);
    });
  });
});
