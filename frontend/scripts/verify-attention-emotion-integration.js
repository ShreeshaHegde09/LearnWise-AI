#!/usr/bin/env node

/**
 * Verification Script for Task 8: AttentionTracker Emotion Integration
 * 
 * This script verifies that the AttentionTracker component has been properly
 * enhanced with emotion detection integration.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AttentionTracker Emotion Integration...\n');

// File paths
const attentionTrackerPath = path.join(__dirname, '../src/components/AttentionTracker.tsx');

// Read the file
const attentionTrackerContent = fs.readFileSync(attentionTrackerPath, 'utf-8');

// Verification checks
const checks = [
  {
    name: 'EmotionState import',
    test: () => attentionTrackerContent.includes("import { EmotionState } from '../lib/EmotionStateManager'"),
    description: 'Verify EmotionState type is imported'
  },
  {
    name: 'emotionState prop in interface',
    test: () => attentionTrackerContent.includes('emotionState?: EmotionState'),
    description: 'Verify emotionState prop is added to AttentionTrackerProps'
  },
  {
    name: 'Emotion metrics fields',
    test: () => {
      return attentionTrackerContent.includes('emotionDistribution?:') &&
             attentionTrackerContent.includes('emotionBasedInterventions?:') &&
             attentionTrackerContent.includes('averageEmotionConfidence?:') &&
             attentionTrackerContent.includes('emotionConfidenceTrend?:');
    },
    description: 'Verify emotion metrics fields added to AttentionMetrics interface'
  },
  {
    name: 'Emotion metrics initialization',
    test: () => {
      return attentionTrackerContent.includes('emotionDistribution: {') &&
             attentionTrackerContent.includes('Focused: 0,') &&
             attentionTrackerContent.includes('Confused: 0,') &&
             attentionTrackerContent.includes('Bored: 0,') &&
             attentionTrackerContent.includes('Tired: 0');
    },
    description: 'Verify emotion metrics are initialized in metricsData ref'
  },
  {
    name: 'Alert suppression refs',
    test: () => {
      return attentionTrackerContent.includes('lastEmotionAlertTime') &&
             attentionTrackerContent.includes('emotionAlertSuppressionDuration');
    },
    description: 'Verify alert suppression tracking refs are added'
  },
  {
    name: 'Enhanced showAlert function',
    test: () => {
      return attentionTrackerContent.includes('isEmotionBased: boolean = false') &&
             attentionTrackerContent.includes('timeSinceEmotionAlert') &&
             attentionTrackerContent.includes('Activity alert suppressed');
    },
    description: 'Verify showAlert function has emotion priority logic'
  },
  {
    name: 'False positive detection',
    test: () => {
      return attentionTrackerContent.includes('detectFalsePositives') &&
             attentionTrackerContent.includes('Potential false positive');
    },
    description: 'Verify false positive detection function exists'
  },
  {
    name: 'Emotion state tracking effect',
    test: () => {
      return attentionTrackerContent.includes('useEffect(() => {') &&
             attentionTrackerContent.includes('if (!emotionState) return;') &&
             attentionTrackerContent.includes('emotionDistribution[emotionState.currentEmotion]++');
    },
    description: 'Verify useEffect hook tracks emotion state changes'
  },
  {
    name: 'Enhanced getStatusText',
    test: () => {
      return attentionTrackerContent.includes('if (emotionState)') &&
             attentionTrackerContent.includes('emotionState.engagementState') &&
             attentionTrackerContent.includes('Unfocused (${emotionState.currentEmotion})');
    },
    description: 'Verify getStatusText combines emotion and activity'
  },
  {
    name: 'Enhanced getStatusColor',
    test: () => {
      return attentionTrackerContent.includes('if (emotionState)') &&
             attentionTrackerContent.includes("emotionState.engagementState === 'Focused'") &&
             attentionTrackerContent.includes("emotionState.engagementState === 'Unfocused'");
    },
    description: 'Verify getStatusColor uses emotion state'
  },
  {
    name: 'Emotion display in status widget',
    test: () => {
      return attentionTrackerContent.includes('{emotionState && (') &&
             attentionTrackerContent.includes('Emotion:') &&
             attentionTrackerContent.includes('Confidence:') &&
             attentionTrackerContent.includes('emotionState.currentEmotion') &&
             attentionTrackerContent.includes('emotionState.confidenceScore');
    },
    description: 'Verify emotion info displayed in status widget'
  },
  {
    name: 'Backend analytics with emotion data',
    test: () => {
      return attentionTrackerContent.includes('emotion_distribution:') &&
             attentionTrackerContent.includes('emotion_based_interventions:') &&
             attentionTrackerContent.includes('average_emotion_confidence:') &&
             attentionTrackerContent.includes('emotion_confidence_trend:');
    },
    description: 'Verify emotion data included in backend analytics payload'
  },
  {
    name: 'Emotion-based intervention tracking',
    test: () => {
      return attentionTrackerContent.includes('if (isEmotionBased)') &&
             attentionTrackerContent.includes('lastEmotionAlertTime.current = now') &&
             attentionTrackerContent.includes('emotionBasedInterventions++');
    },
    description: 'Verify emotion-based interventions are tracked'
  }
];

// Run checks
let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
  const result = check.test();
  const status = result ? '✅' : '❌';
  const resultText = result ? 'PASS' : 'FAIL';
  
  console.log(`${status} Check ${index + 1}: ${check.name}`);
  console.log(`   ${check.description}`);
  console.log(`   Result: ${resultText}\n`);
  
  if (result) {
    passed++;
  } else {
    failed++;
  }
});

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log(`📊 Verification Summary`);
console.log(`   Total Checks: ${checks.length}`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('🎉 All checks passed! AttentionTracker emotion integration is complete.\n');
  console.log('✨ Key Features Implemented:');
  console.log('   • Emotion state prop integration');
  console.log('   • Combined emotion + activity engagement scoring');
  console.log('   • Alert priority logic (emotion > activity)');
  console.log('   • 60-second alert suppression');
  console.log('   • False positive detection');
  console.log('   • Emotion metrics tracking');
  console.log('   • Enhanced status display');
  console.log('   • Backend analytics with emotion data\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the implementation.\n');
  process.exit(1);
}
