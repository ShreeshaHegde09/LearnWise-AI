# Kiro Emotion Intelligence System - Integration Guide

## 🎯 Overview

The Kiro Emotion Intelligence System is now fully integrated and ready to use! This guide shows you how to use the new components in your application.

## 📦 What's Been Built

### Core Engine Components
- `KiroEmotionEngine` - Main orchestrator
- `SlidingWindowManager` - Temporal emotion tracking (20s/60s windows)
- `EMASmoother` - Smooth emotional transitions
- `TierEvaluator` - 5-tier intelligent intervention logic

### React Components
- `EmotionDetectorWithKiro` - Enhanced emotion detector with Kiro
- `AttentionTrackerWithKiro` - Enhanced attention tracker
- `InterventionModal` - User-facing intervention UI
- `KiroDemo` - Full demo with simulation
- `KiroLearningPage` - Complete integration example

## 🚀 Quick Start

### Option 1: Use the Complete Learning Page

The easiest way to get started is to use the pre-built `KiroLearningPage`:

```typescript
import { KiroLearningPage } from './pages/KiroLearningPage';

function App() {
  return <KiroLearningPage />;
}
```

This gives you a complete learning experience with:
- Emotion detection
- Attention tracking
- Intelligent interventions
- Content adaptation

### Option 2: Use Individual Components

For more control, integrate components individually:

```typescript
import { 
  EmotionDetectorWithKiro,
  AttentionTrackerWithKiro 
} from './lib';

function MyLearningApp() {
  const [attentionData, setAttentionData] = useState();

  const handleKiroIntervention = (tier, action) => {
    switch (action) {
      case 'simplify':
        // Simplify your content
        break;
      case 'break':
        // Pause learning
        break;
      case 'quiz':
        // Show quiz
        break;
      case 'continue':
        // Resume learning
        break;
    }
  };

  return (
    <>
      <EmotionDetectorWithKiro
        attentionData={attentionData}
        onKiroIntervention={handleKiroIntervention}
      />
      
      <AttentionTrackerWithKiro
        onAttentionChange={setAttentionData}
      />
    </>
  );
}
```

### Option 3: Use the Hook

For maximum flexibility, use the `useKiroIntegration` hook:

```typescript
import { useKiroIntegration } from './lib';

function MyComponent() {
  const { 
    kiroEngine, 
    currentAnalysis, 
    processEmotionData,
    interventionManager 
  } = useKiroIntegration();

  // Process your emotion and attention data
  const analysis = processEmotionData(emotionData, attentionData);

  // Check if intervention is needed
  if (analysis.should_intervene) {
    // Handle intervention
  }

  return (
    <div>
      Current Emotion: {currentAnalysis?.dominant_emotion}
    </div>
  );
}
```

## 🎨 Intervention System

### The 5 Tiers

Kiro uses a 5-tier intervention system:

**Tier 0: Do Not Disturb**
- Learner is focused and engaged
- No interventions triggered

**Tier 1: Confusion** (90-120s)
- Learner shows sustained confusion
- Action: Simplify content
- Message: "Looks like this is getting tough… Want me to simplify it?"

**Tier 2: Tired** (180-240s)
- Learner shows fatigue + low attention
- Action: Take a break
- Message: "You look tired… Want a short break or some water?"

**Tier 3: Bored** (180-240s)
- Learner shows boredom + low engagement
- Action: Interactive quiz
- Message: "Feeling bored? Should we try a quick quiz or flash cards?"

**Tier 4: Away** (120s)
- Learner is not looking at screen or tab unfocused
- Action: Continue learning
- Message: "You've been away for a while. Shall we continue learning?"

### Handling Interventions

When an intervention triggers, you receive:
- `tier` - Which tier triggered (1-4)
- `action` - Recommended action ('simplify', 'break', 'quiz', 'continue')

Implement these actions based on your application:

```typescript
const handleKiroIntervention = (tier: number, action: string) => {
  console.log(`Tier ${tier} intervention: ${action}`);
  
  switch (action) {
    case 'simplify':
      // Reduce content complexity
      // Show simpler explanations
      // Add more examples
      break;
      
    case 'break':
      // Pause the learning session
      // Show break timer
      // Suggest stretching or water
      break;
      
    case 'quiz':
      // Generate interactive quiz
      // Show flashcards
      // Engage with questions
      break;
      
    case 'continue':
      // Resume learning
      // Show welcome back message
      // Recap previous content
      break;
  }
};
```

## ⚙️ Configuration

Kiro is highly configurable. Adjust thresholds in `config/kiro.config.ts`:

```typescript
export const DEFAULT_KIRO_CONFIG: KiroConfig = {
  emaAlpha: 0.2,              // Smoothing factor (0-1)
  frameRate: 0.25,            // Frames per second
  cooldownPeriod: 60,         // Seconds between interventions
  
  tierDurations: {
    tier1: { min: 90, max: 120 },    // Confusion
    tier2: { min: 180, max: 240 },   // Tired
    tier3: { min: 180, max: 240 },   // Bored
    tier4: { min: 120, max: 180 }    // Away
  },
  
  windowSizes: {
    short: 20,   // Short-term window (seconds)
    long: 60     // Long-term window (seconds)
  }
};
```

## 🧪 Testing

### Run the Demo

Test Kiro with the built-in demo:

```typescript
import { KiroDemo } from './components/KiroDemo';

function TestPage() {
  return <KiroDemo />;
}
```

The demo includes:
- Simulation modes (focused, confused, tired, bored, away)
- Real-time analysis display
- Intervention testing
- Session statistics

### Manual Testing

1. Start your backend server:
```bash
cd NovProject/backend
python app.py
```

2. Start your frontend:
```bash
cd NovProject/frontend
npm run dev
```

3. Navigate to the Kiro Learning Page
4. Allow camera access
5. Observe interventions based on your emotions

## 📊 Monitoring

### Debug Mode

Enable debug info to see what Kiro is doing:

```typescript
<EmotionDetectorWithKiro
  showDebugInfo={true}
/>

<AttentionTrackerWithKiro
  showDebugInfo={true}
/>
```

### Session Statistics

Get session stats from the engine:

```typescript
const stats = kiroEngine.getSessionStats();
console.log('Duration:', stats.duration);
console.log('Frames:', stats.frameCount);
console.log('FPS:', stats.avgFrameRate);
```

### Current State

Inspect the current Kiro state:

```typescript
const state = kiroEngine.getState();
console.log('Dominant emotion:', state.dominant_emotion);
console.log('EMA trends:', state.ema_trend);
console.log('Should intervene:', state.should_intervene);
```

## 🔧 Troubleshooting

### No Interventions Triggering

1. Check if backend is running: `http://localhost:5000/api/health`
2. Verify camera permissions are granted
3. Check console for errors
4. Enable debug mode to see current state
5. Verify emotion detection is working

### Interventions Too Frequent

1. Increase `cooldownPeriod` in config
2. Increase tier duration thresholds
3. Check if attention tracker is working correctly

### Interventions Too Rare

1. Decrease tier duration thresholds
2. Check if emotions are being detected correctly
3. Verify attention state is updating

## 📝 Next Steps

1. **Customize Messages**: Edit tier messages in `config/kiro.config.ts`
2. **Implement Actions**: Add your content simplification, quiz generation, etc.
3. **Add Analytics**: Track intervention effectiveness
4. **Tune Thresholds**: Adjust based on user feedback
5. **Add More Tiers**: Extend the system with custom intervention logic

## 🎉 You're Ready!

The Kiro Emotion Intelligence System is fully integrated and ready to make your learning platform more adaptive and supportive. Start with the demo, then integrate into your application step by step.

For questions or issues, check the code comments or create an issue in the repository.
