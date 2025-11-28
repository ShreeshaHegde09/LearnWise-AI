/**
 * VisibilityMonitor
 * Monitors face visibility, lighting quality, and eye detection
 * Provides alerts when visibility issues are detected
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type VisibilityIssueType = 'no_face' | 'poor_lighting' | 'eyes_not_visible';
export type VisibilitySeverity = 'warning' | 'error';

export interface VisibilityIssue {
  type: VisibilityIssueType;
  message: string;
  severity: VisibilitySeverity;
  consecutiveFrames: number;
  timestamp: number;
}

export interface FaceLandmarks {
  [key: number]: { x: number; y: number; z: number };
}

// ============================================================================
// VisibilityMonitor Class
// ============================================================================

/**
 * VisibilityMonitor tracks face detection failures, lighting quality,
 * and eye visibility to provide appropriate alerts
 */
export class VisibilityMonitor {
  // Counters for consecutive detection failures
  private noFaceCount: number = 0;
  private poorLightingCount: number = 0;
  private noEyesCount: number = 0;

  // Thresholds
  private readonly CONSECUTIVE_THRESHOLD = 3;
  private readonly LIGHTING_CONFIDENCE_THRESHOLD = 0.3;
  private readonly PAUSE_THRESHOLD_MS = 30000; // 30 seconds

  // Tracking for pause logic
  private firstIssueTimestamp: number | null = null;
  private currentIssue: VisibilityIssue | null = null;

  /**
   * Check visibility conditions and return an issue if detected
   * 
   * @param faceDetected - Whether MediaPipe detected a face
   * @param landmarks - Face landmarks from MediaPipe (null if no face)
   * @param detectionConfidence - MediaPipe detection confidence score
   * @returns VisibilityIssue if a problem is detected, null otherwise
   */
  checkVisibility(
    faceDetected: boolean,
    landmarks: FaceLandmarks | null,
    detectionConfidence: number
  ): VisibilityIssue | null {
    const now = Date.now();

    // ========================================================================
    // Subtask 5.1: Face Detection Monitoring
    // ========================================================================
    
    // Check if face is detected
    if (!faceDetected) {
      this.noFaceCount++;
      
      // Reset other counters since we have no face
      this.poorLightingCount = 0;
      this.noEyesCount = 0;
      
      // Trigger alert after 3 consecutive failures
      if (this.noFaceCount >= this.CONSECUTIVE_THRESHOLD) {
        const issue: VisibilityIssue = {
          type: 'no_face',
          message: 'Face not visible — please adjust camera position',
          severity: 'warning',
          consecutiveFrames: this.noFaceCount,
          timestamp: now
        };
        
        // Track first issue timestamp for pause logic
        if (this.firstIssueTimestamp === null) {
          this.firstIssueTimestamp = now;
        }
        
        this.currentIssue = issue;
        return issue;
      }
    } else {
      // Face detected - reset no face counter and first issue timestamp
      if (this.noFaceCount > 0) {
        this.noFaceCount = 0;
        this.firstIssueTimestamp = null;
        this.currentIssue = null;
      }
      
      // ======================================================================
      // Subtask 5.2: Lighting Quality Detection
      // ======================================================================
      
      // Check lighting quality based on detection confidence
      if (detectionConfidence < this.LIGHTING_CONFIDENCE_THRESHOLD) {
        this.poorLightingCount++;
        
        // Trigger alert when confidence < 0.3 for 3 frames
        if (this.poorLightingCount >= this.CONSECUTIVE_THRESHOLD) {
          const issue: VisibilityIssue = {
            type: 'poor_lighting',
            message: 'Poor lighting detected — please improve lighting for better accuracy',
            severity: 'warning',
            consecutiveFrames: this.poorLightingCount,
            timestamp: now
          };
          
          if (this.firstIssueTimestamp === null) {
            this.firstIssueTimestamp = now;
          }
          
          this.currentIssue = issue;
          return issue;
        }
      } else {
        // Good lighting - reset counter
        if (this.poorLightingCount > 0) {
          this.poorLightingCount = 0;
          if (this.currentIssue?.type === 'poor_lighting') {
            this.firstIssueTimestamp = null;
            this.currentIssue = null;
          }
        }
      }
      
      // ======================================================================
      // Subtask 5.3: Eye Visibility Detection
      // ======================================================================
      
      // Check if eyes are visible in landmarks
      if (landmarks && !this.areEyesVisible(landmarks)) {
        this.noEyesCount++;
        
        // Trigger alert when eyes not visible for 3 frames
        if (this.noEyesCount >= this.CONSECUTIVE_THRESHOLD) {
          const issue: VisibilityIssue = {
            type: 'eyes_not_visible',
            message: 'Eyes not visible — please ensure your face is fully visible',
            severity: 'warning',
            consecutiveFrames: this.noEyesCount,
            timestamp: now
          };
          
          if (this.firstIssueTimestamp === null) {
            this.firstIssueTimestamp = now;
          }
          
          this.currentIssue = issue;
          return issue;
        }
      } else {
        // Eyes visible - reset counter
        if (this.noEyesCount > 0) {
          this.noEyesCount = 0;
          if (this.currentIssue?.type === 'eyes_not_visible') {
            this.firstIssueTimestamp = null;
            this.currentIssue = null;
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if key eye landmarks are present and visible
   * MediaPipe landmarks: 33, 133 (left eye), 362, 263 (right eye)
   * 
   * @param landmarks - Face landmarks from MediaPipe
   * @returns true if eyes are visible, false otherwise
   */
  private areEyesVisible(landmarks: FaceLandmarks): boolean {
    // Check if key eye landmarks exist
    const leftEyeOuter = landmarks[33];
    const leftEyeInner = landmarks[133];
    const rightEyeOuter = landmarks[362];
    const rightEyeInner = landmarks[263];
    
    // Both eyes must have their key landmarks present
    const leftEyeVisible = leftEyeOuter && leftEyeInner;
    const rightEyeVisible = rightEyeOuter && rightEyeInner;
    
    return !!(leftEyeVisible && rightEyeVisible);
  }

  /**
   * Check if emotion tracking should be paused due to persistent visibility issues
   * Pauses after 30 seconds of continuous visibility problems
   * 
   * @returns true if emotion tracking should be paused, false otherwise
   */
  shouldPauseEmotionTracking(): boolean {
    if (this.firstIssueTimestamp === null) {
      return false;
    }
    
    const now = Date.now();
    const issuesDuration = now - this.firstIssueTimestamp;
    
    // Pause if issues persist for more than 30 seconds
    return issuesDuration >= this.PAUSE_THRESHOLD_MS;
  }

  /**
   * Get the current visibility issue if one exists
   * 
   * @returns Current VisibilityIssue or null
   */
  getCurrentIssue(): VisibilityIssue | null {
    return this.currentIssue;
  }

  /**
   * Get the duration of current visibility issues in milliseconds
   * 
   * @returns Duration in ms, or 0 if no issues
   */
  getIssueDuration(): number {
    if (this.firstIssueTimestamp === null) {
      return 0;
    }
    
    return Date.now() - this.firstIssueTimestamp;
  }

  /**
   * Reset all counters and state
   * Useful when starting a new session or after resolving issues
   */
  reset(): void {
    this.noFaceCount = 0;
    this.poorLightingCount = 0;
    this.noEyesCount = 0;
    this.firstIssueTimestamp = null;
    this.currentIssue = null;
  }

  /**
   * Get current state for debugging/monitoring
   * 
   * @returns Object with current counter values
   */
  getState(): {
    noFaceCount: number;
    poorLightingCount: number;
    noEyesCount: number;
    issueDuration: number;
    shouldPause: boolean;
  } {
    return {
      noFaceCount: this.noFaceCount,
      poorLightingCount: this.poorLightingCount,
      noEyesCount: this.noEyesCount,
      issueDuration: this.getIssueDuration(),
      shouldPause: this.shouldPauseEmotionTracking()
    };
  }
}

export default VisibilityMonitor;
