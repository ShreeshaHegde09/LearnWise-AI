# Emotion Detection Models - ONNX Conversion

This directory contains scripts and utilities for converting PyTorch emotion detection models to ONNX format for web deployment.

## Overview

The emotion detection system uses three trained models:
- **MobileNetV2**: Lightweight CNN for fast inference
- **LandmarkCNN**: Custom CNN optimized for facial landmarks
- **EfficientNet-B0**: High-accuracy model for cloud recalibration

## Directory Structure

```
ai-models/
├── convert_to_onnx.py          # Main conversion script
├── requirements_onnx.txt        # Python dependencies for conversion
├── emotion_detector.py          # Legacy emotion detector (for reference)
└── README.md                    # This file

frontend/public/models/
├── mobilenet_emotion.onnx       # Converted MobileNet model
├── landmark_cnn_emotion.onnx    # Converted LandmarkCNN model
├── efficientnet_emotion.onnx    # Converted EfficientNet model
├── model_info.json              # Model metadata and specifications
└── model_checksums.json         # SHA-256 checksums for integrity verification
```

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements_onnx.txt
```

Required packages:
- torch >= 2.0.0
- torchvision >= 0.15.0
- onnx >= 1.14.0
- onnxruntime >= 1.15.0
- efficientnet-pytorch >= 0.7.1

### 2. Convert Models to ONNX

```bash
python convert_to_onnx.py
```

This script will:
1. Load the trained PyTorch models from `emotion_detection_system/cnn/bigModel/models/`
2. Convert each model to ONNX format (MobileNet, LandmarkCNN, EfficientNet)
3. Test ONNX models for compatibility
4. Generate checksums for integrity verification
5. Save models to `frontend/public/models/`
6. Create metadata files (`model_info.json`, `model_checksums.json`)

**Conversion Results:**
- ✓ MobileNetV2: 8.48 MB (optimized for frontend)
- ✓ LandmarkCNN: 196.37 MB (optimized for frontend)
- ✓ EfficientNet-B0: 15.34 MB (for backend use)

### 3. Verify Conversion (Optional)

```bash
python verify_conversion.py
```

This script compares PyTorch and ONNX outputs to ensure conversion accuracy:
- Verifies output differences are within tolerance (< 1e-4)
- Confirms models produce consistent predictions
- All models verified with max difference < 0.000004

### 4. Test Models (Optional)

```bash
python test_onnx_models.py
```

This script tests ONNX models with random inputs:
- Verifies models load correctly
- Tests inference pipeline
- Displays sample emotion predictions

### 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install onnxruntime-web
```

## Model Specifications

### Input Format
- **Shape**: [1, 3, 224, 224] (batch_size, channels, height, width)
- **Type**: Float32
- **Normalization**: 
  - Mean: [0.485, 0.456, 0.406]
  - Std: [0.229, 0.224, 0.225]

### Output Format
- **Shape**: [1, 4] (batch_size, num_classes)
- **Type**: Float32 (logits)
- **Classes**: [Bored, Confused, Focused, Tired]

## Model Versioning

The system uses semantic versioning for models:
- **Current Version**: 1.0.0
- Version information is stored in `model_info.json`
- Checksums ensure model integrity across deployments

### Version Format
```
MAJOR.MINOR.PATCH
```
- **MAJOR**: Incompatible API changes (e.g., different input/output shapes)
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes or optimizations

## Integrity Verification

Each model has a SHA-256 checksum stored in `model_checksums.json`. The frontend automatically verifies checksums when loading models to ensure:
- Models haven't been corrupted during transfer
- Models match the expected trained versions
- No tampering has occurred

## Usage in Frontend

```typescript
import { modelLoader } from '@/lib/modelLoader';
import { EMOTION_MODEL_CONFIG } from '@/config/emotionModels';

// Initialize model loader
await modelLoader.initialize();

// Load models
const models = await modelLoader.loadModels(
  EMOTION_MODEL_CONFIG.localModels,
  true // verify integrity
);

// Models are now ready for inference
```

## Troubleshooting

### Model Loading Fails
- Check that models exist in `frontend/public/models/`
- Verify checksums match in `model_checksums.json`
- Check browser console for detailed error messages

### Conversion Fails
- Ensure all Python dependencies are installed
- Verify trained model files exist in source directory
- Check that model architecture matches the conversion script

### Performance Issues
- Models are optimized for WASM execution
- Consider using Web Workers for parallel processing
- Enable model caching to avoid repeated loads

## Model Training

The models were trained using the scripts in `emotion_detection_system/cnn/bigModel/`:
- Training data: Facial emotion dataset with 4 classes
- Epochs: 35 (using best performing epoch)
- Optimization: Adam optimizer with learning rate scheduling

For retraining or fine-tuning, refer to the training scripts in the `emotion_detection_system` directory.

## Backend Integration

The EfficientNet model is also used on the backend for cloud recalibration:
- Higher accuracy than lightweight models
- Runs on GPU when available
- Used periodically to calibrate local predictions

Backend setup is handled separately in the `backend/` directory.

## License

This project uses pre-trained models and custom architectures. Ensure compliance with:
- PyTorch license
- EfficientNet license
- MobileNet license
- Any dataset licenses used for training
