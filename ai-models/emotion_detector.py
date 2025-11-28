import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import os

class EmotionDetector:
    def __init__(self, model_path='../emotion_detection_system/best_model.h5'):
        """
        Initialize the emotion detector with a pre-trained model
        """
        self.model_path = model_path
        self.model = None
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Emotion labels (adjust based on your model)
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        
        self.load_model()
    
    def load_model(self):
        """Load the pre-trained emotion detection model"""
        try:
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path)
                print(f"Emotion detection model loaded from {self.model_path}")
            else:
                print(f"Model file not found at {self.model_path}")
                # Create a dummy model for testing
                self.create_dummy_model()
        except Exception as e:
            print(f"Error loading model: {e}")
            self.create_dummy_model()
    
    def create_dummy_model(self):
        """Create a dummy model for testing purposes"""
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import Dense, Flatten, Conv2D, MaxPooling2D
        
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            MaxPooling2D(2, 2),
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Flatten(),
            Dense(128, activation='relu'),
            Dense(len(self.emotion_labels), activation='softmax')
        ])
        
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        self.model = model
        print("Using dummy model for testing")
    
    def preprocess_face(self, face_image):
        """
        Preprocess face image for emotion detection
        """
        # Resize to model input size (typically 48x48 for emotion detection)
        face_image = cv2.resize(face_image, (48, 48))
        
        # Convert to grayscale if needed
        if len(face_image.shape) == 3:
            face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        
        # Normalize pixel values
        face_image = face_image.astype('float32') / 255.0
        
        # Reshape for model input
        face_image = img_to_array(face_image)
        face_image = np.expand_dims(face_image, axis=0)
        
        return face_image
    
    def detect_faces(self, image):
        """
        Detect faces in the image using Haar cascades
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces
    
    def predict_emotion(self, face_image):
        """
        Predict emotion from a face image
        """
        if self.model is None:
            return self.get_dummy_prediction()
        
        try:
            # Preprocess the face image
            processed_face = self.preprocess_face(face_image)
            
            # Make prediction
            predictions = self.model.predict(processed_face, verbose=0)
            emotion_scores = predictions[0]
            
            # Get the dominant emotion
            dominant_emotion_idx = np.argmax(emotion_scores)
            dominant_emotion = self.emotion_labels[dominant_emotion_idx]
            confidence = float(emotion_scores[dominant_emotion_idx])
            
            # Create emotion scores dictionary
            emotion_dict = {
                emotion: float(score) 
                for emotion, score in zip(self.emotion_labels, emotion_scores)
            }
            
            return {
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'emotion_scores': emotion_dict
            }
            
        except Exception as e:
            print(f"Error in emotion prediction: {e}")
            return self.get_dummy_prediction()
    
    def get_dummy_prediction(self):
        """Return a dummy prediction for testing"""
        import random
        
        emotion = random.choice(self.emotion_labels)
        confidence = random.uniform(0.6, 0.95)
        
        emotion_scores = {label: random.uniform(0.1, 0.3) for label in self.emotion_labels}
        emotion_scores[emotion] = confidence
        
        return {
            'dominant_emotion': emotion,
            'confidence': confidence,
            'emotion_scores': emotion_scores
        }
    
    def analyze_image(self, image):
        """
        Analyze an image for emotions
        Returns list of detected faces with their emotions
        """
        results = []
        
        # Detect faces in the image
        faces = self.detect_faces(image)
        
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = image[y:y+h, x:x+w]
            
            # Predict emotion
            emotion_result = self.predict_emotion(face_roi)
            
            # Add face coordinates
            emotion_result['face_coordinates'] = {
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h)
            }
            
            results.append(emotion_result)
        
        return results
    
    def analyze_from_file(self, image_path):
        """
        Analyze emotions from an image file
        """
        try:
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            return self.analyze_image(image)
            
        except Exception as e:
            print(f"Error analyzing image file: {e}")
            return []
    
    def analyze_from_bytes(self, image_bytes):
        """
        Analyze emotions from image bytes (useful for web uploads)
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Could not decode image from bytes")
            
            return self.analyze_image(image)
            
        except Exception as e:
            print(f"Error analyzing image bytes: {e}")
            return []
    
    def is_negative_emotion(self, emotion_result):
        """
        Check if the detected emotion is considered negative for learning
        """
        negative_emotions = ['angry', 'sad', 'fear', 'disgust']
        return emotion_result['dominant_emotion'] in negative_emotions
    
    def get_encouragement_message(self, emotion_result):
        """
        Get an appropriate encouragement message based on the detected emotion
        """
        emotion = emotion_result['dominant_emotion']
        
        messages = {
            'angry': "Take a deep breath! Learning can be challenging, but you're making progress. Would you like to simplify the content?",
            'sad': "Don't worry, everyone learns at their own pace. You're doing better than you think! Keep going!",
            'fear': "It's okay to feel uncertain. Learning something new can be intimidating, but you've got this!",
            'disgust': "If the content feels overwhelming, let's break it down into smaller pieces. You're capable of understanding this!",
            'neutral': "You're staying focused! Great job maintaining your concentration.",
            'happy': "Excellent! Your positive attitude is perfect for learning. Keep up the great work!",
            'surprise': "Discovering new things is exciting! Your curiosity will help you learn faster."
        }
        
        return messages.get(emotion, "Keep up the good work! You're making progress.")

# Example usage
if __name__ == "__main__":
    detector = EmotionDetector()
    
    # Test with a sample image (you would replace this with actual image path)
    # results = detector.analyze_from_file("sample_face.jpg")
    # print("Emotion analysis results:", results)
    
    # Test with dummy data
    dummy_result = detector.get_dummy_prediction()
    print("Dummy emotion result:", dummy_result)
    print("Is negative emotion:", detector.is_negative_emotion(dummy_result))
    print("Encouragement message:", detector.get_encouragement_message(dummy_result))