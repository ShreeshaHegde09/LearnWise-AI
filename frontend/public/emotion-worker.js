/**
 * Emotion Detection Web Worker
 * Handles ONNX inference in a separate thread to avoid blocking the main thread
 * Improves performance by offloading heavy computation
 */

// Import ONNX Runtime for Web Workers
importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort.min.js');

// Worker state
let sessions = {
  mobilenet: null,
  landmarkCNN: null
};

let isInitialized = false;
let modelConfig = null;

/**
 * Message handler for worker communication
 */
self.onmessage = async function(e) {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case 'INITIALIZE':
        await handleInitialize(payload);
        break;

      case 'LOAD_MODELS':
        await handleLoadModels(payload);
        break;

      case 'PREDICT':
        await handlePredict(payload);
        break;

      case 'DISPOSE':
        handleDispose();
        break;

      default:
        self.postMessage({
          type: 'ERROR',
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'Unknown error in worker',
      stack: error.stack
    });
  }
};

/**
 * Initialize the worker with configuration
 */
async function handleInitialize(config) {
  try {
    modelConfig = config;
    
    // Configure ONNX Runtime
    ort.env.wasm.numThreads = 1; // Single thread in worker
    ort.env.wasm.simd = true; // Enable SIMD if available
    
    self.postMessage({
      type: 'INITIALIZED',
      success: true
    });
  } catch (error) {
    self.postMessage({
      type: 'INITIALIZED',
      success: false,
      error: error.message
    });
  }
}

/**
 * Load ONNX models
 */
async function handleLoadModels(payload) {
  const { modelPaths } = payload;

  try {
    // Load MobileNet model
    if (modelPaths.mobilenet) {
      sessions.mobilenet = await ort.InferenceSession.create(modelPaths.mobilenet, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
    }

    // Load LandmarkCNN model
    if (modelPaths.landmarkCNN) {
      sessions.landmarkCNN = await ort.InferenceSession.create(modelPaths.landmarkCNN, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
    }

    isInitialized = true;

    self.postMessage({
      type: 'MODELS_LOADED',
      success: true,
      models: {
        mobilenet: sessions.mobilenet !== null,
        landmarkCNN: sessions.landmarkCNN !== null
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'MODELS_LOADED',
      success: false,
      error: error.message
    });
  }
}

/**
 * Run inference on both models
 */
async function handlePredict(payload) {
  if (!isInitialized) {
    self.postMessage({
      type: 'PREDICTION_ERROR',
      error: 'Worker not initialized'
    });
    return;
  }

  const { imageData, landmarks, requestId } = payload;
  const startTime = performance.now();

  try {
    // Preprocess image
    const imageTensor = preprocessImage(imageData);
    
    // Preprocess landmarks
    const landmarkTensor = preprocessLandmarks(landmarks);

    // Run inference on both models in parallel
    const [mobilenetOutput, landmarkCNNOutput] = await Promise.all([
      runMobileNetInference(imageTensor),
      runLandmarkCNNInference(landmarkTensor)
    ]);

    // Ensemble predictions
    const probabilities = ensemblePredictions(mobilenetOutput, landmarkCNNOutput);

    // Get dominant emotion and confidence
    const { emotion, confidence } = getDominantEmotion(probabilities);

    const inferenceTime = performance.now() - startTime;

    self.postMessage({
      type: 'PREDICTION_RESULT',
      requestId,
      result: {
        emotion,
        probabilities,
        confidence,
        timestamp: Date.now(),
        source: 'local',
        inferenceTime
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'PREDICTION_ERROR',
      requestId,
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Dispose of resources
 */
function handleDispose() {
  sessions.mobilenet = null;
  sessions.landmarkCNN = null;
  isInitialized = false;
  
  self.postMessage({
    type: 'DISPOSED',
    success: true
  });
}

// ============================================================================
// Preprocessing Functions
// ============================================================================

/**
 * Preprocess face image for model input
 */
function preprocessImage(imageData) {
  const width = 224;
  const height = 224;
  const channels = 3;

  // ImageData comes as { data: Uint8ClampedArray, width, height }
  const pixels = imageData.data;
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;

  // Prepare tensor data (CHW format)
  const tensorData = new Float32Array(channels * height * width);

  // Normalization constants (ImageNet)
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  // Resize and normalize
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      // Calculate source pixel position (simple nearest neighbor)
      const srcI = Math.floor((i / height) * srcHeight);
      const srcJ = Math.floor((j / width) * srcWidth);
      const pixelIndex = (srcI * srcWidth + srcJ) * 4; // RGBA format
      const tensorIndex = i * width + j;

      // Red channel
      tensorData[tensorIndex] = 
        (pixels[pixelIndex] / 255.0 - mean[0]) / std[0];
      
      // Green channel
      tensorData[height * width + tensorIndex] = 
        (pixels[pixelIndex + 1] / 255.0 - mean[1]) / std[1];
      
      // Blue channel
      tensorData[2 * height * width + tensorIndex] = 
        (pixels[pixelIndex + 2] / 255.0 - mean[2]) / std[2];
    }
  }

  // Create ONNX tensor
  return new ort.Tensor('float32', tensorData, [1, channels, height, width]);
}

/**
 * Preprocess face landmarks for LandmarkCNN
 */
function preprocessLandmarks(landmarks) {
  const landmarkArray = [];

  // Flatten landmarks into [x1, y1, z1, x2, y2, z2, ...]
  for (const landmark of landmarks.landmarks) {
    landmarkArray.push(landmark.x, landmark.y, landmark.z);
  }

  // Verify we have exactly 468 landmarks (1404 features)
  if (landmarkArray.length !== 1404) {
    throw new Error(`Expected 1404 landmark features, got ${landmarkArray.length}`);
  }

  // Create ONNX tensor
  const tensorData = new Float32Array(landmarkArray);
  return new ort.Tensor('float32', tensorData, [1, 1404]);
}

// ============================================================================
// Inference Functions
// ============================================================================

/**
 * Run inference on MobileNet model
 */
async function runMobileNetInference(imageTensor) {
  if (!sessions.mobilenet) {
    throw new Error('MobileNet model not loaded');
  }

  const feeds = { input: imageTensor };
  const results = await sessions.mobilenet.run(feeds);
  
  const outputName = sessions.mobilenet.outputNames[0];
  const outputTensor = results[outputName];
  
  return outputTensor.data;
}

/**
 * Run inference on LandmarkCNN model
 */
async function runLandmarkCNNInference(landmarkTensor) {
  if (!sessions.landmarkCNN) {
    throw new Error('LandmarkCNN model not loaded');
  }

  const feeds = { input: landmarkTensor };
  const results = await sessions.landmarkCNN.run(feeds);
  
  const outputName = sessions.landmarkCNN.outputNames[0];
  const outputTensor = results[outputName];
  
  return outputTensor.data;
}

// ============================================================================
// Prediction Processing
// ============================================================================

/**
 * Apply softmax to convert logits to probabilities
 */
function softmax(logits) {
  const logitsArray = Array.from(logits);
  const maxLogit = Math.max(...logitsArray);
  const expScores = logitsArray.map(x => Math.exp(x - maxLogit));
  const sumExpScores = expScores.reduce((a, b) => a + b, 0);
  
  return expScores.map(x => x / sumExpScores);
}

/**
 * Ensemble prediction: average predictions from both models
 */
function ensemblePredictions(mobilenetOutput, landmarkCNNOutput) {
  // Apply softmax to both outputs
  const mobilenetProbs = softmax(mobilenetOutput);
  const landmarkProbs = softmax(landmarkCNNOutput);

  // Emotion classes (must match model training order)
  const classes = ['Bored', 'Confused', 'Focused', 'Tired'];

  // Average the probabilities
  const probabilities = {};
  for (let i = 0; i < classes.length; i++) {
    const emotion = classes[i];
    probabilities[emotion] = (mobilenetProbs[i] + landmarkProbs[i]) / 2.0;
  }

  return probabilities;
}

/**
 * Get dominant emotion and confidence from probabilities
 */
function getDominantEmotion(probabilities) {
  let maxProb = 0;
  let dominantEmotion = 'Focused';

  for (const [emotion, prob] of Object.entries(probabilities)) {
    if (prob > maxProb) {
      maxProb = prob;
      dominantEmotion = emotion;
    }
  }

  return {
    emotion: dominantEmotion,
    confidence: maxProb
  };
}

// Log worker initialization
console.log('Emotion Detection Web Worker initialized');
