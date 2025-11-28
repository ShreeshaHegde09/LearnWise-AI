"""
ONNX Model Conversion Script for Emotion Detection
Converts PyTorch models (MobileNet, LandmarkCNN, EfficientNet) to ONNX format
"""

import torch
import torch.nn as nn
import torchvision.models as models
import os
import sys
import hashlib
import json
from pathlib import Path

# Add parent directory to path to import model definitions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'emotion_detection_system', 'cnn', 'bigModel'))

from model import LandmarkCNN, MobileNetModel, EfficientNetModel


class ModelConverter:
    """Handles conversion of PyTorch models to ONNX format"""
    
    def __init__(self, output_dir='../frontend/public/models'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.checksums = {}
        
    def calculate_checksum(self, file_path):
        """Calculate SHA256 checksum of a file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def convert_mobilenet(self, model_path, output_name='mobilenet_emotion.onnx'):
        """Convert MobileNet model to ONNX"""
        print(f"\n{'='*60}")
        print("Converting MobileNet Model to ONNX")
        print(f"{'='*60}")
        
        # Load model
        model = MobileNetModel(num_classes=4)
        
        if os.path.exists(model_path):
            print(f"Loading weights from: {model_path}")
            checkpoint = torch.load(model_path, map_location='cpu')
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['model_state_dict'])
                elif 'state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['state_dict'])
                else:
                    model.load_state_dict(checkpoint)
            else:
                model.load_state_dict(checkpoint)
        else:
            print(f"Warning: Model file not found at {model_path}")
            print("Using untrained model for conversion (for testing only)")
        
        model.eval()
        
        # Create dummy input (batch_size=1, channels=3, height=224, width=224)
        dummy_input = torch.randn(1, 3, 224, 224)
        
        # Export to ONNX
        output_path = self.output_dir / output_name
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=12,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        print(f"✓ MobileNet model exported to: {output_path}")
        
        # Calculate checksum
        checksum = self.calculate_checksum(output_path)
        self.checksums[output_name] = checksum
        print(f"✓ Checksum: {checksum}")
        
        # Test the ONNX model
        self._test_onnx_model(output_path, dummy_input)
        
        return output_path
    
    def convert_landmark_cnn(self, model_path, output_name='landmark_cnn_emotion.onnx'):
        """Convert LandmarkCNN model to ONNX"""
        print(f"\n{'='*60}")
        print("Converting LandmarkCNN Model to ONNX")
        print(f"{'='*60}")
        
        # Load model
        model = LandmarkCNN(num_classes=4)
        
        if os.path.exists(model_path):
            print(f"Loading weights from: {model_path}")
            checkpoint = torch.load(model_path, map_location='cpu')
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['model_state_dict'])
                elif 'state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['state_dict'])
                else:
                    model.load_state_dict(checkpoint)
            else:
                model.load_state_dict(checkpoint)
        else:
            print(f"Warning: Model file not found at {model_path}")
            print("Using untrained model for conversion (for testing only)")
        
        model.eval()
        
        # Create dummy input (batch_size=1, channels=3, height=224, width=224)
        dummy_input = torch.randn(1, 3, 224, 224)
        
        # Export to ONNX
        output_path = self.output_dir / output_name
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=12,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        print(f"✓ LandmarkCNN model exported to: {output_path}")
        
        # Calculate checksum
        checksum = self.calculate_checksum(output_path)
        self.checksums[output_name] = checksum
        print(f"✓ Checksum: {checksum}")
        
        # Test the ONNX model
        self._test_onnx_model(output_path, dummy_input)
        
        return output_path
    
    def convert_efficientnet(self, model_path, output_name='efficientnet_emotion.onnx'):
        """Convert EfficientNet model to ONNX (for backend use)"""
        print(f"\n{'='*60}")
        print("Converting EfficientNet Model to ONNX")
        print(f"{'='*60}")
        
        # Load model
        model = EfficientNetModel(num_classes=4)
        
        if os.path.exists(model_path):
            print(f"Loading weights from: {model_path}")
            checkpoint = torch.load(model_path, map_location='cpu')
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['model_state_dict'])
                elif 'state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['state_dict'])
                else:
                    model.load_state_dict(checkpoint)
            else:
                model.load_state_dict(checkpoint)
        else:
            print(f"Warning: Model file not found at {model_path}")
            print("Using untrained model for conversion (for testing only)")
        
        model.eval()
        
        # Create dummy input (batch_size=1, channels=3, height=224, width=224)
        dummy_input = torch.randn(1, 3, 224, 224)
        
        # Export to ONNX
        output_path = self.output_dir / output_name
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=12,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        print(f"✓ EfficientNet model exported to: {output_path}")
        
        # Calculate checksum
        checksum = self.calculate_checksum(output_path)
        self.checksums[output_name] = checksum
        print(f"✓ Checksum: {checksum}")
        
        # Test the ONNX model
        self._test_onnx_model(output_path, dummy_input)
        
        return output_path
    
    def _test_onnx_model(self, onnx_path, dummy_input):
        """Test ONNX model compatibility"""
        try:
            import onnx
            import onnxruntime as ort
            
            # Load and check ONNX model
            onnx_model = onnx.load(str(onnx_path))
            onnx.checker.check_model(onnx_model)
            print("✓ ONNX model is valid")
            
            # Test inference
            ort_session = ort.InferenceSession(str(onnx_path))
            ort_inputs = {ort_session.get_inputs()[0].name: dummy_input.numpy()}
            ort_outputs = ort_session.run(None, ort_inputs)
            
            print(f"✓ ONNX inference test passed")
            print(f"  Output shape: {ort_outputs[0].shape}")
            
            # Get model size
            model_size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
            print(f"  Model size: {model_size_mb:.2f} MB")
            
        except ImportError:
            print("⚠ Warning: onnx or onnxruntime not installed. Skipping validation.")
            print("  Install with: pip install onnx onnxruntime")
        except Exception as e:
            print(f"⚠ Warning: ONNX validation failed: {e}")
    
    def optimize_model(self, onnx_path, quantize=False):
        """Optimize ONNX model for web deployment"""
        try:
            import onnx
            from onnx import optimizer
            
            print(f"\nOptimizing model: {onnx_path.name}")
            
            # Load model
            model = onnx.load(str(onnx_path))
            
            # Apply optimization passes
            passes = [
                'eliminate_identity',
                'eliminate_nop_transpose',
                'eliminate_nop_pad',
                'eliminate_unused_initializer',
                'fuse_consecutive_transposes',
                'fuse_transpose_into_gemm',
                'fuse_bn_into_conv',
            ]
            
            optimized_model = optimizer.optimize(model, passes)
            
            # Save optimized model
            optimized_path = onnx_path.parent / f"{onnx_path.stem}_optimized.onnx"
            onnx.save(optimized_model, str(optimized_path))
            
            original_size = os.path.getsize(onnx_path) / (1024 * 1024)
            optimized_size = os.path.getsize(optimized_path) / (1024 * 1024)
            
            print(f"✓ Model optimized")
            print(f"  Original size: {original_size:.2f} MB")
            print(f"  Optimized size: {optimized_size:.2f} MB")
            print(f"  Size reduction: {((original_size - optimized_size) / original_size * 100):.1f}%")
            
            # Optionally apply quantization
            if quantize:
                self._quantize_model(optimized_path)
            
            return optimized_path
            
        except ImportError:
            print("⚠ Warning: onnx optimizer not available. Skipping optimization.")
            return onnx_path
        except Exception as e:
            print(f"⚠ Warning: Optimization failed: {e}")
            return onnx_path
    
    def _quantize_model(self, onnx_path):
        """Apply dynamic quantization to reduce model size"""
        try:
            from onnxruntime.quantization import quantize_dynamic, QuantType
            
            print(f"\nApplying dynamic quantization...")
            
            quantized_path = onnx_path.parent / f"{onnx_path.stem}_quantized.onnx"
            
            quantize_dynamic(
                str(onnx_path),
                str(quantized_path),
                weight_type=QuantType.QUInt8
            )
            
            original_size = os.path.getsize(onnx_path) / (1024 * 1024)
            quantized_size = os.path.getsize(quantized_path) / (1024 * 1024)
            
            print(f"✓ Model quantized")
            print(f"  Original size: {original_size:.2f} MB")
            print(f"  Quantized size: {quantized_size:.2f} MB")
            print(f"  Size reduction: {((original_size - quantized_size) / original_size * 100):.1f}%")
            
            # Calculate checksum for quantized model
            checksum = self.calculate_checksum(quantized_path)
            self.checksums[quantized_path.name] = checksum
            
            return quantized_path
            
        except ImportError:
            print("⚠ Warning: onnxruntime quantization not available.")
            print("  Install with: pip install onnxruntime")
            return onnx_path
        except Exception as e:
            print(f"⚠ Warning: Quantization failed: {e}")
            return onnx_path
    
    def save_checksums(self):
        """Save checksums to JSON file"""
        checksum_path = self.output_dir / 'model_checksums.json'
        with open(checksum_path, 'w') as f:
            json.dump(self.checksums, f, indent=2)
        print(f"\n✓ Checksums saved to: {checksum_path}")
    
    def save_model_info(self):
        """Save model information and metadata"""
        model_info = {
            "version": "1.0.0",
            "models": {
                "mobilenet_emotion.onnx": {
                    "name": "MobileNetV2",
                    "input_shape": [1, 3, 224, 224],
                    "output_shape": [1, 4],
                    "classes": ["Bored", "Confused", "Focused", "Tired"],
                    "checksum": self.checksums.get("mobilenet_emotion.onnx", "")
                },
                "landmark_cnn_emotion.onnx": {
                    "name": "LandmarkCNN",
                    "input_shape": [1, 3, 224, 224],
                    "output_shape": [1, 4],
                    "classes": ["Bored", "Confused", "Focused", "Tired"],
                    "checksum": self.checksums.get("landmark_cnn_emotion.onnx", "")
                },
                "efficientnet_emotion.onnx": {
                    "name": "EfficientNet-B0",
                    "input_shape": [1, 3, 224, 224],
                    "output_shape": [1, 4],
                    "classes": ["Bored", "Confused", "Focused", "Tired"],
                    "checksum": self.checksums.get("efficientnet_emotion.onnx", ""),
                    "note": "For backend use only"
                }
            }
        }
        
        info_path = self.output_dir / 'model_info.json'
        with open(info_path, 'w') as f:
            json.dump(model_info, f, indent=2)
        print(f"✓ Model info saved to: {info_path}")


def main():
    """Main conversion function"""
    print("\n" + "="*60)
    print("Emotion Detection Model Conversion to ONNX")
    print("="*60)
    
    # Initialize converter
    converter = ModelConverter(output_dir='../frontend/public/models')
    
    # Define model paths - using the latest trained models (epoch 35)
    models_to_convert = {
        'mobilenet': '../../emotion_detection_system/cnn/bigModel/models/mobile_epoch35.pth',
        'landmark_cnn': '../../emotion_detection_system/cnn/bigModel/models/landmark_epoch35.pth',
        'efficientnet': '../../emotion_detection_system/cnn/bigModel/models/effnet_epoch35.pth'
    }
    
    print(f"\nUsing trained models:")
    for model_name, path in models_to_convert.items():
        exists = "✓" if os.path.exists(path) else "✗"
        print(f"  {exists} {model_name}: {path}")
    
    # Convert models
    try:
        # Convert MobileNet
        mobilenet_path = converter.convert_mobilenet(
            models_to_convert['mobilenet'],
            'mobilenet_emotion.onnx'
        )
        
        # Convert LandmarkCNN
        landmark_path = converter.convert_landmark_cnn(
            models_to_convert['landmark_cnn'],
            'landmark_cnn_emotion.onnx'
        )
        
        # Convert EfficientNet
        efficientnet_path = converter.convert_efficientnet(
            models_to_convert['efficientnet'],
            'efficientnet_emotion.onnx'
        )
        
        # Optimize models for web deployment
        print("\n" + "="*60)
        print("Optimizing Models for Web Deployment")
        print("="*60)
        
        # Optimize lightweight models (for frontend)
        converter.optimize_model(mobilenet_path, quantize=True)
        converter.optimize_model(landmark_path, quantize=True)
        
        # Optimize EfficientNet (for backend - no quantization to preserve accuracy)
        converter.optimize_model(efficientnet_path, quantize=False)
        
        # Save checksums and model info
        converter.save_checksums()
        converter.save_model_info()
        
        print("\n" + "="*60)
        print("✓ All models converted and optimized successfully!")
        print("="*60)
        print(f"\nModels saved to: {converter.output_dir}")
        print("\nAvailable models:")
        print("  - mobilenet_emotion.onnx (original)")
        print("  - mobilenet_emotion_optimized.onnx (optimized)")
        print("  - mobilenet_emotion_optimized_quantized.onnx (quantized)")
        print("  - landmark_cnn_emotion.onnx (original)")
        print("  - landmark_cnn_emotion_optimized.onnx (optimized)")
        print("  - landmark_cnn_emotion_optimized_quantized.onnx (quantized)")
        print("  - efficientnet_emotion.onnx (original)")
        print("  - efficientnet_emotion_optimized.onnx (optimized)")
        print("\nNext steps:")
        print("1. Install onnxruntime-web in your frontend:")
        print("   npm install onnxruntime-web")
        print("2. Use the quantized models for best performance")
        print("3. Verify model checksums match in production")
        
    except Exception as e:
        print(f"\n✗ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
