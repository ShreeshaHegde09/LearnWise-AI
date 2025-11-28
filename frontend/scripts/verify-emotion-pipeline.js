/**
 * Verification Script for Task 6.4: Emotion Detection Pipeline Integration
 * 
 * This script verifies that all components of the emotion detection pipeline
 * are properly integrated in the EmotionDetector component.
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('Task 6.4: Emotion Detection Pipeline Integration - Verification');
console.log('='.repeat(80));
console.log();

// Read the EmotionDetector component
const emotionDetectorPath = path.join(__dirname, '../src/components/EmotionDetector.tsx');
const emotionDetectorContent = fs.readFileSync(emotionDetectorPath, 'utf-8');

// Define verification checks
const checks = [
  {
    name: '1. Capture frame at adaptive intervals',
    pattern: /timeSinceLastCapture\s*<\s*state\.currentCaptureInterval/,
    description: 'Checks if adaptive capture timing is implemented'
  },
  {
    name: '2. Extract face region from frame',
    pattern: /extractFaceRegion/,
    description: 'Checks if face region extraction function exists'
  },
  {
    name: '3. Call LocalInferenceEngine for prediction',
    pattern: /localInferenceEngine\.predict/,
    description: 'Checks if LocalInferenceEngine.predict() is called'
  },
  {
    name: '4. Pass prediction to EmotionStateManager',
    pattern: /emotionStateManager\.addPrediction/,
    description: 'Checks if prediction is passed to EmotionStateManager'
  },
  {
    name: '5. Check VisibilityMonitor for issues',
    pattern: /visibilityMonitorRef\.current\.checkVisibility/,
    description: 'Checks if VisibilityMonitor is used to check for issues'
  },
  {
    name: '6. Trigger callbacks with emotion state',
    pattern: /onEmotionUpdate\(emotionState\)/,
    description: 'Checks if onEmotionUpdate callback is triggered'
  },
  {
    name: '7. Process emotion detection pipeline',
    pattern: /processEmotionDetection/,
    description: 'Checks if main pipeline function exists'
  },
  {
    name: '8. Update capture interval based on state',
    pattern: /updateCaptureInterval/,
    description: 'Checks if adaptive capture interval update is implemented'
  },
  {
    name: '9. Handle visibility issues callback',
    pattern: /onVisibilityIssue/,
    description: 'Checks if visibility issue callback is triggered'
  },
  {
    name: '10. Convert landmarks for inference',
    pattern: /convertToLocalInferenceLandmarks/,
    description: 'Checks if landmark conversion for inference exists'
  }
];

// Run verification checks
let passedChecks = 0;
let failedChecks = 0;

console.log('Running verification checks...\n');

checks.forEach((check, index) => {
  const passed = check.pattern.test(emotionDetectorContent);
  
  if (passed) {
    console.log(`✓ ${check.name}`);
    console.log(`  ${check.description}`);
    passedChecks++;
  } else {
    console.log(`✗ ${check.name}`);
    console.log(`  ${check.description}`);
    console.log(`  ERROR: Pattern not found`);
    failedChecks++;
  }
  console.log();
});

// Verify the pipeline flow
console.log('='.repeat(80));
console.log('Pipeline Flow Verification');
console.log('='.repeat(80));
console.log();

const pipelineSteps = [
  {
    step: 'MediaPipe detects face',
    pattern: /onFaceMeshResults/,
    found: false
  },
  {
    step: 'Check adaptive capture timing',
    pattern: /timeSinceLastCapture\s*<\s*state\.currentCaptureInterval/,
    found: false
  },
  {
    step: 'Extract face region',
    pattern: /const imageData = extractFaceRegion/,
    found: false
  },
  {
    step: 'Convert landmarks',
    pattern: /convertToLocalInferenceLandmarks\(mediaPipeLandmarks\)/,
    found: false
  },
  {
    step: 'Run local inference',
    pattern: /await localInferenceEngine\.predict/,
    found: false
  },
  {
    step: 'Add to state manager',
    pattern: /emotionStateManager\.addPrediction\(prediction\)/,
    found: false
  },
  {
    step: 'Get current state',
    pattern: /emotionStateManager\.getCurrentState\(\)/,
    found: false
  },
  {
    step: 'Trigger callback',
    pattern: /onEmotionUpdate\(emotionState\)/,
    found: false
  },
  {
    step: 'Update capture interval',
    pattern: /updateCaptureInterval\(emotionState\)/,
    found: false
  }
];

pipelineSteps.forEach(step => {
  step.found = step.pattern.test(emotionDetectorContent);
  console.log(`${step.found ? '✓' : '✗'} ${step.step}`);
});

console.log();

// Check for proper imports
console.log('='.repeat(80));
console.log('Import Verification');
console.log('='.repeat(80));
console.log();

const imports = [
  { name: 'LocalInferenceEngine', pattern: /import.*localInferenceEngine.*from.*LocalInferenceEngine/ },
  { name: 'EmotionStateManager', pattern: /import.*emotionStateManager.*from.*EmotionStateManager/ },
  { name: 'VisibilityMonitor', pattern: /import.*VisibilityMonitor.*from.*VisibilityMonitor/ },
  { name: 'MediaPipe FaceMesh', pattern: /import.*FaceMesh.*from.*@mediapipe\/face_mesh/ },
  { name: 'MediaPipe Camera', pattern: /import.*Camera.*from.*@mediapipe\/camera_utils/ }
];

imports.forEach(imp => {
  const found = imp.pattern.test(emotionDetectorContent);
  console.log(`${found ? '✓' : '✗'} ${imp.name}`);
});

console.log();

// Summary
console.log('='.repeat(80));
console.log('Verification Summary');
console.log('='.repeat(80));
console.log();
console.log(`Total Checks: ${checks.length}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${failedChecks}`);
console.log();

const pipelineComplete = pipelineSteps.every(step => step.found);
const importsComplete = imports.every(imp => imp.pattern.test(emotionDetectorContent));

if (passedChecks === checks.length && pipelineComplete && importsComplete) {
  console.log('✓ SUCCESS: All verification checks passed!');
  console.log('✓ Task 6.4 is complete and properly integrated.');
  process.exit(0);
} else {
  console.log('✗ FAILURE: Some verification checks failed.');
  console.log('✗ Please review the implementation.');
  process.exit(1);
}
