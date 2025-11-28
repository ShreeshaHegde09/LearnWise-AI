/**
 * EmotionWorkerManager
 * Manages Web Worker for emotion detection inference
 * Handles message passing and error recovery
 */

import { EmotionPrediction, EmotionProbabilities, EmotionClass } from '../config/emotionModels';

export interface FaceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
}

interface PendingRequest {
  requestId: string;
  resolve: (result: EmotionPrediction) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class EmotionWorkerManager {
  private static instance: EmotionWorkerManager;
  private worker: Worker | null = null;
  private isInitialized: boolean = false;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestCounter: number = 0;
  private requestTimeout: number = 5000; // 5 seconds timeout

  private constructor() {}

  static getInstance(): EmotionWorkerManager {
    if (!EmotionWorkerManager.instance) {
      EmotionWorkerManager.instance = new EmotionWorkerManager();
    }
    return EmotionWorkerManager.instance;
  }

  /**
   * Initialize the Web Worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return Promise.resolve();
    }

    try {
      // Create worker
      this.worker = new Worker('/emotion-worker.js');

      // Set up message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);

      // Set up error handler
      this.worker.onerror = this.handleWorkerError.bind(this);

      // Initialize worker
      await this.sendMessage('INITIALIZE', {
        numThreads: 1,
        simd: true
      });

      this.isInitialized = true;
      console.log('✓ EmotionWorkerManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmotionWorkerManager:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Load ONNX models in the worker
   */
  async loadModels(modelPaths: { mobilenet: string; landmarkCNN: string }): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    try {
      await this.sendMessage('LOAD_MODELS', { modelPaths });
      console.log('✓ Models loaded in worker');
    } catch (error) {
      console.error('Failed to load models in worker:', error);
      throw error;
    }
  }

  /**
   * Run prediction in the worker
   */
  async predict(imageData: ImageData, landmarks: FaceLandmarks): Promise<EmotionPrediction> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      // Store pending request
      const pendingRequest: PendingRequest = {
        requestId,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.pendingRequests.set(requestId, pendingRequest);

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Prediction timeout'));
        }
      }, this.requestTimeout);

      // Send prediction request to worker
      this.worker!.postMessage({
        type: 'PREDICT',
        payload: {
          imageData: {
            data: imageData.data,
            width: imageData.width,
            height: imageData.height
          },
          landmarks,
          requestId
        }
      });
    });
  }

  /**
   * Dispose of worker resources
   */
  dispose(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'DISPOSE' });
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error('Worker disposed'));
    });

    this.pendingRequests.clear();
    this.isInitialized = false;
    console.log('EmotionWorkerManager disposed');
  }

  /**
   * Check if worker is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { type, requestId, result, error, success } = event.data;

    switch (type) {
      case 'INITIALIZED':
        if (!success) {
          console.error('Worker initialization failed:', error);
        }
        break;

      case 'MODELS_LOADED':
        if (!success) {
          console.error('Model loading failed in worker:', error);
        }
        break;

      case 'PREDICTION_RESULT':
        this.handlePredictionResult(requestId, result);
        break;

      case 'PREDICTION_ERROR':
        this.handlePredictionError(requestId, error);
        break;

      case 'ERROR':
        console.error('Worker error:', error);
        break;

      case 'DISPOSED':
        console.log('Worker disposed successfully');
        break;

      default:
        console.warn('Unknown worker message type:', type);
    }
  }

  /**
   * Handle prediction result from worker
   */
  private handlePredictionResult(requestId: string, result: EmotionPrediction): void {
    const pendingRequest = this.pendingRequests.get(requestId);

    if (pendingRequest) {
      pendingRequest.resolve(result);
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Handle prediction error from worker
   */
  private handlePredictionError(requestId: string, error: string): void {
    const pendingRequest = this.pendingRequests.get(requestId);

    if (pendingRequest) {
      pendingRequest.reject(new Error(error));
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error event:', error);

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error('Worker error'));
    });

    this.pendingRequests.clear();

    // Try to restart worker
    this.restartWorker();
  }

  /**
   * Restart worker after error
   */
  private async restartWorker(): Promise<void> {
    console.log('Attempting to restart worker...');

    this.isInitialized = false;

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    try {
      await this.initialize();
      console.log('✓ Worker restarted successfully');
    } catch (error) {
      console.error('Failed to restart worker:', error);
    }
  }

  /**
   * Send message to worker and wait for response
   */
  private sendMessage(type: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        const responseType = event.data.type;

        // Check if this is the response we're waiting for
        if (
          (type === 'INITIALIZE' && responseType === 'INITIALIZED') ||
          (type === 'LOAD_MODELS' && responseType === 'MODELS_LOADED')
        ) {
          this.worker!.removeEventListener('message', messageHandler);

          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error || 'Operation failed'));
          }
        }
      };

      this.worker.addEventListener('message', messageHandler);

      // Send message
      this.worker.postMessage({ type, payload });

      // Set timeout
      setTimeout(() => {
        this.worker!.removeEventListener('message', messageHandler);
        reject(new Error('Message timeout'));
      }, 10000); // 10 seconds for initialization/loading
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${this.requestCounter++}`;
  }

  /**
   * Get statistics about pending requests
   */
  getStatistics(): {
    pendingRequests: number;
    isInitialized: boolean;
    isWorkerActive: boolean;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      isInitialized: this.isInitialized,
      isWorkerActive: this.worker !== null
    };
  }
}

// Export singleton instance
export const emotionWorkerManager = EmotionWorkerManager.getInstance();
