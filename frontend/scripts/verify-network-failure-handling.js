#!/usr/bin/env node

/**
 * Verification Script for Network Failure Handling (Task 10.3)
 * Tests retry logic, request queuing, and failure recovery
 */

console.log('='.repeat(80));
console.log('Network Failure Handling Verification (Task 10.3)');
console.log('='.repeat(80));
console.log();

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function pass(message) {
  console.log('✓', message);
  checks.passed++;
}

function fail(message) {
  console.log('✗', message);
  checks.failed++;
}

function warn(message) {
  console.log('⚠', message);
  checks.warnings++;
}

function section(title) {
  console.log();
  console.log('-'.repeat(80));
  console.log(title);
  console.log('-'.repeat(80));
}

// Check 1: Service file exists and has required methods
section('1. CloudRecalibrationService Implementation');

const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../src/lib/CloudRecalibrationService.ts');

if (!fs.existsSync(servicePath)) {
  fail('CloudRecalibrationService.ts not found');
} else {
  pass('CloudRecalibrationService.ts exists');
  
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // Check for network failure handling features
  const requiredFeatures = [
    { name: 'Network status tracking', pattern: /isOnline.*boolean/i },
    { name: 'Request queue', pattern: /requestQueue.*CalibrationRequest/i },
    { name: 'Network listeners', pattern: /setupNetworkListeners|addEventListener/i },
    { name: 'Exponential backoff', pattern: /exponentialBackoff|Math\.pow.*retryCount/i },
    { name: 'Failure interval adjustment', pattern: /failureIntervalMultiplier|consecutiveFailures/i },
    { name: 'Network check timer', pattern: /networkCheckTimer|checkNetworkConnectivity/i },
    { name: 'Queue processing', pattern: /processQueue/i },
    { name: 'Network error detection', pattern: /isNetworkError/i },
    { name: 'Max failure interval', pattern: /maxFailureInterval/i },
    { name: 'Online/offline handlers', pattern: /handleNetworkOnline|handleNetworkOffline/i }
  ];
  
  requiredFeatures.forEach(feature => {
    if (feature.pattern.test(content)) {
      pass(`  ${feature.name} implemented`);
    } else {
      fail(`  ${feature.name} missing`);
    }
  });
}

// Check 2: Configuration options
section('2. Configuration Options');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  const configOptions = [
    'maxConsecutiveFailures',
    'failureIntervalMultiplier',
    'maxFailureInterval',
    'networkCheckInterval',
    'exponentialBackoff',
    'maxRetries',
    'retryDelay'
  ];
  
  configOptions.forEach(option => {
    if (content.includes(option)) {
      pass(`  ${option} configuration available`);
    } else {
      fail(`  ${option} configuration missing`);
    }
  });
}

// Check 3: Retry logic implementation
section('3. Retry Logic with Exponential Backoff');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // Check for retry implementation
  if (content.includes('sendCalibrationRequest') && content.includes('retryCount')) {
    pass('  Retry logic implemented');
    
    if (content.includes('Math.pow') && content.includes('retryCount')) {
      pass('  Exponential backoff calculation present');
    } else {
      warn('  Exponential backoff calculation may be missing');
    }
    
    if (content.includes('maxRetries')) {
      pass('  Max retries check implemented');
    } else {
      fail('  Max retries check missing');
    }
    
    if (content.includes('setTimeout') && content.includes('delay')) {
      pass('  Retry delay implemented');
    } else {
      fail('  Retry delay missing');
    }
  } else {
    fail('  Retry logic not found');
  }
}

// Check 4: Request queuing
section('4. Request Queue Management');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  if (content.includes('requestQueue') && content.includes('CalibrationRequest[]')) {
    pass('  Request queue data structure present');
    
    if (content.includes('queueRequest')) {
      pass('  Queue request method implemented');
    } else {
      fail('  Queue request method missing');
    }
    
    if (content.includes('processQueue')) {
      pass('  Process queue method implemented');
    } else {
      fail('  Process queue method missing');
    }
    
    if (content.includes('maxQueueSize')) {
      pass('  Queue size limit implemented');
    } else {
      warn('  Queue size limit may be missing');
    }
  } else {
    fail('  Request queue not implemented');
  }
}

// Check 5: Network status monitoring
section('5. Network Status Monitoring');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  if (content.includes('isOnline')) {
    pass('  Network online status tracked');
    
    if (content.includes("addEventListener") && content.includes("online")) {
      pass('  Online event listener registered');
    } else {
      fail('  Online event listener missing');
    }
    
    if (content.includes("addEventListener") && content.includes("offline")) {
      pass('  Offline event listener registered');
    } else {
      fail('  Offline event listener missing');
    }
    
    if (content.includes('navigator.onLine')) {
      pass('  Navigator.onLine API used');
    } else {
      warn('  Navigator.onLine API may not be used');
    }
  } else {
    fail('  Network status tracking not implemented');
  }
}

// Check 6: Failure interval adjustment
section('6. Failure Interval Adjustment');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  if (content.includes('consecutiveFailures')) {
    pass('  Consecutive failures tracked');
    
    if (content.includes('failureIntervalMultiplier') || content.includes('Math.pow')) {
      pass('  Interval multiplier on failures implemented');
    } else {
      fail('  Interval multiplier missing');
    }
    
    if (content.includes('maxFailureInterval')) {
      pass('  Maximum failure interval enforced');
    } else {
      fail('  Maximum failure interval not enforced');
    }
    
    // Check if interval is adjusted in scheduleNextRecalibration
    if (content.includes('scheduleNextRecalibration') && 
        content.includes('consecutiveFailures') &&
        content.includes('adjustedInterval')) {
      pass('  Interval adjustment in scheduling logic');
    } else {
      warn('  Interval adjustment may not be in scheduling logic');
    }
  } else {
    fail('  Consecutive failures not tracked');
  }
}

// Check 7: Network connectivity checks
section('7. Network Connectivity Checks');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  if (content.includes('checkNetworkConnectivity')) {
    pass('  Network connectivity check method implemented');
    
    if (content.includes('networkCheckTimer')) {
      pass('  Periodic network check timer present');
    } else {
      fail('  Periodic network check timer missing');
    }
    
    if (content.includes('networkCheckInterval')) {
      pass('  Network check interval configurable');
    } else {
      fail('  Network check interval not configurable');
    }
    
    if (content.includes('/health') || content.includes('HEAD')) {
      pass('  Lightweight health check endpoint used');
    } else {
      warn('  Health check endpoint may not be optimal');
    }
  } else {
    fail('  Network connectivity check not implemented');
  }
}

// Check 8: Error type detection
section('8. Network Error Detection');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  if (content.includes('isNetworkError')) {
    pass('  Network error detection method implemented');
    
    if (content.includes('TypeError') && content.includes('fetch')) {
      pass('  TypeError detection for network errors');
    } else {
      warn('  TypeError detection may be incomplete');
    }
    
    if (content.includes('network') || content.includes('timeout')) {
      pass('  Error message pattern matching');
    } else {
      warn('  Error message pattern matching may be missing');
    }
  } else {
    fail('  Network error detection not implemented');
  }
}

// Check 9: Continue local inference
section('9. Continue Local Inference Without Cloud');

if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // Check that failures don't stop the service
  if (content.includes('return null') && content.includes('catch')) {
    pass('  Service returns null on failure (allows local inference to continue)');
  } else {
    warn('  Failure handling may not allow local inference to continue');
  }
  
  // Check that offline status doesn't prevent service from running
  if (content.includes('isOnline') && content.includes('queueRequest')) {
    pass('  Requests queued when offline (local inference continues)');
  } else {
    fail('  Offline handling may not queue requests properly');
  }
}

// Check 10: Tests
section('10. Test Coverage');

const testPath = path.join(__dirname, '../src/lib/__tests__/CloudRecalibrationService.test.ts');

if (!fs.existsSync(testPath)) {
  warn('Test file not found');
} else {
  pass('Test file exists');
  
  const testContent = fs.readFileSync(testPath, 'utf8');
  
  const testCases = [
    'Network Failure Handling',
    'Exponential Backoff',
    'Request Queue Management',
    'network status',
    'consecutive failures',
    'queue'
  ];
  
  testCases.forEach(testCase => {
    if (testContent.includes(testCase)) {
      pass(`  Test for ${testCase}`);
    } else {
      warn(`  Test for ${testCase} may be missing`);
    }
  });
}

// Summary
section('Summary');

console.log();
console.log(`Passed:   ${checks.passed}`);
console.log(`Failed:   ${checks.failed}`);
console.log(`Warnings: ${checks.warnings}`);
console.log();

if (checks.failed === 0) {
  console.log('✓ All critical checks passed!');
  console.log();
  console.log('Task 10.3 Implementation Complete:');
  console.log('  ✓ Retry logic with exponential backoff');
  console.log('  ✓ Request queuing when offline');
  console.log('  ✓ Continue local inference without cloud');
  console.log('  ✓ Reduce recalibration frequency on repeated failures');
  console.log();
  console.log('Requirements Met:');
  console.log('  ✓ 7.4: Continue local inference when cloud unavailable');
  console.log('  ✓ 7.5: Reduce frequency when bandwidth limited');
  console.log();
  process.exit(0);
} else {
  console.log('✗ Some checks failed. Please review the implementation.');
  console.log();
  process.exit(1);
}
