"""
Verification script to compare PyTorch and ONNX model outputs
Ensures conversion maintains model accuracy
"""

import torch
import onnxruntime as ort
import numpy as np
import sys
import os
from pathlib import Path

# Add model directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'emotion_detection_system', 'cnn', 'bigModel'))

from model import LandmarkCNN, MobileNetModel, EfficientNetModel


def compare_outputs(pytorch_output, onnx_output, tolerance=1e-5):
    """Compare PyTorch and ONNX outputs"""
    pytorch_np = pytorch_output.detach().numpy()
    diff = np.abs(pytorch_np - onnx_output)
    max_diff = np.max(diff)
    mean_diff = np.mean(diff)
    
    return {
        'max_diff': max_diff,
        'mean_diff': mean_diff,
        'within_tolerance': max_diff < tolerance
    }


def verify_mobilenet():
    """Verify MobileNet conversion"""
    print(f"\n{'='*60}")
    print("Verifying MobileNet Conversion")
    print(f"{'='*60}")
    
    # Load PyTorch model
    pytorch_model = MobileNetModel(num_classes=4)
    model_path = '../../emotion_detection_system/cnn/bigModel/models/mobile_epoch35.pth'
    
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location='cpu')
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                pytorch_model.load_state_dict(checkpoint['model_state_dict'])
            else:
                pytorch_model.load_state_dict(checkpoint)
        else:
            pytorch_model.load_state_dict(checkpoint)
    
    pytorch_model.eval()
    
    # Load ONNX model
    onnx_path = '../frontend/public/models/mobilenet_emotion.onnx'
    ort_session = ort.InferenceSession(onnx_path)
    
    # Create test input
    test_input = torch.randn(1, 3, 224, 224)
    
    # PyTorch inference
    with torch.no_grad():
        pytorch_output = pytorch_model(test_input)
    
    # ONNX inference
    onnx_input = {ort_session.get_inputs()[0].name: test_input.numpy()}
    onnx_output = ort_session.run(None, onnx_input)[0]
    
    # Compare
    comparison = compare_outputs(pytorch_output, onnx_output, tolerance=1e-4)
    
    print(f"✓ PyTorch output shape: {pytorch_output.shape}")
    print(f"✓ ONNX output shape: {onnx_output.shape}")
    print(f"\nComparison:")
    print(f"  Max difference: {comparison['max_diff']:.8f}")
    print(f"  Mean difference: {comparison['mean_diff']:.8f}")
    print(f"  Within tolerance: {comparison['within_tolerance']}")
    
    if comparison['within_tolerance']:
        print(f"\n✓ MobileNet conversion verified successfully!")
    else:
        print(f"\n⚠ Warning: Outputs differ beyond tolerance")
    
    return comparison['within_tolerance']


def verify_landmark_cnn():
    """Verify LandmarkCNN conversion"""
    print(f"\n{'='*60}")
    print("Verifying LandmarkCNN Conversion")
    print(f"{'='*60}")
    
    # Load PyTorch model
    pytorch_model = LandmarkCNN(num_classes=4)
    model_path = '../../emotion_detection_system/cnn/bigModel/models/landmark_epoch35.pth'
    
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location='cpu')
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                pytorch_model.load_state_dict(checkpoint['model_state_dict'])
            else:
                pytorch_model.load_state_dict(checkpoint)
        else:
            pytorch_model.load_state_dict(checkpoint)
    
    pytorch_model.eval()
    
    # Load ONNX model
    onnx_path = '../frontend/public/models/landmark_cnn_emotion.onnx'
    ort_session = ort.InferenceSession(onnx_path)
    
    # Create test input
    test_input = torch.randn(1, 3, 224, 224)
    
    # PyTorch inference
    with torch.no_grad():
        pytorch_output = pytorch_model(test_input)
    
    # ONNX inference
    onnx_input = {ort_session.get_inputs()[0].name: test_input.numpy()}
    onnx_output = ort_session.run(None, onnx_input)[0]
    
    # Compare
    comparison = compare_outputs(pytorch_output, onnx_output, tolerance=1e-4)
    
    print(f"✓ PyTorch output shape: {pytorch_output.shape}")
    print(f"✓ ONNX output shape: {onnx_output.shape}")
    print(f"\nComparison:")
    print(f"  Max difference: {comparison['max_diff']:.8f}")
    print(f"  Mean difference: {comparison['mean_diff']:.8f}")
    print(f"  Within tolerance: {comparison['within_tolerance']}")
    
    if comparison['within_tolerance']:
        print(f"\n✓ LandmarkCNN conversion verified successfully!")
    else:
        print(f"\n⚠ Warning: Outputs differ beyond tolerance")
    
    return comparison['within_tolerance']


def verify_efficientnet():
    """Verify EfficientNet conversion"""
    print(f"\n{'='*60}")
    print("Verifying EfficientNet Conversion")
    print(f"{'='*60}")
    
    # Load PyTorch model
    pytorch_model = EfficientNetModel(num_classes=4)
    model_path = '../../emotion_detection_system/cnn/bigModel/models/effnet_epoch35.pth'
    
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location='cpu')
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                pytorch_model.load_state_dict(checkpoint['model_state_dict'])
            else:
                pytorch_model.load_state_dict(checkpoint)
        else:
            pytorch_model.load_state_dict(checkpoint)
    
    pytorch_model.eval()
    
    # Load ONNX model
    onnx_path = '../frontend/public/models/efficientnet_emotion.onnx'
    ort_session = ort.InferenceSession(onnx_path)
    
    # Create test input
    test_input = torch.randn(1, 3, 224, 224)
    
    # PyTorch inference
    with torch.no_grad():
        pytorch_output = pytorch_model(test_input)
    
    # ONNX inference
    onnx_input = {ort_session.get_inputs()[0].name: test_input.numpy()}
    onnx_output = ort_session.run(None, onnx_input)[0]
    
    # Compare
    comparison = compare_outputs(pytorch_output, onnx_output, tolerance=1e-4)
    
    print(f"✓ PyTorch output shape: {pytorch_output.shape}")
    print(f"✓ ONNX output shape: {onnx_output.shape}")
    print(f"\nComparison:")
    print(f"  Max difference: {comparison['max_diff']:.8f}")
    print(f"  Mean difference: {comparison['mean_diff']:.8f}")
    print(f"  Within tolerance: {comparison['within_tolerance']}")
    
    if comparison['within_tolerance']:
        print(f"\n✓ EfficientNet conversion verified successfully!")
    else:
        print(f"\n⚠ Warning: Outputs differ beyond tolerance")
    
    return comparison['within_tolerance']


def main():
    """Main verification function"""
    print("\n" + "="*60)
    print("ONNX Conversion Verification")
    print("="*60)
    print("\nComparing PyTorch and ONNX model outputs...")
    
    results = {}
    
    try:
        results['MobileNet'] = verify_mobilenet()
    except Exception as e:
        print(f"\n✗ Error verifying MobileNet: {e}")
        results['MobileNet'] = False
    
    try:
        results['LandmarkCNN'] = verify_landmark_cnn()
    except Exception as e:
        print(f"\n✗ Error verifying LandmarkCNN: {e}")
        results['LandmarkCNN'] = False
    
    try:
        results['EfficientNet'] = verify_efficientnet()
    except Exception as e:
        print(f"\n✗ Error verifying EfficientNet: {e}")
        results['EfficientNet'] = False
    
    # Summary
    print("\n" + "="*60)
    print("Verification Summary")
    print("="*60)
    
    for model_name, verified in results.items():
        status = "✓ VERIFIED" if verified else "✗ FAILED"
        print(f"{status} - {model_name}")
    
    all_verified = all(results.values())
    
    if all_verified:
        print("\n✓ All conversions verified successfully!")
        print("\nThe ONNX models produce outputs within tolerance of PyTorch models.")
        print("Models are ready for production deployment.")
    else:
        print("\n⚠ Some conversions could not be verified")
        print("Review the differences above before deploying.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
