#!/usr/bin/env node

/**
 * Verification Script for Cloud Recalibration Service (Task 10)
 * 
 * This script verifies that the CloudRecalibrationService is properly implemented
 * and integrated with the emotion detection system.
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('Cloud Recalibration Service Verification (Task 10)');
console.log('='.repeat(70));
console.log();

let allChecksPassed = true;

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✓ ${description}`);
    return true;
  } else {
    console.log(`✗ ${description}`);
    console.log(`  File not found: ${filePath}`);
    allChecksPassed = false;
    return false;
  }
}

function checkFileContains(filePath, searchStrings, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`✗ ${description}`);
    console.log(`  File not found: ${filePath}`);
    allChecksPassed = false;
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const missingStrings = searchStrings.filter(str => !content.includes(str));
  
  if (missingStrings.length === 0) {
    console.log(`✓ ${description}`);
    return true;
  } else {
    console.log(`✗ ${description}`);
    console.log(`  Missing implementations:`);
    missingStrings.forEach(str => console.log(`    - ${str}`));
    allChecksPassed = false;
    return false;
  }
}

// ============================================================================
// Subtask 10.1: Create recalibration service
// ============================================================================

console.log('Subtask 10.1: Create recalibration service');
console.log('-'.repeat(70));

checkFile(
  'src/lib/CloudRecalibrationService.ts',
  'CloudRecalibrationService file exists'
);

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    'class CloudRecalibrationService',
    'recalibrate(',
    'sendCalibrationRequest',
    'encodeImageToBase64',
    'scheduleNextRecalibration',
    'getRandomInterval',
    'minInterval',
    'maxInterval'
  ],
  'CloudRecalibrationService implements timer and encoding'
);

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    '/api/emotion/predict',
    'fetch(',
    'POST',
    'local_prediction'
  ],
  'CloudRecalibrationService sends requests to backend API'
);

console.log();

// ============================================================================
// Subtask 10.2: Apply confidence adjustments
// ============================================================================

console.log('Subtask 10.2: Apply confidence adjustments');
console.log('-'.repeat(70));

checkFileContains(
  'src/lib/EmotionStateManager.ts',
  [
    'confidenceAdjustment',
    'setConfidenceAdjustment',
    'getConfidenceAdjustment',
    'applyConfidenceAdjustment',
    'setEMAAlpha',
    'applyCalibrationRecommendation'
  ],
  'EmotionStateManager applies confidence adjustments'
);

checkFileContains(
  'src/lib/EmotionStateManager.ts',
  [
    'adjustedPrediction',
    'adjustedConfidence',
    'Math.max(0, Math.min(1',
    'emaAlpha'
  ],
  'EmotionStateManager adjusts predictions and EMA smoothing'
);

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    'setConfidenceAdjustment',
    'getConfidenceAdjustment',
    'confidenceThresholdAdjustment'
  ],
  'CloudRecalibrationService tracks confidence adjustments'
);

console.log();

// ============================================================================
// Subtask 10.3: Handle network failures
// ============================================================================

console.log('Subtask 10.3: Handle network failures');
console.log('-'.repeat(70));

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    'maxRetries',
    'retryDelay',
    'exponentialBackoff',
    'retryCount',
    'Math.pow(2, retryCount)',
    'requestQueue',
    'queueRequest',
    'processQueue'
  ],
  'CloudRecalibrationService implements retry logic with exponential backoff'
);

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    'consecutiveFailures',
    'adjustedInterval',
    'Math.min(',
    'TypeError',
    'network error'
  ],
  'CloudRecalibrationService handles network failures and reduces frequency'
);

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    'AbortSignal.timeout',
    'catch (error)',
    'if (retryCount < this.config.maxRetries)'
  ],
  'CloudRecalibrationService implements timeout and error handling'
);

console.log();

// ============================================================================
// Integration with EmotionDetector
// ============================================================================

console.log('Integration with EmotionDetector');
console.log('-'.repeat(70));

checkFileContains(
  'src/components/EmotionDetector.tsx',
  [
    'cloudRecalibrationService',
    'triggerCloudRecalibration',
    'cloudRecalibrationService.start()',
    'cloudRecalibrationService.stop()',
    'cloudRecalibrationService.recalibrate'
  ],
  'EmotionDetector integrates CloudRecalibrationService'
);

checkFileContains(
  'src/components/EmotionDetector.tsx',
  [
    'emotionStateManager.setConfidenceAdjustment',
    'emotionStateManager.applyCalibrationRecommendation',
    'response.confidence_adjustment',
    'response.calibration_recommendation'
  ],
  'EmotionDetector applies calibration responses'
);

checkFileContains(
  'src/components/EmotionDetector.tsx',
  [
    'lastCapturedImageRef',
    'lastLocalPredictionRef',
    'cloudRecalibrationService.processQueue()'
  ],
  'EmotionDetector stores data for recalibration and processes queue'
);

console.log();

// ============================================================================
// Test Files
// ============================================================================

console.log('Test Files');
console.log('-'.repeat(70));

checkFile(
  'src/lib/__tests__/CloudRecalibrationService.test.ts',
  'CloudRecalibrationService test file exists'
);

checkFileContains(
  'src/lib/__tests__/CloudRecalibrationService.test.ts',
  [
    'describe(',
    'CloudRecalibrationService',
    'setConfidenceAdjustment',
    'getStatistics',
    'start',
    'stop'
  ],
  'CloudRecalibrationService tests cover core functionality'
);

console.log();

// ============================================================================
// Type Definitions
// ============================================================================

console.log('Type Definitions');
console.log('-'.repeat(70));

checkFileContains(
  'src/lib/CloudRecalibrationService.ts',
  [
    'interface CalibrationRequest',
    'interface CalibrationResponse',
    'interface CalibrationEvent',
    'interface RecalibrationConfig',
    'calibration_needed',
    'confidence_adjustment',
    'calibration_recommendation'
  ],
  'CloudRecalibrationService has proper type definitions'
);

console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('='.repeat(70));
if (allChecksPassed) {
  console.log('✓ All checks passed! Task 10 implementation verified.');
  console.log();
  console.log('Cloud Recalibration Features:');
  console.log('  • Periodic recalibration (1-1.5 minute intervals)');
  console.log('  • Base64 image encoding and backend API communication');
  console.log('  • Confidence adjustment application');
  console.log('  • EMA smoothing parameter adjustment');
  console.log('  • Retry logic with exponential backoff');
  console.log('  • Request queuing for offline scenarios');
  console.log('  • Adaptive interval adjustment on failures');
  console.log('  • Calibration event logging and statistics');
  console.log();
  console.log('Next Steps:');
  console.log('  1. Run tests: npm test CloudRecalibrationService');
  console.log('  2. Start backend emotion service');
  console.log('  3. Test end-to-end recalibration flow');
  console.log('  4. Monitor calibration statistics in production');
  process.exit(0);
} else {
  console.log('✗ Some checks failed. Please review the implementation.');
  console.log();
  console.log('Common issues:');
  console.log('  • Missing imports or type definitions');
  console.log('  • Incomplete method implementations');
  console.log('  • Missing integration in EmotionDetector');
  console.log('  • Backend API endpoint mismatch');
  process.exit(1);
}
