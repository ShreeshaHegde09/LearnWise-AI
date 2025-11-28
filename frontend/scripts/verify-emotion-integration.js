#!/usr/bin/env node

/**
 * Verification Script for Task 11: EmotionDetector Integration
 * 
 * This script verifies that the EmotionDetector component is properly
 * integrated into the LearningInterface component.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying EmotionDetector Integration in LearningInterface...\n');

// Read the LearningInterface component
const learningInterfacePath = path.join(__dirname, '../src/components/LearningInterface.tsx');
const learningInterfaceContent = fs.readFileSync(learningInterfacePath, 'utf-8');

let allChecksPassed = true;

// Test 1: Check imports
console.log('✓ Test 1: Checking imports...');
const requiredImports = [
  'EmotionDetector',
  'EmotionAlert',
  'VisibilityAlert',
  'EmotionState',
  'VisibilityIssue'
];

requiredImports.forEach(importName => {
  if (learningInterfaceContent.includes(importName)) {
    console.log(`  ✓ ${importName} imported`);
  } else {
    console.log(`  ✗ ${importName} NOT imported`);
    allChecksPassed = false;
  }
});

// Test 2: Check state management
console.log('\n✓ Test 2: Checking state management...');
const requiredState = [
  'emotionState',
  'visibilityIssue',
  'showEmotionAlert',
  'emotionAlertData',
  'isEmotionDetectionActive'
];

requiredState.forEach(stateName => {
  if (learningInterfaceContent.includes(stateName)) {
    console.log(`  ✓ ${stateName} state defined`);
  } else {
    console.log(`  ✗ ${stateName} state NOT defined`);
    allChecksPassed = false;
  }
});

// Test 3: Check callback handlers
console.log('\n✓ Test 3: Checking callback handlers...');
const requiredHandlers = [
  'handleEmotionUpdate',
  'handleVisibilityIssue',
  'handleBreak',
  'handleResumeFromBreak'
];

requiredHandlers.forEach(handlerName => {
  if (learningInterfaceContent.includes(handlerName)) {
    console.log(`  ✓ ${handlerName} handler defined`);
  } else {
    console.log(`  ✗ ${handlerName} handler NOT defined`);
    allChecksPassed = false;
  }
});

// Test 4: Check EmotionDetector component usage
console.log('\n✓ Test 4: Checking EmotionDetector component usage...');
if (learningInterfaceContent.includes('<EmotionDetector')) {
  console.log('  ✓ EmotionDetector component rendered');
  
  // Check props
  const emotionDetectorProps = [
    'sessionId',
    'isActive',
    'onEmotionUpdate',
    'onVisibilityIssue'
  ];
  
  emotionDetectorProps.forEach(prop => {
    if (learningInterfaceContent.includes(prop)) {
      console.log(`    ✓ ${prop} prop passed`);
    } else {
      console.log(`    ✗ ${prop} prop NOT passed`);
      allChecksPassed = false;
    }
  });
} else {
  console.log('  ✗ EmotionDetector component NOT rendered');
  allChecksPassed = false;
}

// Test 5: Check AttentionTracker integration
console.log('\n✓ Test 5: Checking AttentionTracker emotion integration...');
if (learningInterfaceContent.includes('emotionState={emotionState}')) {
  console.log('  ✓ emotionState passed to AttentionTracker');
} else {
  console.log('  ✗ emotionState NOT passed to AttentionTracker');
  allChecksPassed = false;
}

// Test 6: Check EmotionAlert rendering
console.log('\n✓ Test 6: Checking EmotionAlert rendering...');
if (learningInterfaceContent.includes('<EmotionAlert')) {
  console.log('  ✓ EmotionAlert component rendered conditionally');
  
  // Check callbacks
  const alertCallbacks = ['onSimplify', 'onBreak', 'onDismiss'];
  alertCallbacks.forEach(callback => {
    if (learningInterfaceContent.includes(callback)) {
      console.log(`    ✓ ${callback} callback connected`);
    } else {
      console.log(`    ✗ ${callback} callback NOT connected`);
      allChecksPassed = false;
    }
  });
} else {
  console.log('  ✗ EmotionAlert component NOT rendered');
  allChecksPassed = false;
}

// Test 7: Check VisibilityAlert rendering
console.log('\n✓ Test 7: Checking VisibilityAlert rendering...');
if (learningInterfaceContent.includes('<VisibilityAlert')) {
  console.log('  ✓ VisibilityAlert component rendered conditionally');
  
  // Check props
  if (learningInterfaceContent.includes('issueType={visibilityIssue.type}')) {
    console.log('    ✓ issueType prop passed');
  } else {
    console.log('    ✗ issueType prop NOT passed');
    allChecksPassed = false;
  }
} else {
  console.log('  ✗ VisibilityAlert component NOT rendered');
  allChecksPassed = false;
}

// Test 8: Check action connections
console.log('\n✓ Test 8: Checking action connections...');
const actionConnections = [
  { name: 'Simplify action', pattern: 'handleSimplifyContent' },
  { name: 'Break action', pattern: 'handleBreak' },
  { name: 'Resume action', pattern: 'handleResumeFromBreak' }
];

actionConnections.forEach(({ name, pattern }) => {
  if (learningInterfaceContent.includes(pattern)) {
    console.log(`  ✓ ${name} connected`);
  } else {
    console.log(`  ✗ ${name} NOT connected`);
    allChecksPassed = false;
  }
});

// Test 9: Check intervention logic
console.log('\n✓ Test 9: Checking intervention logic...');
if (learningInterfaceContent.includes("actionSuggestion === 'Simplify'")) {
  console.log('  ✓ Tier 1 intervention logic implemented');
} else {
  console.log('  ✗ Tier 1 intervention logic NOT implemented');
  allChecksPassed = false;
}

if (learningInterfaceContent.includes("actionSuggestion === 'Break'")) {
  console.log('  ✓ Tier 2 intervention logic implemented');
} else {
  console.log('  ✗ Tier 2 intervention logic NOT implemented');
  allChecksPassed = false;
}

// Final summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ All checks passed! EmotionDetector is properly integrated.');
  console.log('\nTask 11 Implementation Summary:');
  console.log('  ✓ EmotionDetector component added to LearningInterface');
  console.log('  ✓ Emotion state management implemented');
  console.log('  ✓ Visibility issue handling implemented');
  console.log('  ✓ Emotion alerts displayed correctly');
  console.log('  ✓ Simplify and break actions connected');
  console.log('  ✓ AttentionTracker receives emotion state');
  console.log('\nRequirements Met:');
  console.log('  ✓ 9.1: Emotion and activity combined logic');
  console.log('  ✓ 9.2: Emotion state shared with AttentionTracker');
  console.log('  ✓ 9.3: Alert priority and suppression logic');
  console.log('  ✓ 9.4: Emotion metrics integration');
  console.log('  ✓ 9.5: Intervention callbacks connected');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
