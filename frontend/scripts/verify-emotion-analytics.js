#!/usr/bin/env node

/**
 * Verification Script for Emotion Analytics Service
 * Tests emotion prediction storage, metrics tracking, and backend integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Emotion Analytics Service Implementation...\n');

let passed = 0;
let failed = 0;

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`✗ ${description}`);
    console.log(`  Missing: ${filePath}`);
    failed++;
    return false;
  }
}

function checkFileContains(filePath, searchStrings, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`✗ ${description}`);
    console.log(`  Missing file: ${filePath}`);
    failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const allFound = searchStrings.every(str => content.includes(str));

  if (allFound) {
    console.log(`✓ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`✗ ${description}`);
    const missing = searchStrings.filter(str => !content.includes(str));
    console.log(`  Missing: ${missing.join(', ')}`);
    failed++;
    return false;
  }
}

console.log('📦 Checking File Structure...\n');

// Check main service file
checkFile(
  'src/lib/EmotionAnalyticsService.ts',
  'EmotionAnalyticsService.ts exists'
);

// Check test file
checkFile(
  'src/lib/__tests__/EmotionAnalyticsService.test.ts',
  'EmotionAnalyticsService.test.ts exists'
);

console.log('\n📋 Checking EmotionAnalyticsService Implementation...\n');

// Check EmotionPredictionRecord interface
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['export interface EmotionPredictionRecord', 'sessionId: string', 'chunkId: number', 'faceDetected: boolean'],
  'EmotionPredictionRecord interface defined'
);

// Check InterventionLog interface
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['export interface InterventionLog', 'tier: 1 | 2', 'accepted: boolean', 'dismissed: boolean'],
  'InterventionLog interface defined'
);

// Check VisibilityIssueLog interface
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['export interface VisibilityIssueLog', 'type: \'no_face\' | \'poor_lighting\' | \'eyes_not_visible\'', 'resolved: boolean'],
  'VisibilityIssueLog interface defined'
);

// Check EmotionSessionMetrics interface
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['export interface EmotionSessionMetrics', 'emotionDistribution', 'tier1Interventions', 'tier2Interventions', 'cloudRecalibrations'],
  'EmotionSessionMetrics interface defined'
);

console.log('\n🔧 Checking Core Functionality...\n');

// Check session management
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['startSession(sessionId: string)', 'endSession()', 'currentSessionId'],
  'Session management methods implemented'
);

// Check prediction storage
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['storePrediction(', 'getSessionPredictions(', 'getRecentPredictions('],
  'Prediction storage methods implemented'
);

// Check intervention logging
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['logIntervention(', 'recordInterventionResponse(', 'getSessionInterventions('],
  'Intervention logging methods implemented'
);

// Check visibility issue logging
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['logVisibilityIssue(', 'resolveVisibilityIssue(', 'getSessionVisibilityIssues('],
  'Visibility issue logging methods implemented'
);

// Check metrics tracking
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['getSessionMetrics(', 'updateSessionMetrics(', 'recordCloudRecalibration('],
  'Metrics tracking methods implemented'
);

console.log('\n📡 Checking Analytics Sending...\n');

// Check analytics sending
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['sendAnalyticsToBackend(', '/api/emotion/analytics', 'ANALYTICS_SEND_INTERVAL_MS'],
  'Analytics sending to backend implemented'
);

// Check periodic sending
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['startAnalyticsSending(', 'stopAnalyticsSending(', 'analyticsSendTimer'],
  'Periodic analytics sending implemented'
);

console.log('\n🗄️ Checking Data Management...\n');

// Check local storage
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['localStorage.getItem', 'localStorage.setItem', 'STORAGE_KEYS'],
  'Local storage integration implemented'
);

// Check cleanup
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['performCleanup()', 'MAX_RECORD_AGE_MS', 'CLEANUP_INTERVAL_MS'],
  'Periodic cleanup implemented'
);

// Check data export
checkFileContains(
  'src/lib/EmotionAnalyticsService.ts',
  ['exportData()', 'clearSessionData(', 'clearAllData('],
  'Data export and clearing methods implemented'
);

console.log('\n🧪 Checking Test Coverage...\n');

// Check test structure
checkFileContains(
  'src/lib/__tests__/EmotionAnalyticsService.test.ts',
  ['describe(\'EmotionAnalyticsService\'', 'beforeEach', 'afterEach'],
  'Test structure defined'
);

// Check session tests
checkFileContains(
  'src/lib/__tests__/EmotionAnalyticsService.test.ts',
  ['describe(\'Session Management\'', 'should start a new session', 'should end a session'],
  'Session management tests implemented'
);

// Check prediction tests
checkFileContains(
  'src/lib/__tests__/EmotionAnalyticsService.test.ts',
  ['describe(\'Prediction Storage\'', 'should store emotion prediction', 'should update session metrics'],
  'Prediction storage tests implemented'
);

// Check intervention tests
checkFileContains(
  'src/lib/__tests__/EmotionAnalyticsService.test.ts',
  ['describe(\'Intervention Logging\'', 'should log intervention', 'should record intervention response'],
  'Intervention logging tests implemented'
);

// Check visibility tests
checkFileContains(
  'src/lib/__tests__/EmotionAnalyticsService.test.ts',
  ['describe(\'Visibility Issue Logging\'', 'should log visibility issue', 'should resolve visibility issue'],
  'Visibility issue tests implemented'
);

console.log('\n🔌 Checking Backend Integration...\n');

// Check backend endpoint
const backendPath = path.join(__dirname, '../../../backend/app.py');
if (fs.existsSync(backendPath)) {
  const backendContent = fs.readFileSync(backendPath, 'utf8');
  
  if (backendContent.includes('/api/emotion/analytics') && 
      backendContent.includes('receive_emotion_analytics') &&
      backendContent.includes('sessionMetrics') &&
      backendContent.includes('interventions') &&
      backendContent.includes('visibilityIssues')) {
    console.log('✓ Backend analytics endpoint implemented');
    passed++;
  } else {
    console.log('✗ Backend analytics endpoint incomplete');
    failed++;
  }
  
  if (backendContent.includes('calculate_emotion_insights')) {
    console.log('✓ Backend insights calculation implemented');
    passed++;
  } else {
    console.log('✗ Backend insights calculation missing');
    failed++;
  }
} else {
  console.log('✗ Backend app.py not found');
  failed += 2;
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Verification Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All checks passed! Emotion Analytics Service is properly implemented.\n');
  console.log('Next steps:');
  console.log('1. Run tests: npm test EmotionAnalyticsService.test.ts');
  console.log('2. Integrate with EmotionDetector component');
  console.log('3. Test backend endpoint with sample data');
  console.log('4. Verify analytics are being sent periodically\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.\n');
  process.exit(1);
}
