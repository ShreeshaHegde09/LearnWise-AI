/**
 * EmotionDetector Component
 * Main React component for emotion detection integration
 * Handles camera access, MediaPipe face detection, and emotion inference
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh, Results, NormalizedLandmark } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { localInferenceEngine } from '../lib/LocalInferenceEngine';
import { emotionStateManager, EmotionState } from '../lib/EmotionStateManager';
import { VisibilityMonitor, VisibilityIssue } from '../lib/VisibilityMonitor';
import { cloudRecalibrationService } from '../lib/CloudRecalibrationService';
import { performanceMonitor } from '../lib/PerformanceMonitor';
import { EmotionPrediction } from '../config/emotionModels';

// Type conversion helpers
type MediaPipeLandmarks = NormalizedLandmark[];

interface LocalInferenceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
}

interface VisibilityLandmarks {
  [key: number]: { x: number; y: number; z: number };
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface EmotionDetectorProps {
  sessionId: string;
  isActive: boolean;
  onEmotionUpdate: (state: EmotionState) => void;
  onVisibilityIssue: (issue: VisibilityIssue | null) => void;
  captureFrequency?: number; // Optional: override default capture frequency (seconds)
  cloudRecalibrationEnabled?: boolean; // Optional: enable/disable cloud recalibration
}

type CameraPermission = 'granted' | 'denied' | 'prompt';

interface EmotionDetectorState {
  isInitialized: boolean;
  cameraPermission: CameraPermission;
  currentCaptureInterval: number;
  lastCaptureTime: number;
  faceDetectionFailures: number;
  error: string | null;
}

// ============================================================================
// EmotionDetector Component
// ============================================================================

export const EmotionDetector: React.FC<EmotionDetectorProps> = ({
  sessionId,
  isActive,
  onEmotionUpdate,
  onVisibilityIssue,
  captureFrequency = 4, // Capture every 4 seconds (15 frames per minute for proper aggregation)
  cloudRecalibrationEnabled = true
}) => {
  // ========================
  // State Management
  // ========================
  const [state, setState] = useState<EmotionDetectorState>({
    isInitialized: false,
    cameraPermission: 'prompt',
    currentCaptureInterval: captureFrequency * 1000, // Convert seconds to milliseconds
    lastCaptureTime: 0,
    faceDetectionFailures: 0,
    error: null
  });

  // ========================
  // Refs
  // ========================
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const captureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityMonitorRef = useRef<VisibilityMonitor>(new VisibilityMonitor());
  const isProcessingRef = useRef<boolean>(false);
  const lastEmotionStateRef = useRef<EmotionState | null>(null);
  const lastCapturedImageRef = useRef<ImageData | null>(null);
  const lastLocalPredictionRef = useRef<EmotionPrediction | null>(null);
  const frameSkipCounterRef = useRef<number>(0);

  // ========================
  // Subtask 6.1: Camera Initialization
  // ========================
  
  /**
   * Request camera permissions and initialize video stream
   */
  const initializeCamera = useCallback(async (): Promise<boolean> => {
    try {
      // Check if camera permission is already denied
      if (state.cameraPermission === 'denied') {
        setState(prev => ({ 
          ...prev, 
          error: 'Camera permission denied. Please enable camera access in your browser settings.' 
        }));
        return false;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      // Store stream reference
      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Update state
      setState(prev => ({
        ...prev,
        cameraPermission: 'granted',
        error: null
      }));

      return true;
    } catch (error) {
      console.error('Camera initialization error:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to access camera';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please enable camera access.';
          setState(prev => ({ ...prev, cameraPermission: 'denied' }));
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }

      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [state.cameraPermission]);

  /**
   * Cleanup camera resources
   */
  const cleanupCamera = useCallback(() => {
    // Stop all video tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop MediaPipe camera
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    // Clear capture timer
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  }, []);

  // ========================
  // Helper Functions
  // ========================

  /**
   * Convert MediaPipe landmarks to LocalInferenceEngine format
   */
  const convertToLocalInferenceLandmarks = (landmarks: MediaPipeLandmarks): LocalInferenceLandmarks => {
    return {
      landmarks: landmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0
      }))
    };
  };

  /**
   * Convert MediaPipe landmarks to VisibilityMonitor format
   */
  const convertToVisibilityLandmarks = (landmarks: MediaPipeLandmarks): VisibilityLandmarks => {
    const result: VisibilityLandmarks = {};
    landmarks.forEach((lm, index) => {
      result[index] = {
        x: lm.x,
        y: lm.y,
        z: lm.z || 0
      };
    });
    return result;
  };

  // ========================
  // Subtask 6.2: MediaPipe Face Detection
  // ========================

  /**
   * Initialize MediaPipe FaceMesh
   */
  const initializeMediaPipe = useCallback(async (): Promise<boolean> => {
    try {
      if (!videoRef.current) {
        console.error('Video element not available');
        return false;
      }

      console.log('Initializing MediaPipe FaceMesh...');

      // Create FaceMesh instance with proper CDN path
      // Using unpkg CDN as fallback for better reliability
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          const cdnPath = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
          console.log('Loading MediaPipe file:', cdnPath);
          return cdnPath;
        }
      });

      // Configure FaceMesh
      // IMPORTANT: refineLandmarks must be FALSE to get 468 landmarks (not 478)
      // Model was trained on 468 landmarks = 1404 features (468 * 3)
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,  // FALSE = 468 landmarks, TRUE = 478 landmarks (includes iris)
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Set up results callback
      faceMesh.onResults(onFaceMeshResults);

      faceMeshRef.current = faceMesh;

      console.log('MediaPipe FaceMesh initialized, starting camera...');

      // Initialize camera
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current) {
            try {
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.error('Error sending frame to FaceMesh:', err);
            }
          }
        },
        width: 640,
        height: 480
      });

      cameraRef.current = camera;
      await camera.start();

      console.log('Camera started successfully');
      setState(prev => ({ ...prev, isInitialized: true }));
      return true;
    } catch (error) {
      console.error('MediaPipe initialization error:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to initialize face detection: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
      return false;
    }
  }, []);

  /**
   * Process MediaPipe face detection results
   */
  const onFaceMeshResults = useCallback((results: Results) => {
    if (!isActive || isProcessingRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCapture = now - state.lastCaptureTime;

    // Get performance settings
    const perfSettings = performanceMonitor.getSettings();

    // Check if we should skip this frame
    if (perfSettings.skipFrames) {
      frameSkipCounterRef.current++;
      if (frameSkipCounterRef.current % 2 !== 0) {
        // Skip every other frame when under high load
        return;
      }
    }

    // Check if it's time to capture based on adaptive interval
    const effectiveInterval = Math.max(state.currentCaptureInterval, perfSettings.captureInterval);
    if (timeSinceLastCapture < effectiveInterval) {
      return;
    }

    // Check face detection
    const faceDetected = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
    
    if (!faceDetected) {
      // Handle no face detected
      setState(prev => ({
        ...prev,
        faceDetectionFailures: prev.faceDetectionFailures + 1
      }));

      // Check visibility issues
      const visibilityIssue = visibilityMonitorRef.current.checkVisibility(
        false,
        null,
        0
      );

      if (visibilityIssue) {
        onVisibilityIssue(visibilityIssue);
      }

      return;
    }

    // Reset failure count
    setState(prev => ({
      ...prev,
      faceDetectionFailures: 0
    }));

    // Extract landmarks
    const mediaPipeLandmarks = results.multiFaceLandmarks[0];
    const detectionConfidence = 0.8; // MediaPipe doesn't provide confidence directly

    // Convert landmarks for visibility check
    const visibilityLandmarks = convertToVisibilityLandmarks(mediaPipeLandmarks);

    // Check visibility issues
    const visibilityIssue = visibilityMonitorRef.current.checkVisibility(
      true,
      visibilityLandmarks,
      detectionConfidence
    );

    if (visibilityIssue) {
      onVisibilityIssue(visibilityIssue);
    } else {
      onVisibilityIssue(null);
    }

    // Process emotion detection
    processEmotionDetection(results, mediaPipeLandmarks, now);
  }, [isActive, state.lastCaptureTime, state.currentCaptureInterval, onVisibilityIssue]);

  // ========================
  // Subtask 6.4: Emotion Detection Pipeline
  // ========================

  /**
   * Process emotion detection from face landmarks
   */
  const processEmotionDetection = useCallback(async (
    results: Results,
    mediaPipeLandmarks: MediaPipeLandmarks,
    timestamp: number
  ) => {
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    const inferenceStartTime = performance.now();

    try {
      // Check if LocalInferenceEngine is initialized
      if (!localInferenceEngine.isReady()) {
        console.warn('LocalInferenceEngine not ready, skipping prediction');
        isProcessingRef.current = false;
        return;
      }

      // Extract face region from canvas
      const imageData = extractFaceRegion(results);
      
      if (!imageData) {
        console.warn('Failed to extract face region');
        isProcessingRef.current = false;
        return;
      }

      // Convert landmarks for local inference
      const localInferenceLandmarks = convertToLocalInferenceLandmarks(mediaPipeLandmarks);

      console.log('Making emotion prediction...');

      // Call LocalInferenceEngine for prediction
      const prediction: EmotionPrediction = await localInferenceEngine.predict(
        imageData,
        localInferenceLandmarks
      );

      console.log('Prediction result:', prediction);

      // Record inference time for performance monitoring
      const inferenceTime = performance.now() - inferenceStartTime;
      performanceMonitor.recordInferenceTime(inferenceTime);

      // Store for cloud recalibration
      lastCapturedImageRef.current = imageData;
      lastLocalPredictionRef.current = prediction;

      // Pass prediction to EmotionStateManager
      emotionStateManager.addPrediction(prediction);

      // Get current emotion state
      const emotionState = emotionStateManager.getCurrentState();

      // Store last emotion state
      lastEmotionStateRef.current = emotionState;

      // Trigger callback with emotion state
      onEmotionUpdate(emotionState);

      // Update last capture time
      setState(prev => ({
        ...prev,
        lastCaptureTime: timestamp
      }));

      // Task 10: Cloud recalibration DISABLED (causes memory errors)
      // triggerCloudRecalibration(imageData, prediction);

    } catch (error) {
      console.error('Emotion detection error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onEmotionUpdate]);

  /**
   * Extract face region from video frame
   */
  const extractFaceRegion = (results: Results): ImageData | null => {
    if (!videoRef.current || !canvasRef.current || !results.multiFaceLandmarks) {
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return null;
    }

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Get full frame image data (face extraction will be done in preprocessing)
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  // ========================
  // Subtask 6.3: Constant Capture Timing
  // ========================
  // Capture interval is now CONSTANT at 20 seconds (no adaptive changes)
  // This prevents frequent captures and reduces alert flooding

  /**
   * Handle visibility change (tab hidden/visible)
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Pause capture when tab is hidden
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
      }
      
      // Stop cloud recalibration when tab is hidden
      cloudRecalibrationService.stop();
      
      // Stop performance monitoring
      performanceMonitor.stopMonitoring();
      
      // Release camera resources to save memory
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      
      // Optimize memory usage
      emotionStateManager.optimizeMemory();
    } else {
      // Resume capture when tab becomes visible
      if (isActive && state.isInitialized) {
        // Restart camera
        if (cameraRef.current && videoRef.current) {
          cameraRef.current.start();
        }
        
        // Resume cloud recalibration (if enabled)
        if (cloudRecalibrationEnabled) {
          cloudRecalibrationService.start();
          // Process any queued recalibration requests
          cloudRecalibrationService.processQueue();
        }
        
        // Resume performance monitoring
        performanceMonitor.startMonitoring();
      }
    }
  }, [isActive, state.isInitialized]);

  // ========================
  // Task 10: Cloud Recalibration Integration
  // ========================

  /**
   * Trigger cloud recalibration with current frame and prediction
   */
  const triggerCloudRecalibration = useCallback(async (
    imageData: ImageData,
    localPrediction: EmotionPrediction
  ) => {
    try {
      const response = await cloudRecalibrationService.recalibrate(
        imageData,
        localPrediction,
        sessionId
      );

      if (response) {
        console.log('Cloud recalibration response:', {
          cloudEmotion: response.emotion,
          localEmotion: localPrediction.emotion,
          confidenceAdjustment: response.confidence_adjustment,
          calibrationNeeded: response.calibration_needed
        });

        // Apply confidence adjustment if significant
        if (Math.abs(response.confidence_adjustment) > 0.05) {
          emotionStateManager.setConfidenceAdjustment(response.confidence_adjustment);
          cloudRecalibrationService.setConfidenceAdjustment(response.confidence_adjustment);
        }

        // Apply calibration recommendations if provided
        if (response.calibration_recommendation) {
          emotionStateManager.applyCalibrationRecommendation(response.calibration_recommendation);
        }
      }
    } catch (error) {
      console.error('Cloud recalibration error:', error);
      // Continue with local inference - error handling is done in the service
    }
  }, [sessionId]);

  // ========================
  // Lifecycle Effects
  // ========================

  /**
   * Initialize component on mount
   */
  useEffect(() => {
    const initialize = async () => {
      if (!isActive) {
        return;
      }

      console.log('Starting EmotionDetector initialization...');

      // Initialize LocalInferenceEngine first
      try {
        console.log('Initializing LocalInferenceEngine...');
        await localInferenceEngine.initialize();
        console.log('✓ LocalInferenceEngine initialized');
      } catch (error) {
        console.error('Failed to initialize LocalInferenceEngine:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load emotion detection models' 
        }));
        return;
      }

      // Initialize camera
      console.log('Initializing camera...');
      const cameraSuccess = await initializeCamera();
      if (!cameraSuccess) {
        console.error('Camera initialization failed');
        return;
      }
      console.log('✓ Camera initialized');

      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initialize MediaPipe
      console.log('Initializing MediaPipe...');
      const mediaPipeSuccess = await initializeMediaPipe();
      if (!mediaPipeSuccess) {
        console.error('MediaPipe initialization failed');
        return;
      }
      console.log('✓ MediaPipe initialized');

      // Start cloud recalibration service (if enabled)
      if (cloudRecalibrationEnabled) {
        console.log('Starting cloud recalibration service...');
        cloudRecalibrationService.start();
      }

      // Start performance monitoring
      performanceMonitor.startMonitoring();

      console.log('✓ EmotionDetector fully initialized');
    };

    initialize();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      cleanupCamera();
      cloudRecalibrationService.stop();
      performanceMonitor.stopMonitoring();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, initializeCamera, initializeMediaPipe, cleanupCamera, handleVisibilityChange]);

  /**
   * Handle active state changes
   */
  useEffect(() => {
    if (!isActive) {
      cleanupCamera();
      if (cloudRecalibrationEnabled) {
        cloudRecalibrationService.stop();
      }
      performanceMonitor.stopMonitoring();
    } else {
      if (cloudRecalibrationEnabled) {
        cloudRecalibrationService.start();
      }
      performanceMonitor.startMonitoring();
    }
  }, [isActive, cloudRecalibrationEnabled, cleanupCamera]);

  // ========================
  // Render
  // ========================

  return (
    <div className="emotion-detector" style={{ display: 'none' }}>
      {/* Hidden video element for camera feed */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
      />
      
      {/* Hidden canvas for frame extraction */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Error display (optional - can be shown in parent component) */}
      {state.error && (
        <div className="emotion-detector-error" style={{ display: 'none' }}>
          {state.error}
        </div>
      )}
    </div>
  );
}