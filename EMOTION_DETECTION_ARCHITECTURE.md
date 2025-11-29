# Emotion Detection Architecture

## Overview

LearnWise AI uses a **hybrid emotion detection system** with client-side processing as primary and server-side as fallback.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  EmotionDetector Component (React)                     │ │
│  │  - Camera access                                       │ │
│  │  - MediaPipe Face Detection                            │ │
│  │  - TensorFlow.js Emotion Classification                │ │
│  │  - Real-time processing (every 7 seconds)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  EmotionStateManager                                   │ │
│  │  - Emotion history tracking                            │ │
│  │  - Confidence smoothing                                │ │
│  │  - State transitions                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TierEvaluator                                         │ │
│  │  - Analyzes emotion patterns                           │ │
│  │  - Determines intervention needs                       │ │
│  │  - Tier 1: Simplify content                            │ │
│  │  - Tier 2: Suggest break                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  EmotionAlert / InterventionModal                      │ │
│  │  - Display alerts to user                              │ │
│  │  - Offer help options                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Optional)
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  emotion_ensemble_service.py (Fallback)                │ │
│  │  - Provides backup emotion detection                   │ │
│  │  - Used if client-side fails                           │ │
│  │  - Returns neutral response by default                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Client-Side (Primary)

#### EmotionDetector.tsx
**Location**: `frontend/src/components/EmotionDetector.tsx`

**Responsibilities**:
- Request camera permission
- Capture video frames
- Detect faces using MediaPipe
- Classify emotions using TensorFlow.js
- Update emotion state

**Key Features**:
- Privacy-first (all processing in browser)
- No data sent to server
- Real-time detection
- Adjustable capture frequency

#### EmotionStateManager.ts
**Location**: `frontend/src/lib/EmotionStateManager.ts`

**Responsibilities**:
- Track emotion history
- Smooth confidence scores
- Detect emotion patterns
- Suggest actions

#### TierEvaluator.ts
**Location**: `frontend/src/lib/TierEvaluator.ts`

**Responsibilities**:
- Evaluate intervention needs
- Implement cooldown periods
- Determine tier levels

**Tier Criteria**:
- **Tier 1**: Confusion/Frustration for 15-20 seconds
- **Tier 2**: Disengagement for 30-45 seconds

#### EmotionAlert.tsx
**Location**: `frontend/src/components/EmotionAlert.tsx`

**Responsibilities**:
- Display intervention alerts
- Offer help options
- Handle user responses

### 2. Server-Side (Fallback)

#### emotion_ensemble_service.py
**Location**: `backend/emotion_ensemble_service.py`

**Responsibilities**:
- Provide fallback emotion detection
- Handle API requests if client-side fails
- Return neutral responses by default

**API Endpoints**:
- `POST /api/emotion/predict` - Single prediction
- `POST /api/emotion/predict/batch` - Batch predictions
- `GET /api/emotion/info` - Service information

## Emotion Categories

1. **Happy** - Positive engagement
2. **Neutral** - Normal state
3. **Sad** - Potential disengagement
4. **Angry** - Frustration
5. **Surprised** - Unexpected content
6. **Fearful** - Anxiety/confusion
7. **Disgusted** - Strong negative reaction

## Intervention System

### Tier 1: Content Simplification
**Trigger**: Confusion or frustration detected for 15+ seconds

**Actions**:
- Simplify current content
- Provide additional explanations
- Offer alternative resources

**Cooldown**: 2 minutes

### Tier 2: Break Suggestion
**Trigger**: Disengagement detected for 30+ seconds

**Actions**:
- Suggest taking a break
- Pause emotion detection
- Resume when ready

**Cooldown**: 5 minutes

## Privacy & Security

### Client-Side Processing
- All facial analysis happens in browser
- No images sent to server
- No data stored externally
- User has full control

### User Controls
- Enable/disable emotion detection
- Adjust capture frequency
- View detection status
- Clear history anytime

## Performance

### Optimization Strategies
1. **Adaptive Capture**: Adjust frequency based on performance
2. **Frame Skipping**: Skip frames if CPU is busy
3. **Web Workers**: Offload processing from main thread
4. **Model Optimization**: Use lightweight models

### Metrics
- **Capture Frequency**: 7 seconds (default)
- **Processing Time**: < 100ms per frame
- **CPU Usage**: < 10% average
- **Memory**: < 50MB

## Configuration

### Frontend Settings
```typescript
{
  enabled: true,
  captureFrequency: 7, // seconds
  cloudRecalibrationEnabled: true,
  cameraPermissionGranted: false
}
```

### Backend Settings
```python
emotion_service = EmotionEnsembleService()
# Fallback mode - returns neutral by default
```

## Integration in LearningInterface

```typescript
{emotionSettings.enabled && (
  <EmotionDetector
    sessionId={sessionData?.session_id}
    isActive={isEmotionDetectionActive}
    onEmotionUpdate={handleEmotionUpdate}
    onVisibilityIssue={handleVisibilityIssue}
    captureFrequency={emotionSettings.captureFrequency || 7}
    cloudRecalibrationEnabled={emotionSettings.cloudRecalibrationEnabled || true}
  />
)}
```

## Troubleshooting

### Camera Not Working
1. Check browser permissions
2. Ensure HTTPS (required for camera access)
3. Try different browser
4. Check camera is not in use

### No Emotions Detected
1. Ensure good lighting
2. Face camera directly
3. Check face is visible
4. Verify TensorFlow.js loaded

### High CPU Usage
1. Increase capture frequency
2. Disable cloud recalibration
3. Close other tabs
4. Use lighter browser

## Future Enhancements

1. **Multi-person detection**
2. **Emotion trends analysis**
3. **Stress level monitoring**
4. **Fatigue detection**
5. **Personalized interventions**
6. **Advanced analytics**

## References

- **MediaPipe**: Face detection library
- **TensorFlow.js**: Machine learning in browser
- **EmotionStateManager**: State management
- **TierEvaluator**: Intervention logic

---

**Last Updated**: November 29, 2025

**Status**: ✅ Fully Operational
