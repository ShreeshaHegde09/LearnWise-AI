/**
 * Emotion Detection Model Configuration
 * Centralized configuration for model paths, versions, and settings
 */

export const EMOTION_MODEL_CONFIG = {
  // Model version
  version: '1.0.0',
  
  // Model file names
  models: {
    mobilenet: 'mobilenet_emotion.onnx',
    landmarkCNN: 'landmark_cnn_emotion.onnx',
    efficientnet: 'efficientnet_emotion.onnx'
  },
  
  // Models to use for local inference (frontend)
  localModels: ['mobilenet_emotion.onnx', 'landmark_cnn_emotion.onnx'],
  
  // Model to use for cloud recalibration (backend)
  cloudModel: 'efficientnet_emotion.onnx',
  
  // Emotion classes (must match model output order)
  classes: ['Bored', 'Confused', 'Focused', 'Tired'] as const,
  
  // Input specifications
  input: {
    width: 224,
    height: 224,
    channels: 3,
    normalize: {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225]
    }
  },
  
  // Inference settings
  inference: {
    // Use ensemble prediction (average of multiple models)
    useEnsemble: true,
    
    // Minimum confidence threshold
    minConfidence: 0.3,
    
    // Execution providers (in order of preference)
    executionProviders: ['wasm'] as const,
    
    // Graph optimization level
    graphOptimizationLevel: 'all' as const
  },
  
  // Performance settings
  performance: {
    // Enable model caching
    enableCaching: true,
    
    // Verify model integrity on load
    verifyIntegrity: true,
    
    // Preload models on initialization
    preloadModels: true,
    
    // Maximum inference time (ms)
    maxInferenceTime: 100
  }
} as const;

export type EmotionClass = typeof EMOTION_MODEL_CONFIG.classes[number];

export interface EmotionProbabilities {
  Bored: number;
  Confused: number;
  Focused: number;
  Tired: number;
}

export interface EmotionPrediction {
  emotion: EmotionClass;
  probabilities: EmotionProbabilities;
  confidence: number;
  timestamp: number;
  source: 'local' | 'cloud';
}
