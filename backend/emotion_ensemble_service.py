"""
Emotion Ensemble Service - Complete Implementation
Ensemble of 3 models: MobileNet, EfficientNet, and Landmark-based CNN
Provides robust emotion detection with confidence calibration
"""

import os
import base64
import io
import numpy as np
from PIL import Image
from datetime import datetime

# Optional imports
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️  OpenCV not available - using PIL for image processing")

try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow not available - running in fallback mode")

class EmotionEnsembleService:
    """
    Emotion detection using ensemble of three models:
    1. MobileNet-based CNN
    2. EfficientNet-based CNN  
    3. Landmark-based CNN
    
    Combines predictions with weighted voting for robust results
    """
    
    def __init__(self, models_dir='models'):
        """
        Initialize the emotion ensemble service
        
        Args:
            models_dir: Directory containing the model files
        """
        self.models_dir = models_dir
        self.models = {}
        self.models_loaded = False
        
        # Emotion labels (FER2013 standard)
        self.emotion_labels = [
            'angry',
            'disgusted', 
            'fearful',
            'happy',
            'neutral',
            'sad',
            'surprised'
        ]
        
        # Model weights for ensemble (can be tuned)
        self.model_weights = {
            'mobilenet': 0.35,
            'efficientnet': 0.35,
            'landmark': 0.30
        }
        
        # Confidence thresholds
        self.confidence_threshold = 0.5
        self.min_ensemble_confidence = 0.4
        
        print("🔧 Initializing Emotion Ensemble Service...")
        self._load_models()
    
    def _load_models(self):
        """Load all three models from disk"""
        try:
            # Check if TensorFlow is available
            if not TF_AVAILABLE:
                print("⚠️  TensorFlow not available - running in fallback mode")
                print("   Client-side detection (TensorFlow.js) is recommended")
                return
            
            model_paths = {
                'mobilenet': os.path.join(self.models_dir, 'mobilenet_emotion.h5'),
                'efficientnet': os.path.join(self.models_dir, 'efficientnet_emotion.h5'),
                'landmark': os.path.join(self.models_dir, 'landmark_emotion.h5')
            }
            
            # Check if models directory exists
            if not os.path.exists(self.models_dir):
                print(f"⚠️  Models directory not found: {self.models_dir}")
                print("   Running in fallback mode (client-side detection recommended)")
                return
            
            # Load each model
            loaded_count = 0
            for model_name, model_path in model_paths.items():
                if os.path.exists(model_path):
                    try:
                        self.models[model_name] = keras.models.load_model(
                            model_path,
                            compile=False
                        )
                        print(f"✓ Loaded {model_name} model")
                        loaded_count += 1
                    except Exception as e:
                        print(f"⚠️  Failed to load {model_name}: {e}")
                else:
                    print(f"⚠️  Model file not found: {model_path}")
            
            if loaded_count > 0:
                self.models_loaded = True
                print(f"✓ Emotion Ensemble Service ready ({loaded_count}/3 models loaded)")
            else:
                print("⚠️  No models loaded - running in fallback mode")
                print("   Client-side detection (TensorFlow.js) is recommended")
                
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            print("   Running in fallback mode")
    
    def _preprocess_image(self, image, target_size=(48, 48), grayscale=True):
        """
        Preprocess image for emotion detection
        
        Args:
            image: PIL Image or numpy array
            target_size: Target size for the model
            grayscale: Whether to convert to grayscale
            
        Returns:
            Preprocessed numpy array
        """
        try:
            # Convert PIL to numpy if needed
            if isinstance(image, Image.Image):
                image = np.array(image)
            
            # Convert to grayscale if needed
            if grayscale and len(image.shape) == 3:
                if CV2_AVAILABLE:
                    image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                else:
                    # Use PIL for grayscale conversion
                    from PIL import ImageOps
                    pil_img = Image.fromarray(image)
                    pil_img = ImageOps.grayscale(pil_img)
                    image = np.array(pil_img)
            
            # Resize
            if CV2_AVAILABLE:
                image = cv2.resize(image, target_size)
            else:
                # Use PIL for resizing
                pil_img = Image.fromarray(image) if not isinstance(image, Image.Image) else image
                pil_img = pil_img.resize(target_size, Image.LANCZOS)
                image = np.array(pil_img)
            
            # Normalize to [0, 1]
            image = image.astype('float32') / 255.0
            
            # Add channel dimension if grayscale
            if grayscale:
                image = np.expand_dims(image, axis=-1)
            
            # Add batch dimension
            image = np.expand_dims(image, axis=0)
            
            return image
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def _extract_landmarks(self, image):
        """
        Extract facial landmarks from image
        (Simplified version - in production, use MediaPipe or dlib)
        
        Args:
            image: Input image
            
        Returns:
            Landmark features array
        """
        try:
            # For now, return dummy landmarks
            # In production, integrate MediaPipe Face Mesh
            return np.zeros((1, 468, 3))  # 468 landmarks, 3D coordinates
        except Exception as e:
            print(f"Error extracting landmarks: {e}")
            return None
    
    def _predict_single_model(self, model_name, image, landmarks=None):
        """
        Get prediction from a single model
        
        Args:
            model_name: Name of the model
            image: Preprocessed image
            landmarks: Facial landmarks (for landmark model)
            
        Returns:
            Prediction probabilities array
        """
        try:
            if model_name not in self.models:
                return None
            
            model = self.models[model_name]
            
            if model_name == 'landmark' and landmarks is not None:
                # Landmark model uses facial landmarks
                prediction = model.predict(landmarks, verbose=0)
            else:
                # Image-based models
                prediction = model.predict(image, verbose=0)
            
            return prediction[0]  # Return probabilities
            
        except Exception as e:
            print(f"Error in {model_name} prediction: {e}")
            return None
    
    def _ensemble_predict(self, predictions):
        """
        Combine predictions from multiple models using weighted voting
        
        Args:
            predictions: Dictionary of {model_name: probabilities}
            
        Returns:
            Combined probabilities array
        """
        try:
            if not predictions:
                return None
            
            # Initialize combined predictions
            combined = np.zeros(len(self.emotion_labels))
            total_weight = 0
            
            # Weighted average
            for model_name, probs in predictions.items():
                if probs is not None:
                    weight = self.model_weights.get(model_name, 0.33)
                    combined += probs * weight
                    total_weight += weight
            
            # Normalize
            if total_weight > 0:
                combined /= total_weight
            
            return combined
            
        except Exception as e:
            print(f"Error in ensemble prediction: {e}")
            return None
    
    def predict(self, image_base64, landmarks=None):
        """
        Predict emotion from base64 encoded image
        
        Args:
            image_base64: Base64 encoded image string
            landmarks: Optional facial landmarks
            
        Returns:
            Dictionary with emotion prediction results
        """
        try:
            # Decode image
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # If no models loaded, return fallback
            if not self.models_loaded:
                return self._fallback_prediction()
            
            # Preprocess image
            processed_image = self._preprocess_image(image)
            if processed_image is None:
                return self._fallback_prediction()
            
            # Get predictions from each model
            predictions = {}
            for model_name in self.models.keys():
                pred = self._predict_single_model(model_name, processed_image, landmarks)
                if pred is not None:
                    predictions[model_name] = pred
            
            # Ensemble predictions
            combined_probs = self._ensemble_predict(predictions)
            if combined_probs is None:
                return self._fallback_prediction()
            
            # Get top emotion
            emotion_idx = np.argmax(combined_probs)
            emotion = self.emotion_labels[emotion_idx]
            confidence = float(combined_probs[emotion_idx])
            
            # Create emotion dictionary
            all_emotions = {
                label: float(prob) 
                for label, prob in zip(self.emotion_labels, combined_probs)
            }
            
            # Calibrate confidence
            calibrated_confidence = self._calibrate_confidence(confidence, all_emotions)
            
            return {
                'emotion': emotion,
                'confidence': calibrated_confidence,
                'raw_confidence': confidence,
                'all_emotions': all_emotions,
                'models_used': list(predictions.keys()),
                'ensemble_size': len(predictions),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'backend_ensemble'
            }
            
        except Exception as e:
            print(f"Error in emotion prediction: {e}")
            return {
                'emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e),
                'source': 'backend_fallback',
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def _calibrate_confidence(self, confidence, all_emotions):
        """
        Calibrate confidence score based on emotion distribution
        
        Args:
            confidence: Raw confidence score
            all_emotions: Dictionary of all emotion probabilities
            
        Returns:
            Calibrated confidence score
        """
        try:
            # Calculate entropy (uncertainty)
            probs = np.array(list(all_emotions.values()))
            probs = probs[probs > 0]  # Remove zeros
            entropy = -np.sum(probs * np.log(probs + 1e-10))
            max_entropy = np.log(len(self.emotion_labels))
            
            # Normalize entropy to [0, 1]
            normalized_entropy = entropy / max_entropy
            
            # Reduce confidence if high entropy (uncertain)
            calibrated = confidence * (1 - 0.3 * normalized_entropy)
            
            return float(calibrated)
            
        except Exception as e:
            return confidence
    
    def _fallback_prediction(self):
        """
        Return fallback prediction when models not available
        """
        return {
            'emotion': 'neutral',
            'confidence': 0.5,
            'all_emotions': {
                'angry': 0.1,
                'disgusted': 0.05,
                'fearful': 0.05,
                'happy': 0.15,
                'neutral': 0.5,
                'sad': 0.1,
                'surprised': 0.05
            },
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'backend_fallback',
            'message': 'Models not loaded. Using fallback prediction. Enable client-side detection for accurate results.'
        }
    
    def predict_batch(self, images, local_predictions=None):
        """
        Predict emotions for multiple images in batch
        
        Args:
            images: List of base64 encoded images
            local_predictions: Optional local predictions for recalibration
            
        Returns:
            List of prediction results
        """
        results = []
        
        for i, image_base64 in enumerate(images):
            result = self.predict(image_base64)
            result['index'] = i
            
            # If local predictions provided, blend with server predictions
            if local_predictions and i < len(local_predictions):
                result = self._blend_predictions(result, local_predictions[i])
            
            results.append(result)
        
        return results
    
    def _blend_predictions(self, server_pred, local_pred, server_weight=0.6):
        """
        Blend server and local predictions for better accuracy
        
        Args:
            server_pred: Server prediction result
            local_pred: Local (client-side) prediction result
            server_weight: Weight for server prediction (0-1)
            
        Returns:
            Blended prediction result
        """
        try:
            if not self.models_loaded:
                # If no server models, use local prediction
                return local_pred
            
            # Blend emotion probabilities
            server_probs = server_pred.get('all_emotions', {})
            local_probs = local_pred.get('all_emotions', {})
            
            blended_probs = {}
            for emotion in self.emotion_labels:
                server_p = server_probs.get(emotion, 0)
                local_p = local_probs.get(emotion, 0)
                blended_probs[emotion] = (
                    server_weight * server_p + 
                    (1 - server_weight) * local_p
                )
            
            # Get top emotion from blended probabilities
            top_emotion = max(blended_probs.items(), key=lambda x: x[1])
            
            return {
                'emotion': top_emotion[0],
                'confidence': top_emotion[1],
                'all_emotions': blended_probs,
                'source': 'blended',
                'server_weight': server_weight,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error blending predictions: {e}")
            return server_pred
    
    def get_info(self):
        """
        Get information about the emotion detection service
        
        Returns:
            Dictionary with service information
        """
        return {
            'service': 'Emotion Ensemble Service',
            'version': '2.0',
            'models_loaded': self.models_loaded,
            'available_models': list(self.models.keys()),
            'model_count': len(self.models),
            'emotion_labels': self.emotion_labels,
            'model_weights': self.model_weights,
            'confidence_threshold': self.confidence_threshold,
            'ensemble_method': 'weighted_voting',
            'features': [
                'Multi-model ensemble',
                'Confidence calibration',
                'Batch processing',
                'Local-server blending',
                'Fallback support'
            ],
            'recommendation': 'For best results, use client-side detection (TensorFlow.js) as primary with server as fallback'
        }
    
    def health_check(self):
        """
        Check service health
        
        Returns:
            Health status dictionary
        """
        return {
            'status': 'healthy' if self.models_loaded else 'degraded',
            'models_loaded': self.models_loaded,
            'model_count': len(self.models),
            'timestamp': datetime.utcnow().isoformat()
        }

# Create singleton instance
emotion_service = EmotionEnsembleService()
