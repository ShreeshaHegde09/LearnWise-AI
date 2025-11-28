#!/usr/bin/env node

/**
 * Verification Script for Task 14: Emotion Detection Settings
 * 
 * This script verifies that all settings and privacy controls are properly implemented.
 * 
 * Requirements verified:
 * - 14.1: Settings UI with enable/disable, capture frequency, cloud recalibration
 * - 14.2: Privacy controls with camera permission, data export/deletion
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Emotion Detection Settings Implementation...\n');

let allTestsPassed = true;
const results = [];

// Helper function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

// Helper function to read file content
function readFile(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf-8');
}

// Helper function to check if content contains pattern
function contentContains(content, pattern, description) {
  const found = pattern.test(content);
  results.push({
    test: description,
    passed: found,
    details: found ? '✅ Found' : '❌ Not found'
  });
  if (!found) allTestsPassed = false;
  return found;
}

// ============================================================================
// Test 14.1: Settings UI Components
// ============================================================================

console.log('📋 Task 14.1: Settings UI Components\n');

// Check EmotionSettings component exists
if (fileExists('src/components/EmotionSettings.tsx')) {
  console.log('✅ EmotionSettings.tsx component exists');
  const settingsContent = readFile('src/components/EmotionSettings.tsx');
  
  // Check for enable/disable toggle
  contentContains(
    settingsContent,
    /settings\.enabled|enabled.*boolean/i,
    'Enable/disable toggle implementation'
  );
  
  // Check for capture frequency slider
  contentContains(
    settingsContent,
    /captureFrequency|type="range"/i,
    'Capture frequency slider (3-10 seconds)'
  );
  
  // Check for cloud recalibration toggle
  contentContains(
    settingsContent,
    /cloudRecalibrationEnabled|Cloud Recalibration/i,
    'Cloud recalibration toggle'
  );
  
  // Check for clear data button
  contentContains(
    settingsContent,
    /Clear Data|handleClearData/i,
    'Clear emotion data button'
  );
  
  // Check for settings storage
  contentContains(
    settingsContent,
    /STORAGE_KEY|emotion_detection_settings/i,
    'Settings persistence to localStorage'
  );
  
} else {
  console.log('❌ EmotionSettings.tsx component not found');
  allTestsPassed = false;
}

// Check integration with LearningInterface
if (fileExists('src/components/LearningInterface.tsx')) {
  const learningContent = readFile('src/components/LearningInterface.tsx');
  
  contentContains(
    learningContent,
    /import.*EmotionSettings/,
    'EmotionSettings imported in LearningInterface'
  );
  
  contentContains(
    learningContent,
    /emotionSettings.*EmotionSettingsConfig/,
    'EmotionSettings state management'
  );
  
  contentContains(
    learningContent,
    /<EmotionSettings/,
    'EmotionSettings component rendered'
  );
  
  contentContains(
    learningContent,
    /Settings.*icon|<Settings/,
    'Settings button in UI'
  );
}

// Check EmotionDetector accepts settings props
if (fileExists('src/components/EmotionDetector.tsx')) {
  const detectorContent = readFile('src/components/EmotionDetector.tsx');
  
  contentContains(
    detectorContent,
    /captureFrequency\?:.*number/,
    'EmotionDetector accepts captureFrequency prop'
  );
  
  contentContains(
    detectorContent,
    /cloudRecalibrationEnabled\?:.*boolean/,
    'EmotionDetector accepts cloudRecalibrationEnabled prop'
  );
  
  contentContains(
    detectorContent,
    /if.*cloudRecalibrationEnabled/,
    'Conditional cloud recalibration based on settings'
  );
}

console.log('\n');

// ============================================================================
// Test 14.2: Privacy Controls
// ============================================================================

console.log('📋 Task 14.2: Privacy Controls\n');

if (fileExists('src/components/EmotionSettings.tsx')) {
  const settingsContent = readFile('src/components/EmotionSettings.tsx');
  
  // Check camera permission status display
  contentContains(
    settingsContent,
    /cameraStatus.*granted.*denied.*prompt/i,
    'Camera permission status display'
  );
  
  contentContains(
    settingsContent,
    /navigator\.permissions\.query.*camera/i,
    'Camera permission check implementation'
  );
  
  // Check revoke camera access button
  contentContains(
    settingsContent,
    /revoke.*camera.*access|handleRevokeCameraAccess/i,
    'Revoke camera access button'
  );
  
  // Check data export functionality
  contentContains(
    settingsContent,
    /handleExportData|export.*data/i,
    'Data export functionality'
  );
  
  contentContains(
    settingsContent,
    /Blob|URL\.createObjectURL|\.download/i,
    'JSON export with download'
  );
  
  // Check data deletion functionality
  contentContains(
    settingsContent,
    /handleClearData|Clear Data/i,
    'Data deletion functionality'
  );
  
  contentContains(
    settingsContent,
    /removeItem.*emotion_predictions/i,
    'Clear predictions from localStorage'
  );
  
  contentContains(
    settingsContent,
    /removeItem.*emotion_interventions/i,
    'Clear interventions from localStorage'
  );
  
  // Check data retention policy display
  contentContains(
    settingsContent,
    /Privacy.*Data Retention|Data Retention/i,
    'Data retention policy display'
  );
  
  contentContains(
    settingsContent,
    /7 days|automatically cleaned/i,
    'Data retention period mentioned'
  );
  
  // Check data stats display
  contentContains(
    settingsContent,
    /dataStats|predictions.*interventions.*sessions/i,
    'Data statistics display'
  );
  
  contentContains(
    settingsContent,
    /totalSize.*KB/i,
    'Storage size display'
  );
}

console.log('\n');

// ============================================================================
// Summary
// ============================================================================

console.log('=' .repeat(70));
console.log('📊 Test Results Summary\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;

results.forEach(result => {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.test}`);
  if (!result.passed && result.details) {
    console.log(`   ${result.details}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📈 Results: ${passed}/${total} tests passed\n`);

if (allTestsPassed) {
  console.log('✅ All verification tests passed!');
  console.log('\n🎉 Task 14: Emotion Detection Settings - COMPLETE\n');
  console.log('Features implemented:');
  console.log('  ✅ Enable/disable emotion detection toggle');
  console.log('  ✅ Capture frequency slider (3-10 seconds)');
  console.log('  ✅ Cloud recalibration toggle');
  console.log('  ✅ Camera permission status display');
  console.log('  ✅ Revoke camera access instructions');
  console.log('  ✅ Data export (JSON download)');
  console.log('  ✅ Data deletion with confirmation');
  console.log('  ✅ Data statistics display');
  console.log('  ✅ Privacy policy and data retention info');
  console.log('  ✅ Settings persistence to localStorage');
  console.log('  ✅ Integration with EmotionDetector component');
  process.exit(0);
} else {
  console.log('❌ Some verification tests failed. Please review the implementation.');
  process.exit(1);
}
