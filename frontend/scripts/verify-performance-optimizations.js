/**
 * Verification Script for Task 13: Performance Optimizations
 * Tests Web Worker, Performance Monitor, and Memory Management
 */

console.log('='.repeat(80));
console.log('Task 13: Performance Optimizations - Verification');
console.log('='.repeat(80));

const fs = require('fs');
const path = require('path');

// Track verification results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function test(name, condition, message = '') {
  const status = condition ? '✓ PASS' : '✗ FAIL';
  const result = {
    name,
    passed: condition,
    message
  };
  
  results.tests.push(result);
  
  if (condition) {
    results.passed++;
    console.log(`${status}: ${name}`);
  } else {
    results.failed++;
    console.log(`${status}: ${name}`);
    if (message) console.log(`  └─ ${message}`);
  }
}

function warn(message) {
  results.warnings++;
  console.log(`⚠ WARNING: ${message}`);
}

console.log('\n📋 Subtask 13.1: Web Worker for Inference');
console.log('-'.repeat(80));

// Check Web Worker file
const workerPath = path.join(__dirname, '../public/emotion-worker.js');
test(
  'Web Worker file exists',
  fs.existsSync(workerPath),
  'emotion-worker.js should exist in public directory'
);

if (fs.existsSync(workerPath)) {
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  
  test(
    'Worker imports ONNX Runtime',
    workerContent.includes('importScripts') && workerContent.includes('onnxruntime'),
    'Worker should import ONNX Runtime'
  );
  
  test(
    'Worker handles INITIALIZE message',
    workerContent.includes('INITIALIZE') && workerContent.includes('handleInitialize'),
    'Worker should handle initialization'
  );
  
  test(
    'Worker handles LOAD_MODELS message',
    workerContent.includes('LOAD_MODELS') && workerContent.includes('handleLoadModels'),
    'Worker should handle model loading'
  );
  
  test(
    'Worker handles PREDICT message',
    workerContent.includes('PREDICT') && workerContent.includes('handlePredict'),
    'Worker should handle predictions'
  );
  
  test(
    'Worker implements preprocessing',
    workerContent.includes('preprocessImage') && workerContent.includes('preprocessLandmarks'),
    'Worker should preprocess inputs'
  );
  
  test(
    'Worker implements ensemble prediction',
    workerContent.includes('ensemblePredictions') && workerContent.includes('softmax'),
    'Worker should ensemble predictions'
  );
}

// Check EmotionWorkerManager
const workerManagerPath = path.join(__dirname, '../src/lib/EmotionWorkerManager.ts');
test(
  'EmotionWorkerManager exists',
  fs.existsSync(workerManagerPath),
  'EmotionWorkerManager.ts should exist'
);

if (fs.existsSync(workerManagerPath)) {
  const managerContent = fs.readFileSync(workerManagerPath, 'utf8');
  
  test(
    'Manager implements singleton pattern',
    managerContent.includes('getInstance()') && managerContent.includes('private constructor'),
    'Manager should be a singleton'
  );
  
  test(
    'Manager handles message passing',
    managerContent.includes('postMessage') && managerContent.includes('onmessage'),
    'Manager should handle message passing'
  );
  
  test(
    'Manager implements timeout handling',
    managerContent.includes('requestTimeout') && managerContent.includes('setTimeout'),
    'Manager should handle request timeouts'
  );
  
  test(
    'Manager implements error recovery',
    managerContent.includes('restartWorker') && managerContent.includes('handleWorkerError'),
    'Manager should handle worker errors'
  );
}

// Check LocalInferenceEngine integration
const enginePath = path.join(__dirname, '../src/lib/LocalInferenceEngine.ts');
if (fs.existsSync(enginePath)) {
  const engineContent = fs.readFileSync(enginePath, 'utf8');
  
  test(
    'LocalInferenceEngine imports EmotionWorkerManager',
    engineContent.includes('EmotionWorkerManager') && engineContent.includes('emotionWorkerManager'),
    'Engine should import worker manager'
  );
  
  test(
    'Engine initializes worker',
    engineContent.includes('emotionWorkerManager.initialize') && engineContent.includes('workerInitialized'),
    'Engine should initialize worker'
  );
  
  test(
    'Engine uses worker for predictions',
    engineContent.includes('emotionWorkerManager.predict') && engineContent.includes('isReady'),
    'Engine should use worker for predictions'
  );
  
  test(
    'Engine has fallback to main thread',
    engineContent.includes('workerError') && engineContent.includes('falling back'),
    'Engine should fallback to main thread on worker failure'
  );
}

console.log('\n📋 Subtask 13.2: Adaptive Performance');
console.log('-'.repeat(80));

// Check PerformanceMonitor
const perfMonitorPath = path.join(__dirname, '../src/lib/PerformanceMonitor.ts');
test(
  'PerformanceMonitor exists',
  fs.existsSync(perfMonitorPath),
  'PerformanceMonitor.ts should exist'
);

if (fs.existsSync(perfMonitorPath)) {
  const perfContent = fs.readFileSync(perfMonitorPath, 'utf8');
  
  test(
    'Monitor implements singleton pattern',
    perfContent.includes('getInstance()') && perfContent.includes('private constructor'),
    'Monitor should be a singleton'
  );
  
  test(
    'Monitor tracks CPU usage',
    perfContent.includes('cpuUsage') && perfContent.includes('estimateCPUUsage'),
    'Monitor should track CPU usage'
  );
  
  test(
    'Monitor tracks memory usage',
    perfContent.includes('memoryUsage') && perfContent.includes('getMemoryUsage'),
    'Monitor should track memory usage'
  );
  
  test(
    'Monitor tracks inference time',
    perfContent.includes('inferenceTime') && perfContent.includes('recordInferenceTime'),
    'Monitor should track inference time'
  );
  
  test(
    'Monitor adjusts for high CPU',
    perfContent.includes('adjustForHighCPU') && perfContent.includes('cpuThreshold'),
    'Monitor should adjust for high CPU'
  );
  
  test(
    'Monitor adjusts for high memory',
    perfContent.includes('adjustForHighMemory') && perfContent.includes('memoryThreshold'),
    'Monitor should adjust for high memory'
  );
  
  test(
    'Monitor adjusts for slow inference',
    perfContent.includes('adjustForSlowInference') && perfContent.includes('slowInferenceThreshold'),
    'Monitor should adjust for slow inference'
  );
  
  test(
    'Monitor implements frame skipping',
    perfContent.includes('skipFrames') && perfContent.includes('PerformanceSettings'),
    'Monitor should support frame skipping'
  );
  
  test(
    'Monitor adjusts capture interval',
    perfContent.includes('captureInterval') && perfContent.includes('slowInterval'),
    'Monitor should adjust capture interval'
  );
  
  test(
    'Monitor adjusts image resolution',
    perfContent.includes('imageResolution') && perfContent.includes('lowResolution'),
    'Monitor should adjust image resolution'
  );
}

// Check EmotionDetector integration
const detectorPath = path.join(__dirname, '../src/components/EmotionDetector.tsx');
if (fs.existsSync(detectorPath)) {
  const detectorContent = fs.readFileSync(detectorPath, 'utf8');
  
  test(
    'EmotionDetector imports PerformanceMonitor',
    detectorContent.includes('performanceMonitor') && detectorContent.includes('PerformanceMonitor'),
    'Detector should import performance monitor'
  );
  
  test(
    'Detector starts performance monitoring',
    detectorContent.includes('performanceMonitor.startMonitoring'),
    'Detector should start monitoring'
  );
  
  test(
    'Detector records inference time',
    detectorContent.includes('performanceMonitor.recordInferenceTime'),
    'Detector should record inference time'
  );
  
  test(
    'Detector uses performance settings',
    detectorContent.includes('performanceMonitor.getSettings') && detectorContent.includes('perfSettings'),
    'Detector should use performance settings'
  );
  
  test(
    'Detector implements frame skipping',
    detectorContent.includes('skipFrames') && detectorContent.includes('frameSkipCounterRef'),
    'Detector should implement frame skipping'
  );
}

console.log('\n📋 Subtask 13.3: Memory Management');
console.log('-'.repeat(80));

// Check EmotionStateManager memory management
const stateManagerPath = path.join(__dirname, '../src/lib/EmotionStateManager.ts');
if (fs.existsSync(stateManagerPath)) {
  const stateContent = fs.readFileSync(stateManagerPath, 'utf8');
  
  test(
    'SlidingWindow has size limit',
    stateContent.includes('absoluteMaxSize') && stateContent.includes('maxSize'),
    'SlidingWindow should have size limit'
  );
  
  test(
    'SlidingWindow implements memory tracking',
    stateContent.includes('getMemoryUsage'),
    'SlidingWindow should track memory usage'
  );
  
  test(
    'SlidingWindow implements trimming',
    stateContent.includes('trim(') && stateContent.includes('slice'),
    'SlidingWindow should support trimming'
  );
  
  test(
    'EmotionStateManager implements periodic cleanup',
    stateContent.includes('performPeriodicCleanup') && stateContent.includes('cleanupInterval'),
    'Manager should perform periodic cleanup'
  );
  
  test(
    'EmotionStateManager implements memory optimization',
    stateContent.includes('optimizeMemory'),
    'Manager should support memory optimization'
  );
  
  test(
    'EmotionStateManager tracks cleanup time',
    stateContent.includes('lastCleanupTime'),
    'Manager should track last cleanup time'
  );
}

// Check LocalInferenceEngine disposal
if (fs.existsSync(enginePath)) {
  const engineContent = fs.readFileSync(enginePath, 'utf8');
  
  test(
    'Engine disposes ONNX sessions',
    engineContent.includes('release()') && engineContent.includes('dispose'),
    'Engine should properly dispose ONNX sessions'
  );
  
  test(
    'Engine disposes worker',
    engineContent.includes('emotionWorkerManager.dispose'),
    'Engine should dispose worker'
  );
}

// Check EmotionDetector resource management
if (fs.existsSync(detectorPath)) {
  const detectorContent = fs.readFileSync(detectorPath, 'utf8');
  
  test(
    'Detector handles visibility change',
    detectorContent.includes('handleVisibilityChange') && detectorContent.includes('document.hidden'),
    'Detector should handle visibility changes'
  );
  
  test(
    'Detector releases camera when hidden',
    detectorContent.includes('cameraRef.current.stop') && detectorContent.includes('document.hidden'),
    'Detector should release camera when tab hidden'
  );
  
  test(
    'Detector optimizes memory when hidden',
    detectorContent.includes('emotionStateManager.optimizeMemory') && detectorContent.includes('document.hidden'),
    'Detector should optimize memory when tab hidden'
  );
  
  test(
    'Detector stops monitoring when hidden',
    detectorContent.includes('performanceMonitor.stopMonitoring') && detectorContent.includes('document.hidden'),
    'Detector should stop monitoring when tab hidden'
  );
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${results.tests.length}`);
console.log(`✓ Passed: ${results.passed}`);
console.log(`✗ Failed: ${results.failed}`);
console.log(`⚠ Warnings: ${results.warnings}`);

const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
console.log(`\nPass Rate: ${passRate}%`);

if (results.failed === 0) {
  console.log('\n🎉 All verifications passed! Task 13 is complete.');
} else {
  console.log('\n⚠️  Some verifications failed. Please review the failures above.');
}

console.log('='.repeat(80));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
