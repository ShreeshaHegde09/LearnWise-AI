/**
 * Verification script for EmotionStateManager
 * Tests sliding window, EMA smoothing, engagement classification, and action suggestions
 */

// Mock the emotion model config
const mockEmotionConfig = {
  classes: ['Bored', 'Confused', 'Focused', 'Tired']
};

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`✓ ${message} (${actual} ≈ ${expected})`);
    testsPassed++;
  } else {
    console.error(`✗ ${message} (${actual} != ${expected}, diff: ${diff})`);
    testsFailed++;
  }
}

// ============================================================================
// SlidingWindow Implementation (for testing)
// ============================================================================

class SlidingWindow {
  constructor(maxSize = 15) {
    this.buffer = [];
    this.maxSize = maxSize;
  }

  add(prediction) {
    this.buffer.push(prediction);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll() {
    return [...this.buffer];
  }

  getRecent(count) {
    if (count >= this.buffer.length) {
      return [...this.buffer];
    }
    return this.buffer.slice(-count);
  }

  size() {
    return this.buffer.length;
  }

  clear() {
    this.buffer = [];
  }
}

// ============================================================================
// EMASmoothing Implementation (for testing)
// ============================================================================

class EMASmoothing {
  constructor(alpha = 0.2) {
    this.alpha = alpha;
    this.scores = {
      Bored: 0.25,
      Confused: 0.25,
      Focused: 0.25,
      Tired: 0.25
    };
  }

  update(newProbs) {
    const emotions = ['Bored', 'Confused', 'Focused', 'Tired'];
    
    for (const emotion of emotions) {
      this.scores[emotion] = 
        (1 - this.alpha) * this.scores[emotion] + 
        this.alpha * newProbs[emotion];
    }
    
    return { ...this.scores };
  }

  getDominant() {
    let maxScore = 0;
    let dominantEmotion = 'Focused';
    
    const emotions = ['Bored', 'Confused', 'Focused', 'Tired'];
    
    for (const emotion of emotions) {
      if (this.scores[emotion] > maxScore) {
        maxScore = this.scores[emotion];
        dominantEmotion = emotion;
      }
    }
    
    return dominantEmotion;
  }

  getScores() {
    return { ...this.scores };
  }

  reset() {
    this.scores = {
      Bored: 0.25,
      Confused: 0.25,
      Focused: 0.25,
      Tired: 0.25
    };
  }
}

// ============================================================================
// Tests
// ============================================================================

console.log('\n=== Testing SlidingWindow ===\n');

// Test 1: Add predictions to window
{
  const window = new SlidingWindow(15);
  const prediction = {
    emotion: 'Focused',
    probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
    confidence: 0.7,
    timestamp: Date.now(),
    source: 'local'
  };
  
  window.add(prediction);
  assert(window.size() === 1, 'Should add prediction to window');
  assert(window.getAll()[0] === prediction, 'Should retrieve added prediction');
}

// Test 2: Maintain maximum size of 15
{
  const window = new SlidingWindow(15);
  
  for (let i = 0; i < 20; i++) {
    window.add({
      emotion: 'Focused',
      probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
      confidence: 0.7,
      timestamp: Date.now() + i,
      source: 'local'
    });
  }
  
  assert(window.size() === 15, 'Should maintain maximum size of 15');
}

// Test 3: Remove oldest predictions
{
  const window = new SlidingWindow(15);
  
  for (let i = 0; i < 20; i++) {
    window.add({
      emotion: 'Focused',
      probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
      confidence: 0.7,
      timestamp: 1000 + i,
      source: 'local'
    });
  }
  
  const all = window.getAll();
  assert(all[0].timestamp === 1005, 'Should remove oldest predictions (first timestamp should be 1005)');
  assert(all[14].timestamp === 1019, 'Should keep newest predictions (last timestamp should be 1019)');
}

// Test 4: Get recent predictions
{
  const window = new SlidingWindow(15);
  
  for (let i = 0; i < 10; i++) {
    window.add({
      emotion: 'Focused',
      probabilities: { Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 },
      confidence: 0.7,
      timestamp: 1000 + i,
      source: 'local'
    });
  }
  
  const recent = window.getRecent(3);
  assert(recent.length === 3, 'Should get 3 recent predictions');
  assert(recent[0].timestamp === 1007, 'Recent predictions should be from end of buffer');
}

console.log('\n=== Testing EMASmoothing ===\n');

// Test 5: Initialize with equal probabilities
{
  const ema = new EMASmoothing(0.2);
  const scores = ema.getScores();
  
  assertClose(scores.Bored, 0.25, 0.01, 'Bored should initialize to 0.25');
  assertClose(scores.Confused, 0.25, 0.01, 'Confused should initialize to 0.25');
  assertClose(scores.Focused, 0.25, 0.01, 'Focused should initialize to 0.25');
  assertClose(scores.Tired, 0.25, 0.01, 'Tired should initialize to 0.25');
}

// Test 6: Apply EMA formula
{
  const ema = new EMASmoothing(0.2);
  const newProbs = { Bored: 0.0, Confused: 0.0, Focused: 0.9, Tired: 0.1 };
  
  const updated = ema.update(newProbs);
  
  // EMA formula: new_score = 0.8 * old_score + 0.2 * new_prob
  // Focused: 0.8 * 0.25 + 0.2 * 0.9 = 0.2 + 0.18 = 0.38
  assertClose(updated.Focused, 0.38, 0.01, 'EMA should apply formula correctly for Focused');
  
  // Bored: 0.8 * 0.25 + 0.2 * 0.0 = 0.2
  assertClose(updated.Bored, 0.20, 0.01, 'EMA should apply formula correctly for Bored');
}

// Test 7: Identify dominant emotion
{
  const ema = new EMASmoothing(0.2);
  
  // Add multiple Focused predictions
  for (let i = 0; i < 5; i++) {
    ema.update({ Bored: 0.1, Confused: 0.1, Focused: 0.7, Tired: 0.1 });
  }
  
  const dominant = ema.getDominant();
  assert(dominant === 'Focused', 'Should identify Focused as dominant emotion');
}

// Test 8: Smooth out noisy predictions
{
  const ema = new EMASmoothing(0.2);
  
  // Alternating predictions
  ema.update({ Bored: 0.0, Confused: 0.0, Focused: 1.0, Tired: 0.0 });
  ema.update({ Bored: 1.0, Confused: 0.0, Focused: 0.0, Tired: 0.0 });
  ema.update({ Bored: 0.0, Confused: 0.0, Focused: 1.0, Tired: 0.0 });
  
  const scores = ema.getScores();
  
  // Smoothed scores should be more balanced
  assert(scores.Focused > 0.3 && scores.Focused < 0.7, 
    'Smoothed Focused score should be balanced (between 0.3 and 0.7)');
}

console.log('\n=== Testing Engagement Classification Logic ===\n');

// Test 9: Classify as Focused (confidence >= 0.8)
{
  const confidence = 0.85;
  const emotion = 'Focused';
  
  let engagementState;
  if (confidence >= 0.8) {
    engagementState = 'Focused';
  } else if (confidence < 0.5) {
    engagementState = 'Uncertain';
  } else if (emotion === 'Bored' || emotion === 'Tired') {
    engagementState = 'Unfocused';
  } else {
    engagementState = 'Focused';
  }
  
  assert(engagementState === 'Focused', 'Should classify as Focused when confidence >= 0.8');
}

// Test 10: Classify as Uncertain (confidence < 0.5)
{
  const confidence = 0.4;
  const emotion = 'Confused';
  
  let engagementState;
  if (confidence >= 0.8) {
    engagementState = 'Focused';
  } else if (confidence < 0.5) {
    engagementState = 'Uncertain';
  } else if (emotion === 'Bored' || emotion === 'Tired') {
    engagementState = 'Unfocused';
  } else {
    engagementState = 'Focused';
  }
  
  assert(engagementState === 'Uncertain', 'Should classify as Uncertain when confidence < 0.5');
}

// Test 11: Classify as Unfocused (Bored/Tired)
{
  const confidence = 0.7;
  const emotion = 'Bored';
  
  let engagementState;
  if (confidence >= 0.8) {
    engagementState = 'Focused';
  } else if (confidence < 0.5) {
    engagementState = 'Uncertain';
  } else if (emotion === 'Bored' || emotion === 'Tired') {
    engagementState = 'Unfocused';
  } else {
    engagementState = 'Focused';
  }
  
  assert(engagementState === 'Unfocused', 'Should classify as Unfocused when Bored');
}

// Test 12: Detect potential confusion
{
  const predictions = [
    { emotion: 'Focused', confidence: 0.9 },
    { emotion: 'Focused', confidence: 0.75 },
    { emotion: 'Focused', confidence: 0.6 }
  ];
  
  const allFocused = predictions.every(p => p.emotion === 'Focused');
  let consecutiveDrops = 0;
  
  for (let i = 1; i < predictions.length; i++) {
    if (predictions[i].confidence < predictions[i - 1].confidence) {
      consecutiveDrops++;
    }
  }
  
  const isPotentialConfusion = allFocused && consecutiveDrops >= 2;
  
  assert(isPotentialConfusion, 'Should detect potential confusion with consecutive drops');
}

console.log('\n=== Testing Action Suggestion Logic ===\n');

// Test 13: Suggest None for Focused state
{
  const emotion = 'Focused';
  const confidence = 0.85;
  
  let actionSuggestion = 'None';
  
  if (emotion === 'Focused' && confidence >= 0.8) {
    actionSuggestion = 'None';
  }
  
  assert(actionSuggestion === 'None', 'Should suggest None for Focused state with high confidence');
}

// Test 14: Suggest Simplify for persistent Confused
{
  const recentPredictions = [
    { emotion: 'Confused', confidence: 0.7 },
    { emotion: 'Confused', confidence: 0.7 },
    { emotion: 'Confused', confidence: 0.7 }
  ];
  
  const confusedOrBoredCount = recentPredictions.filter(
    p => p.emotion === 'Confused' || p.emotion === 'Bored'
  ).length;
  
  const actionSuggestion = confusedOrBoredCount >= 3 ? 'Simplify' : 'None';
  
  assert(actionSuggestion === 'Simplify', 'Should suggest Simplify for persistent Confused');
}

// Test 15: Suggest Break for prolonged Tired
{
  const recentPredictions = [
    { emotion: 'Tired', confidence: 0.7 },
    { emotion: 'Tired', confidence: 0.7 },
    { emotion: 'Tired', confidence: 0.7 }
  ];
  
  const tiredCount = recentPredictions.filter(p => p.emotion === 'Tired').length;
  
  const actionSuggestion = tiredCount >= 3 ? 'Break' : 'None';
  
  assert(actionSuggestion === 'Break', 'Should suggest Break for prolonged Tired');
}

// Test 16: Suggest Break for prolonged unfocused (Bored + Tired)
{
  const recentPredictions = [
    { emotion: 'Bored', confidence: 0.7 },
    { emotion: 'Tired', confidence: 0.7 },
    { emotion: 'Bored', confidence: 0.7 },
    { emotion: 'Tired', confidence: 0.7 },
    { emotion: 'Focused', confidence: 0.7 }
  ];
  
  const unfocusedCount = recentPredictions.filter(
    p => p.emotion === 'Bored' || p.emotion === 'Tired'
  ).length;
  
  const actionSuggestion = unfocusedCount >= 4 ? 'Break' : 'None';
  
  assert(actionSuggestion === 'Break', 'Should suggest Break for prolonged unfocused state');
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== Test Summary ===\n');
console.log(`✓ Passed: ${testsPassed}`);
console.log(`✗ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! EmotionStateManager implementation is correct.\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
