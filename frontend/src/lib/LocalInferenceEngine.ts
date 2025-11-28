/**
 * LocalInferenceEngine
 * Handles local emotion detection inference using ONNX.js models
 * Implements ensemble prediction with MobileNet and LandmarkCNN
 */

import * as ort from 'onnxruntime-web';
import { modelLoader } from './modelLoader';
import { EMOTION_MODEL_CONFIG, EmotionPrediction, EmotionProbabilities, EmotionClass } from '../config/emotionModels';
import { emotionWorkerManager, EmotionWorkerManager } from './EmotionWorkerManager';

export interface FaceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
}

interface ModelSessions {
  mobilenet: ort.InferenceSession | null;
  landmarkCNN: ort.InferenceSession | null;
}

export class LocalInferenceEngine {
  private static instance: LocalInferenceEngine;
  private sessions: ModelSessions = {
    mobilenet: null,
    landmarkCNN: null
  };
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private useWebWorker: boolean = true; // Enable Web Worker by default
  private workerInitialized: boolean = false;

  private constructor() {}

  static getInstance(): LocalInferenceEngine {
    if (!LocalInferenceEngine.instance) {
      LocalInferenceEngine.instance = new LocalInferenceEngine();
    }
    return LocalInferenceEngine.instance;
  }

  /**
   * Initialize the inference engine - SIMPLIFIED: Backend-only mode
   * No more ONNX.js complexity - just use backend API
   */
  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('✓ LocalInferenceEngine initialized (backend-only mode)');
      console.log('ℹ️  All emotion predictions will use backend API');
      
      // No model loading needed - backend handles everything
      this.isInitialized = true;
      this.useWebWorker = false;
      this.workerInitialized = false;
    } catch (error) {
      console.error('Failed to initialize LocalInferenceEngine:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Check if the engine is ready to make predictions
   */
  isReady(): boolean {
    return this.isInitialized && (
      this.workerInitialized || 
      (this.sessions.mobilenet !== null && this.sessions.landmarkCNN !== null)
    );
  }

  /**
   * Load ONNX models with error handling and caching
   */
  private async loadModels(): Promise<void> {
    try {
      const modelNames = [...EMOTION_MODEL_CONFIG.localModels];
      console.log('Loading models:', modelNames);

      // Load models in parallel
      const sessionsMap = await modelLoader.loadModels(
        modelNames,
        EMOTION_MODEL_CONFIG.performance.verifyIntegrity
      );

      // Assign sessions
      this.sessions.mobilenet = sessionsMap.get(EMOTION_MODEL_CONFIG.models.mobilenet) || null;
      this.sessions.landmarkCNN = sessionsMap.get(EMOTION_MODEL_CONFIG.models.landmarkCNN) || null;

      // Verify both models loaded
      if (!this.sessions.mobilenet || !this.sessions.landmarkCNN) {
        throw new Error('Failed to load one or more required models');
      }

      console.log('✓ All models loaded successfully');
    } catch (error) {
      console.error('Model loading failed:', error);
      
      // Attempt retry once
      console.log('Retrying model loading...');
      try {
        const sessionsMap = await modelLoader.loadModels(
          [...EMOTION_MODEL_CONFIG.localModels],
          false // Skip integrity check on retry
        );

        this.sessions.mobilenet = sessionsMap.get(EMOTION_MODEL_CONFIG.models.mobilenet) || null;
        this.sessions.landmarkCNN = sessionsMap.get(EMOTION_MODEL_CONFIG.models.landmarkCNN) || null;

        if (!this.sessions.mobilenet || !this.sessions.landmarkCNN) {
          throw new Error('Failed to load models after retry');
        }

        console.log('✓ Models loaded successfully on retry');
      } catch (retryError) {
        console.error('Model loading failed after retry:', retryError);
        throw retryError;
      }
    }
  }

  /**
   * Preprocess face image for model input
   * Resizes to 224x224 and normalizes using ImageNet stats
   */
  private preprocessImage(imageData: ImageData): ort.Tensor {
    const { width, height, channels, normalize } = EMOTION_MODEL_CONFIG.input;

    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw and resize image
    ctx.drawImage(
      this.imageDataToCanvas(imageData),
      0, 0, imageData.width, imageData.height,
      0, 0, width, height
    );

    // Get resized image data
    const resizedImageData = ctx.getImageData(0, 0, width, height);
    const pixels = resizedImageData.data;

    // Prepare tensor data (CHW format: channels, height, width)
    const tensorData = new Float32Array(channels * height * width);

    // Normalize and convert to CHW format
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const pixelIndex = (i * width + j) * 4; // RGBA format
        const tensorIndex = i * width + j;

        // Red channel
        tensorData[tensorIndex] = 
          (pixels[pixelIndex] / 255.0 - normalize.mean[0]) / normalize.std[0];
        
        // Green channel
        tensorData[height * width + tensorIndex] = 
          (pixels[pixelIndex + 1] / 255.0 - normalize.mean[1]) / normalize.std[1];
        
        // Blue channel
        tensorData[2 * height * width + tensorIndex] = 
          (pixels[pixelIndex + 2] / 255.0 - normalize.mean[2]) / normalize.std[2];
      }
    }

    // Create ONNX tensor (batch_size=1, channels=3, height=224, width=224)
    return new ort.Tensor('float32', tensorData, [1, channels, height, width]);
  }

  /**
   * Helper to convert ImageData to canvas
   */
  private imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Preprocess face landmarks for LandmarkCNN
   * Flattens 468 landmarks (x, y, z) into 1404 features
   */
  private preprocessLandmarks(landmarks: FaceLandmarks): ort.Tensor {
    const landmarkArray: number[] = [];

    // Flatten landmarks into [x1, y1, z1, x2, y2, z2, ...]
    for (const landmark of landmarks.landmarks) {
      landmarkArray.push(landmark.x, landmark.y, landmark.z);
    }

    // Verify we have exactly 468 landmarks (1404 features)
    if (landmarkArray.length !== 1404) {
      throw new Error(`Expected 1404 landmark features, got ${landmarkArray.length}`);
    }

    // Create ONNX tensor (batch_size=1, features=1404)
    const tensorData = new Float32Array(landmarkArray);
    return new ort.Tensor('float32', tensorData, [1, 1404]);
  }

  /**
   * Run inference on MobileNet model
   */
  private async runMobileNetInference(imageTensor: ort.Tensor): Promise<Float32Array> {
    if (!this.sessions.mobilenet) {
      throw new Error('MobileNet model not loaded');
    }

    try {
      const feeds = { input: imageTensor };
      const results = await this.sessions.mobilenet.run(feeds);
      
      // Get output tensor (assuming output name is 'output')
      const outputName = this.sessions.mobilenet.outputNames[0];
      const outputTensor = results[outputName];
      
      return outputTensor.data as Float32Array;
    } catch (error) {
      console.error('MobileNet inference failed:', error);
      throw error;
    }
  }

  /**
   * Run inference on LandmarkCNN model
   */
  private async runLandmarkCNNInference(landmarkTensor: ort.Tensor): Promise<Float32Array> {
    if (!this.sessions.landmarkCNN) {
      throw new Error('LandmarkCNN model not loaded');
    }

    try {
      const feeds = { input: landmarkTensor };
      const results = await this.sessions.landmarkCNN.run(feeds);
      
      // Get output tensor
      const outputName = this.sessions.landmarkCNN.outputNames[0];
      const outputTensor = results[outputName];
      
      return outputTensor.data as Float32Array;
    } catch (error) {
      console.error('LandmarkCNN inference failed:', error);
      throw error;
    }
  }

  /**
   * Apply softmax to convert logits to probabilities
   */
  private softmax(logits: Float32Array): Float32Array {
    const maxLogit = Math.max(...Array.from(logits));
    const expScores = Array.from(logits).map(x => Math.exp(x - maxLogit));
    const sumExpScores = expScores.reduce((a, b) => a + b, 0);
    
    return new Float32Array(expScores.map(x => x / sumExpScores));
  }

  /**
   * Ensemble prediction: average predictions from both models
   */
  private ensemblePredictions(
    mobilenetOutput: Float32Array,
    landmarkCNNOutput: Float32Array
  ): EmotionProbabilities {
    // Apply softmax to both outputs
    const mobilenetProbs = this.softmax(mobilenetOutput);
    const landmarkProbs = this.softmax(landmarkCNNOutput);

    // Average the probabilities
    const classes = EMOTION_MODEL_CONFIG.classes;
    const probabilities: EmotionProbabilities = {
      Bored: 0,
      Confused: 0,
      Focused: 0,
      Tired: 0
    };

    for (let i = 0; i < classes.length; i++) {
      const emotion = classes[i];
      probabilities[emotion] = (mobilenetProbs[i] + landmarkProbs[i]) / 2.0;
    }

    return probabilities;
  }

  /**
   * Get dominant emotion and confidence from probabilities
   */
  private getDominantEmotion(probabilities: EmotionProbabilities): {
    emotion: EmotionClass;
    confidence: number;
  } {
    let maxProb = 0;
    let dominantEmotion: EmotionClass = 'Focused';

    for (const [emotion, prob] of Object.entries(probabilities)) {
      if (prob > maxProb) {
        maxProb = prob;
        dominantEmotion = emotion as EmotionClass;
      }
    }

    return {
      emotion: dominantEmotion,
      confidence: maxProb
    };
  }

  /**
   * Main prediction method
   * Runs ensemble inference and returns emotion prediction
   * Uses Web Worker if available, otherwise falls back to main thread
   */
  async predict(imageData: ImageData, landmarks: FaceLandmarks): Promise<EmotionPrediction> {
    if (!this.isInitialized) {
      throw new Error('LocalInferenceEngine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();

    try {
      // SIMPLIFIED: Use backend API for all predictions
      // Convert ImageData to base64
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.putImageData(imageData, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      // Call backend API
      const response = await fetch('/api/emotion/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          landmarks: landmarks.landmarks
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      const inferenceTime = performance.now() - startTime;
      
      console.log(`Backend inference completed in ${inferenceTime.toFixed(2)}ms`, {
        emotion: result.emotion,
        confidence: result.confidence.toFixed(3)
      });

      return {
        emotion: result.emotion as EmotionClass,
        probabilities: result.probabilities as EmotionProbabilities,
        confidence: result.confidence,
        timestamp: Date.now(),
        source: 'backend'
      };
    } catch (error) {
      console.error('Backend prediction failed:', error);
      throw error;
    }
  }

  /**
   * Dispose of resources and clear cache
   */
  async dispose(): Promise<void> {
    // Dispose worker if initialized
    if (this.workerInitialized) {
      emotionWorkerManager.dispose();
      this.workerInitialized = false;
    }

    // Properly dispose ONNX sessions
    try {
      if (this.sessions.mobilenet) {
        await this.sessions.mobilenet.release();
        this.sessions.mobilenet = null;
      }
      
      if (this.sessions.landmarkCNN) {
        await this.sessions.landmarkCNN.release();
        this.sessions.landmarkCNN = null;
      }
    } catch (error) {
      console.error('Error disposing ONNX sessions:', error);
    }

    this.isInitialized = false;
    this.initializationPromise = null;
    modelLoader.clearCache();
    console.log('LocalInferenceEngine disposed');
  }

  /**
   * Check if engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    mobilenet: boolean;
    landmarkCNN: boolean;
    version: string | null;
    usingWebWorker: boolean;
  } {
    return {
      mobilenet: this.sessions.mobilenet !== null || this.workerInitialized,
      landmarkCNN: this.sessions.landmarkCNN !== null || this.workerInitialized,
      version: modelLoader.getVersion(),
      usingWebWorker: this.workerInitialized
    };
  }

  /**
   * Enable or disable Web Worker
   */
  setUseWebWorker(enabled: boolean): void {
    this.useWebWorker = enabled;
    console.log(`Web Worker ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if using Web Worker
   */
  isUsingWebWorker(): boolean {
    return this.workerInitialized;
  }
}

// Export singleton instance
export const localInferenceEngine = LocalInferenceEngine.getInstance();
