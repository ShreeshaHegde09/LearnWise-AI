"""
Emotion Ensemble Service - Backend Fallback
This service provides server-side emotion detection as a fallback option.
Primary emotion detection happens client-side using TensorFlow.js

Note: This is a simplified version. The main emotion detection
runs in the browser for better privacy and performance.
"""

import base64
import io
import numpy as np
from PIL import Image
from datetime import datetime

class EmotionEnsembleService:
    """
    Simplified emotion detection service for backend fallback
    """
    
    def __init__(self):
        self.models_loaded = False
        self.emotion_labels = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
        print("ℹ️  Emotion Ensemble Service initialized (fallback mode)")
        print("   Primary detection runs client-side in browser")
    
    def predict(self, image_base64, landmarks=None):
        """
        Predict emotion from base64 encoded image
        Returns a fallback neutral response since detection is client-side
        """
        try:
            # Decode image
            image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Return neutral response (actual detection happens client-side)
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
                'message': 'Using fallback detection. Enable client-side detection for accurate results.'
            }
            
        except Exception as e:
            print(f"Error in emotion prediction: {e}")
            return {
                'emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e),
                'source': 'backend_fallback'
            }
    
    def predict_batch(self, images, local_predictions=None):
        """
        Predict emotions for multiple images
        """
        results = []
        for i, image_base64 in enumerate(images):
            result = self.predict(image_base64)
            result['index'] = i
            results.append(result)
        return results
    
    def get_info(self):
        """
        Get service information
        """
        return {
            'service': 'Emotion Ensemble Service',
            'mode': 'fallback',
            'models_loaded': self.models_loaded,
            'emotion_labels': self.emotion_labels,
            'message': 'Primary emotion detection runs client-side in browser using TensorFlow.js',
            'recommendation': 'Enable camera permissions in browser for accurate emotion detection'
        }

# Create singleton instance
emotion_service = EmotionEnsembleService()
