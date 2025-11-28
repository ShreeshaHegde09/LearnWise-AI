/**
 * CloudRecalibrationService
 * Handles periodic cloud recalibration of local emotion detection models
 * Sends sample frames to backend for EfficientNet validation and applies confidence adjustments
 */

import { EmotionPrediction, EmotionClass } from '../config/emotionModels';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CalibrationRequest {
  image: string; // base64 encoded image
  localPrediction: {
    emotion: EmotionClass;
    confidence: number;
    probabilities: Record<EmotionClass, number>;
  };
  sessionId: string;
  timestamp: number;
}

export interface CalibrationResponse {
  emotion: EmotionClass;
  probabilities: Record<EmotionClass, number>;
  confidence: number;
  calibration_needed: boolean;
  confidence_adjustment: number;
  calibration_recommendation?: {
    action: string;
    reason: string;
    suggested_threshold_adjustment: number;
    severity: 'low' | 'medium' | 'high';
    probability_divergence?: number;
  };
}

export interface CalibrationEvent {
  timestamp: number;
  success: boolean;
  cloudEmotion?: EmotionClass;
  localEmotion: EmotionClass;
  confidenceAdjustment: number;
  calibrationNeeded: boolean;
  error?: string;
}

export interface RecalibrationConfig {
  enabled: boolean;
  minInterval: number; // milliseconds (60000 = 1 min)
  maxInterval: number; // milliseconds (90000 = 1.5 min)
  backendUrl: string;
  maxRetries: number;
  retryDelay: number; // milliseconds
  exponentialBackoff: boolean;
  maxConsecutiveFailures: number; // Max failures before reducing frequency
  failureIntervalMultiplier: number; // Multiplier for interval on failures
  maxFailureInterval: number; // Maximum interval on repeated failures (3 min)
  networkCheckInterval: number; // How often to check if network is back (30s)
}

// ============================================================================
// CloudRecalibrationService Class
// ============================================================================

export class CloudRecalibrationService {
  private static instance: CloudRecalibrationService;
  
  private config: RecalibrationConfig;
  private recalibrationTimer: NodeJS.Timeout | null = null;
  private isRecalibrating: boolean = false;
  private lastRecalibrationTime: number = 0;
  private calibrationHistory: CalibrationEvent[] = [];
  private consecutiveFailures: number = 0;
  private currentInterval: number;
  private confidenceThresholdAdjustment: number = 0;
  private isEnabled: boolean = true;
  
  // Queue for offline requests
  private requestQueue: CalibrationRequest[] = [];
  private maxQueueSize: number = 5;
  
  // Network status tracking
  private isOnline: boolean = true;
  private networkCheckTimer: NodeJS.Timeout | null = null;
  private lastNetworkCheckTime: number = 0;

  private constructor(config?: Partial<RecalibrationConfig>) {
    // Default configuration
    this.config = {
      enabled: true,
      minInterval: 60000, // 1 minute
      maxInterval: 90000, // 1.5 minutes
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      exponentialBackoff: true,
      maxConsecutiveFailures: 5, // After 5 failures, significantly reduce frequency
      failureIntervalMultiplier: 2, // Double interval on each failure
      maxFailureInterval: 180000, // Max 3 minutes on repeated failures
      networkCheckInterval: 30000, // Check network every 30 seconds when offline
      ...config
    };

    // Start with random interval between min and max
    this.currentInterval = this.getRandomInterval();
    
    // Set up network status listeners
    this.setupNetworkListeners();
  }

  static getInstance(config?: Partial<RecalibrationConfig>): CloudRecalibrationService {
    if (!CloudRecalibrationService.instance) {
      CloudRecalibrationService.instance = new CloudRecalibrationService(config);
    }
    return CloudRecalibrationService.instance;
  }

  /**
   * Set up network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.handleNetworkOffline();
    });

    // Initialize online status
    this.isOnline = navigator.onLine;
  }

  /**
   * Handle network coming back online
   */
  private handleNetworkOnline(): void {
    this.isOnline = true;
    
    // Stop network check timer if running
    if (this.networkCheckTimer) {
      clearTimeout(this.networkCheckTimer);
      this.networkCheckTimer = null;
    }

    // Process any queued requests
    if (this.requestQueue.length > 0) {
      console.log('Network restored, processing queued requests...');
      this.processQueue().catch(error => {
        console.error('Error processing queue:', error);
      });
    }

    // Reset consecutive failures on network restoration
    if (this.consecutiveFailures > 0) {
      console.log('Resetting failure count due to network restoration');
      this.consecutiveFailures = 0;
      this.currentInterval = this.getRandomInterval();
    }
  }

  /**
   * Handle network going offline
   */
  private handleNetworkOffline(): void {
    this.isOnline = false;
    
    // Start periodic network checks
    this.startNetworkChecks();
  }

  /**
   * Start periodic network connectivity checks
   */
  private startNetworkChecks(): void {
    if (this.networkCheckTimer) return;

    this.networkCheckTimer = setInterval(() => {
      this.checkNetworkConnectivity();
    }, this.config.networkCheckInterval);

    console.log('Started periodic network checks');
  }

  /**
   * Check network connectivity by attempting a lightweight request
   */
  private async checkNetworkConnectivity(): Promise<void> {
    const now = Date.now();
    
    // Avoid checking too frequently
    if (now - this.lastNetworkCheckTime < this.config.networkCheckInterval) {
      return;
    }

    this.lastNetworkCheckTime = now;

    try {
      // Try a lightweight HEAD request to the backend
      const response = await fetch(`${this.config.backendUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        console.log('Network connectivity confirmed');
        this.handleNetworkOnline();
      }
    } catch (error) {
      // Still offline, continue checking
      console.log('Network still unavailable');
    }
  }

  /**
   * Get a random interval between min and max for recalibration timing
   */
  private getRandomInterval(): number {
    const { minInterval, maxInterval } = this.config;
    return Math.floor(Math.random() * (maxInterval - minInterval) + minInterval);
  }

  /**
   * Start periodic recalibration
   */
  start(): void {
    if (!this.config.enabled || !this.isEnabled) {
      console.log('Cloud recalibration is disabled');
      return;
    }

    if (this.recalibrationTimer) {
      console.log('Recalibration already running');
      return;
    }

    console.log(`Starting cloud recalibration with interval: ${this.currentInterval}ms`);
    
    // Set up periodic recalibration
    this.scheduleNextRecalibration();
  }

  /**
   * Schedule the next recalibration
   */
  private scheduleNextRecalibration(): void {
    if (this.recalibrationTimer) {
      clearTimeout(this.recalibrationTimer);
    }

    // Don't schedule if offline
    if (!this.isOnline) {
      console.log('Skipping recalibration schedule - network offline');
      return;
    }

    // Adjust interval based on consecutive failures
    let adjustedInterval = this.currentInterval;
    
    if (this.consecutiveFailures > 0) {
      // Increase interval on failures (reduce frequency)
      // Use exponential backoff: interval * (multiplier ^ failures)
      const failureMultiplier = Math.pow(
        this.config.failureIntervalMultiplier,
        Math.min(this.consecutiveFailures, this.config.maxConsecutiveFailures)
      );
      
      adjustedInterval = Math.min(
        this.currentInterval * failureMultiplier,
        this.config.maxFailureInterval
      );
      
      console.log(
        `Adjusted recalibration interval due to ${this.consecutiveFailures} failures: ` +
        `${adjustedInterval}ms (${(adjustedInterval / 1000).toFixed(1)}s)`
      );
    }

    this.recalibrationTimer = setTimeout(() => {
      this.triggerRecalibration();
    }, adjustedInterval);
  }

  /**
   * Trigger a recalibration check
   */
  private async triggerRecalibration(): Promise<void> {
    // Get new random interval for next recalibration
    this.currentInterval = this.getRandomInterval();
    
    // Schedule next recalibration
    this.scheduleNextRecalibration();
  }

  /**
   * Stop periodic recalibration
   */
  stop(): void {
    if (this.recalibrationTimer) {
      clearTimeout(this.recalibrationTimer);
      this.recalibrationTimer = null;
    }
    
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = null;
    }
    
    console.log('Cloud recalibration stopped');
  }

  /**
   * Perform recalibration with a captured frame and local prediction
   */
  async recalibrate(
    imageData: ImageData,
    localPrediction: EmotionPrediction,
    sessionId: string
  ): Promise<CalibrationResponse | null> {
    if (!this.config.enabled || !this.isEnabled) {
      return null;
    }

    if (this.isRecalibrating) {
      console.log('Recalibration already in progress, skipping...');
      return null;
    }

    // Check if enough time has passed since last recalibration
    const now = Date.now();
    const timeSinceLastRecalibration = now - this.lastRecalibrationTime;
    
    if (timeSinceLastRecalibration < this.config.minInterval) {
      console.log('Too soon for recalibration, skipping...');
      return null;
    }

    this.isRecalibrating = true;

    try {
      // Encode image to base64
      const base64Image = await this.encodeImageToBase64(imageData);

      // Create calibration request
      const request: CalibrationRequest = {
        image: base64Image,
        localPrediction: {
          emotion: localPrediction.emotion,
          confidence: localPrediction.confidence,
          probabilities: localPrediction.probabilities
        },
        sessionId,
        timestamp: now
      };

      // Send request to backend with retry logic
      const response = await this.sendCalibrationRequest(request);

      if (response) {
        // Log successful calibration
        this.logCalibrationEvent({
          timestamp: now,
          success: true,
          cloudEmotion: response.emotion,
          localEmotion: localPrediction.emotion,
          confidenceAdjustment: response.confidence_adjustment,
          calibrationNeeded: response.calibration_needed
        });

        // Reset failure count on success
        this.consecutiveFailures = 0;
        this.lastRecalibrationTime = now;

        return response;
      }

      return null;
    } catch (error) {
      console.error('Recalibration failed:', error);
      
      // Log failed calibration
      this.logCalibrationEvent({
        timestamp: now,
        success: false,
        localEmotion: localPrediction.emotion,
        confidenceAdjustment: 0,
        calibrationNeeded: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Increment failure count
      this.consecutiveFailures++;

      return null;
    } finally {
      this.isRecalibrating = false;
    }
  }

  /**
   * Encode ImageData to base64 string
   */
  private async encodeImageToBase64(imageData: ImageData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas and draw image data
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert to base64
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data URL prefix
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = () => reject(new Error('Failed to read blob'));
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send calibration request to backend with retry logic
   */
  private async sendCalibrationRequest(
    request: CalibrationRequest,
    retryCount: number = 0
  ): Promise<CalibrationResponse | null> {
    // Check if we're offline before attempting
    if (!this.isOnline) {
      console.log('Offline - queueing request without attempting');
      this.queueRequest(request);
      return null;
    }

    try {
      const response = await fetch(`${this.config.backendUrl}/api/emotion/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: request.image,
          local_prediction: request.localPrediction,
          session_id: request.sessionId,
          timestamp: request.timestamp
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as CalibrationResponse;
    } catch (error) {
      const isNetworkError = this.isNetworkError(error);
      
      console.error(
        `Calibration request failed (attempt ${retryCount + 1}/${this.config.maxRetries + 1}):`,
        isNetworkError ? 'Network error' : error
      );

      // Handle network errors differently from other errors
      if (isNetworkError) {
        // Mark as offline and queue request
        this.isOnline = false;
        this.handleNetworkOffline();
        this.queueRequest(request);
        return null;
      }

      // For non-network errors, retry if we haven't exceeded max retries
      if (retryCount < this.config.maxRetries) {
        // Calculate retry delay with exponential backoff
        const delay = this.config.exponentialBackoff
          ? this.config.retryDelay * Math.pow(2, retryCount)
          : this.config.retryDelay;

        console.log(`Retrying in ${delay}ms...`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry
        return this.sendCalibrationRequest(request, retryCount + 1);
      }

      return null;
    }
  }

  /**
   * Check if an error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) {
      // Network errors are typically TypeErrors with specific messages
      const message = error.message.toLowerCase();
      return (
        message.includes('fetch') ||
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror')
      );
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network request failed') ||
        message.includes('timeout') ||
        message.includes('aborted')
      );
    }

    return false;
  }

  /**
   * Queue a calibration request for later when offline
   */
  private queueRequest(request: CalibrationRequest): void {
    if (this.requestQueue.length >= this.maxQueueSize) {
      // Remove oldest request
      this.requestQueue.shift();
    }

    this.requestQueue.push(request);
    console.log(`Request queued. Queue size: ${this.requestQueue.length}`);
  }

  /**
   * Process queued requests when connection is restored
   */
  async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      return;
    }

    if (!this.isOnline) {
      console.log('Cannot process queue - still offline');
      return;
    }

    console.log(`Processing ${this.requestQueue.length} queued requests...`);

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    let successCount = 0;
    let failCount = 0;

    for (const request of requests) {
      try {
        const response = await this.sendCalibrationRequest(request);
        
        if (response) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to process queued request:', error);
        failCount++;
        
        // If we get a network error, stop processing and re-queue remaining
        if (this.isNetworkError(error)) {
          console.log('Network error during queue processing, stopping...');
          // Re-queue this request and any remaining
          this.queueRequest(request);
          break;
        }
      }
    }

    console.log(
      `Queue processing complete: ${successCount} succeeded, ${failCount} failed`
    );
  }

  /**
   * Log a calibration event
   */
  private logCalibrationEvent(event: CalibrationEvent): void {
    this.calibrationHistory.push(event);

    // Keep only last 50 events
    if (this.calibrationHistory.length > 50) {
      this.calibrationHistory.shift();
    }

    // Log to console
    if (event.success) {
      console.log('Calibration event:', {
        cloudEmotion: event.cloudEmotion,
        localEmotion: event.localEmotion,
        adjustment: event.confidenceAdjustment.toFixed(3),
        needed: event.calibrationNeeded
      });
    } else {
      console.warn('Calibration failed:', event.error);
    }
  }

  /**
   * Get current confidence threshold adjustment
   */
  getConfidenceAdjustment(): number {
    return this.confidenceThresholdAdjustment;
  }

  /**
   * Set confidence threshold adjustment
   */
  setConfidenceAdjustment(adjustment: number): void {
    this.confidenceThresholdAdjustment = adjustment;
    console.log(`Confidence threshold adjusted by: ${adjustment.toFixed(3)}`);
  }

  /**
   * Get calibration history
   */
  getCalibrationHistory(): CalibrationEvent[] {
    return [...this.calibrationHistory];
  }

  /**
   * Get calibration statistics
   */
  getStatistics(): {
    totalCalibrations: number;
    successfulCalibrations: number;
    failedCalibrations: number;
    successRate: number;
    averageConfidenceAdjustment: number;
    consecutiveFailures: number;
    lastRecalibrationTime: number;
    queuedRequests: number;
    isOnline: boolean;
    currentInterval: number;
  } {
    const total = this.calibrationHistory.length;
    const successful = this.calibrationHistory.filter(e => e.success).length;
    const failed = total - successful;
    
    const adjustments = this.calibrationHistory
      .filter(e => e.success)
      .map(e => e.confidenceAdjustment);
    
    const avgAdjustment = adjustments.length > 0
      ? adjustments.reduce((a, b) => a + b, 0) / adjustments.length
      : 0;

    return {
      totalCalibrations: total,
      successfulCalibrations: successful,
      failedCalibrations: failed,
      successRate: total > 0 ? successful / total : 0,
      averageConfidenceAdjustment: avgAdjustment,
      consecutiveFailures: this.consecutiveFailures,
      lastRecalibrationTime: this.lastRecalibrationTime,
      queuedRequests: this.requestQueue.length,
      isOnline: this.isOnline,
      currentInterval: this.currentInterval
    };
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): {
    isOnline: boolean;
    queuedRequests: number;
    consecutiveFailures: number;
    currentInterval: number;
    nextRecalibrationIn: number | null;
  } {
    let nextRecalibrationIn: number | null = null;
    
    if (this.recalibrationTimer && this.lastRecalibrationTime > 0) {
      const elapsed = Date.now() - this.lastRecalibrationTime;
      const remaining = this.currentInterval - elapsed;
      nextRecalibrationIn = Math.max(0, remaining);
    }

    return {
      isOnline: this.isOnline,
      queuedRequests: this.requestQueue.length,
      consecutiveFailures: this.consecutiveFailures,
      currentInterval: this.currentInterval,
      nextRecalibrationIn
    };
  }

  /**
   * Enable or disable recalibration
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.stop();
    } else if (this.config.enabled) {
      this.start();
    }
    
    console.log(`Cloud recalibration ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if recalibration is enabled
   */
  isRecalibrationEnabled(): boolean {
    return this.config.enabled && this.isEnabled;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RecalibrationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart if running
    if (this.recalibrationTimer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Reset the service (clear history and reset state)
   */
  reset(): void {
    this.stop();
    this.calibrationHistory = [];
    this.consecutiveFailures = 0;
    this.lastRecalibrationTime = 0;
    this.confidenceThresholdAdjustment = 0;
    this.requestQueue = [];
    this.currentInterval = this.getRandomInterval();
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastNetworkCheckTime = 0;
    console.log('Cloud recalibration service reset');
  }
}

// Export singleton instance
export const cloudRecalibrationService = CloudRecalibrationService.getInstance();
