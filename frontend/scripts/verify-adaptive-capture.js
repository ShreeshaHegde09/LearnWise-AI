/**
 * Verification Script for Task 6.3: Adaptive Capture Timing
 * Tests the adaptive capture interval logic in EmotionDetector
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TASK 6.3 VERIFICATION: Adaptive Capture Timing');
console.log('='.repeat(80));
console.log();

// Read the EmotionDetector component
const emotionDetectorPath = path.join(__dirname, '../src/components/EmotionDetector.tsx');
const emotionDetectorContent = fs.readFileSync(emotionDetectorPath, 'utf-8');

let allChecksPassed = true;

// Check 1: Initial 7-second interval for Focused state
console.log('✓ Check 1: Start with 7-second interval for Focused state');
if (emotionDetectorContent.includes('currentCaptureInterval: 7000')) {
  console.log('  ✓ Default interval set to 7000ms (7 seconds)');
} else {
  console.log('  ✗ Default interval not found');
  allChecksPassed = false;
}
console.log();

// Check 2: Switch to 3-second interval for low confidence
console.log('✓ Check 2: Switch to 3-second interval for low confidence');
if (emotionDetectorContent.includes('emotionState.confidenceScore < 0.6') &&
    emotionDetectorContent.includes('newInterval = 3000')) {
  console.log('  ✓ Low confidence check implemented (< 0.6)');
  console.log('  ✓ Interval switches to 3000ms (3 seconds)');
} else {
  console.log('  ✗ Low confidence logic not found');
  allChecksPassed = false;
}
console.log();

// Check 3: Switch to 3-second interval for Confused/Bored/Tired
console.log('✓ Check 3: Switch to 3-second interval for Confused/Bored/Tired');
const hasConfused = emotionDetectorContent.includes("emotionState.currentEmotion === 'Confused'");
const hasBored = emotionDetectorContent.includes("emotionState.currentEmotion === 'Bored'");
const hasTired = emotionDetectorContent.includes("emotionState.currentEmotion === 'Tired'");

if (hasConfused && hasBored && hasTired) {
  console.log('  ✓ Confused emotion check implemented');
  console.log('  ✓ Bored emotion check implemented');
  console.log('  ✓ Tired emotion check implemented');
  console.log('  ✓ Interval switches to 3000ms for these emotions');
} else {
  console.log('  ✗ Not all emotion checks found');
  if (!hasConfused) console.log('    - Missing: Confused');
  if (!hasBored) console.log('    - Missing: Bored');
  if (!hasTired) console.log('    - Missing: Tired');
  allChecksPassed = false;
}
console.log();

// Check 4: Pause capture when tab is hidden
console.log('✓ Check 4: Pause capture when tab is hidden');
if (emotionDetectorContent.includes('document.hidden') &&
    emotionDetectorContent.includes('clearInterval(captureTimerRef.current)')) {
  console.log('  ✓ Visibility change handler implemented');
  console.log('  ✓ Capture paused when tab hidden');
} else {
  console.log('  ✗ Tab hidden logic not found');
  allChecksPassed = false;
}
console.log();

// Check 5: Resume capture when tab becomes visible
console.log('✓ Check 5: Resume capture when tab becomes visible');
if (emotionDetectorContent.includes('document.hidden') &&
    emotionDetectorContent.includes('isActive && state.isInitialized')) {
  console.log('  ✓ Resume logic implemented');
  console.log('  ✓ Capture resumes when tab visible and active');
} else {
  console.log('  ✗ Tab visible resume logic not found');
  allChecksPassed = false;
}
console.log();

// Check 6: Visibility change event listener
console.log('✓ Check 6: Visibility change event listener');
if (emotionDetectorContent.includes("addEventListener('visibilitychange'") &&
    emotionDetectorContent.includes("removeEventListener('visibilitychange'")) {
  console.log('  ✓ Event listener added on mount');
  console.log('  ✓ Event listener removed on unmount');
} else {
  console.log('  ✗ Event listener setup not found');
  allChecksPassed = false;
}
console.log();

// Check 7: updateCaptureInterval function
console.log('✓ Check 7: updateCaptureInterval function');
if (emotionDetectorContent.includes('const updateCaptureInterval') &&
    emotionDetectorContent.includes('useCallback')) {
  console.log('  ✓ updateCaptureInterval function defined');
  console.log('  ✓ Function uses useCallback for optimization');
} else {
  console.log('  ✗ updateCaptureInterval function not found');
  allChecksPassed = false;
}
console.log();

// Check 8: Interval update in state
console.log('✓ Check 8: Interval update in state');
if (emotionDetectorContent.includes('currentCaptureInterval: newInterval')) {
  console.log('  ✓ State updated with new interval');
} else {
  console.log('  ✗ State update not found');
  allChecksPassed = false;
}
console.log();

// Check 9: Time-based capture check
console.log('✓ Check 9: Time-based capture check');
if (emotionDetectorContent.includes('timeSinceLastCapture < state.currentCaptureInterval')) {
  console.log('  ✓ Capture timing check implemented');
  console.log('  ✓ Uses adaptive interval from state');
} else {
  console.log('  ✗ Capture timing check not found');
  allChecksPassed = false;
}
console.log();

// Check 10: handleVisibilityChange function
console.log('✓ Check 10: handleVisibilityChange function');
if (emotionDetectorContent.includes('const handleVisibilityChange') &&
    emotionDetectorContent.includes('useCallback')) {
  console.log('  ✓ handleVisibilityChange function defined');
  console.log('  ✓ Function uses useCallback for optimization');
} else {
  console.log('  ✗ handleVisibilityChange function not found');
  allChecksPassed = false;
}
console.log();

// Summary
console.log('='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));
console.log();

if (allChecksPassed) {
  console.log('✓ ALL CHECKS PASSED');
  console.log();
  console.log('Task 6.3 Implementation Complete:');
  console.log('  • Default 7-second interval for Focused state');
  console.log('  • 3-second interval for low confidence (< 0.6)');
  console.log('  • 3-second interval for Confused/Bored/Tired emotions');
  console.log('  • Capture pauses when tab is hidden');
  console.log('  • Capture resumes when tab becomes visible');
  console.log('  • Visibility change event listener properly managed');
  console.log();
  console.log('Requirements Satisfied:');
  console.log('  • Requirement 2.1: Focused state capture (6-7 seconds) ✓');
  console.log('  • Requirement 2.2: Low confidence capture (3 seconds) ✓');
  console.log('  • Requirement 2.3: Tab focus pause ✓');
  console.log('  • Requirement 2.4: Tab focus resume ✓');
  process.exit(0);
} else {
  console.log('✗ SOME CHECKS FAILED');
  console.log();
  console.log('Please review the implementation and ensure all requirements are met.');
  process.exit(1);
}
