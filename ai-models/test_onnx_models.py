"""
Test script to verify ONNX models work correctly
"""

import onnxruntime as ort
import numpy as np
import json
from pathlib import Path

def test_model(model_path, model_name):
    """Test a single ONNX model"""
    print(f"\n{'='*60}")
    print(f"Testing {model_name}")
    print(f"{'='*60}")
    
    try:
        # Load model
        session = ort.InferenceSession(str(model_path))
        
        # Get input/output info
        input_name = session.get_inputs()[0].name
        input_shape = session.get_inputs()[0].shape
        output_name = session.get_outputs()[0].name
        output_shape = session.get_outputs()[0].shape
        
        print(f"✓ Model loaded successfully")
        print(f"  Input: {input_name} {input_shape}")
        print(f"  Output: {output_name} {output_shape}")
        
        # Create dummy input
        dummy_input = np.random.randn(1, 3, 224, 224).astype(np.float32)
        
        # Run inference
        outputs = session.run([output_name], {input_name: dummy_input})
        
        print(f"✓ Inference successful")
        print(f"  Output shape: {outputs[0].shape}")
        print(f"  Output values: {outputs[0][0]}")
        
        # Apply softmax to get probabilities
        logits = outputs[0][0]
        exp_logits = np.exp(logits - np.max(logits))
        probabilities = exp_logits / exp_logits.sum()
        
        classes = ["Bored", "Confused", "Focused", "Tired"]
        print(f"\n  Emotion Probabilities:")
        for i, (cls, prob) in enumerate(zip(classes, probabilities)):
            print(f"    {cls}: {prob:.4f}")
        
        predicted_class = classes[np.argmax(probabilities)]
        confidence = np.max(probabilities)
        print(f"\n  Predicted: {predicted_class} (confidence: {confidence:.4f})")
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing model: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Test all converted ONNX models"""
    print("\n" + "="*60)
    print("ONNX Model Testing")
    print("="*60)
    
    models_dir = Path('../frontend/public/models')
    
    models_to_test = [
        ('mobilenet_emotion.onnx', 'MobileNetV2'),
        ('landmark_cnn_emotion.onnx', 'LandmarkCNN'),
        ('efficientnet_emotion.onnx', 'EfficientNet-B0'),
    ]
    
    results = {}
    
    for model_file, model_name in models_to_test:
        model_path = models_dir / model_file
        if model_path.exists():
            results[model_name] = test_model(model_path, model_name)
        else:
            print(f"\n✗ Model not found: {model_path}")
            results[model_name] = False
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for model_name, success in results.items():
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status} - {model_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✓ All models tested successfully!")
        print("\nModels are ready for deployment:")
        print("  - Frontend: Use mobilenet_emotion.onnx or landmark_cnn_emotion.onnx")
        print("  - Backend: Use efficientnet_emotion.onnx")
    else:
        print("\n✗ Some models failed testing")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
