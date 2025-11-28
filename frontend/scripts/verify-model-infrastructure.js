/**
 * Model Infrastructure Verification Script
 * Verifies that model storage and loading infrastructure is properly set up
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MODELS_DIR = path.join(__dirname, '../public/models');
const REQUIRED_FILES = [
  'mobilenet_emotion.onnx',
  'landmark_cnn_emotion.onnx',
  'efficientnet_emotion.onnx',
  'model_info.json',
  'model_checksums.json'
];

console.log('🔍 Verifying Model Storage Infrastructure...\n');

// Test 1: Check directory structure
console.log('Test 1: Directory Structure');
if (!fs.existsSync(MODELS_DIR)) {
  console.error('❌ FAIL: public/models/ directory does not exist');
  process.exit(1);
}
console.log('✓ PASS: public/models/ directory exists\n');

// Test 2: Check required files
console.log('Test 2: Required Files');
let allFilesExist = true;
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(MODELS_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✓ ${file} (${sizeMB} MB)`);
  } else {
    console.error(`❌ ${file} - NOT FOUND`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ FAIL: Some required files are missing');
  process.exit(1);
}
console.log('✓ PASS: All required files exist\n');

// Test 3: Validate model_info.json
console.log('Test 3: Model Metadata (model_info.json)');
try {
  const modelInfoPath = path.join(MODELS_DIR, 'model_info.json');
  const modelInfo = JSON.parse(fs.readFileSync(modelInfoPath, 'utf8'));
  
  // Check version
  if (!modelInfo.version) {
    throw new Error('Missing version field');
  }
  console.log(`✓ Version: ${modelInfo.version}`);
  
  // Check models
  if (!modelInfo.models || typeof modelInfo.models !== 'object') {
    throw new Error('Missing or invalid models field');
  }
  
  const modelNames = Object.keys(modelInfo.models);
  console.log(`✓ Models defined: ${modelNames.length}`);
  
  // Validate each model entry
  modelNames.forEach(modelName => {
    const model = modelInfo.models[modelName];
    
    if (!model.name) throw new Error(`${modelName}: Missing name`);
    if (!model.input_shape) throw new Error(`${modelName}: Missing input_shape`);
    if (!model.output_shape) throw new Error(`${modelName}: Missing output_shape`);
    if (!model.classes) throw new Error(`${modelName}: Missing classes`);
    if (!model.checksum) throw new Error(`${modelName}: Missing checksum`);
    
    console.log(`  ✓ ${modelName}: ${model.name}`);
    console.log(`    - Input: [${model.input_shape.join(', ')}]`);
    console.log(`    - Output: [${model.output_shape.join(', ')}]`);
    console.log(`    - Classes: ${model.classes.length}`);
    console.log(`    - Checksum: ${model.checksum.substring(0, 16)}...`);
  });
  
  console.log('✓ PASS: model_info.json is valid\n');
} catch (error) {
  console.error(`❌ FAIL: model_info.json validation failed: ${error.message}\n`);
  process.exit(1);
}

// Test 4: Validate model_checksums.json
console.log('Test 4: Model Checksums (model_checksums.json)');
try {
  const checksumsPath = path.join(MODELS_DIR, 'model_checksums.json');
  const checksums = JSON.parse(fs.readFileSync(checksumsPath, 'utf8'));
  
  const modelFiles = ['mobilenet_emotion.onnx', 'landmark_cnn_emotion.onnx', 'efficientnet_emotion.onnx'];
  
  modelFiles.forEach(modelFile => {
    if (!checksums[modelFile]) {
      throw new Error(`Missing checksum for ${modelFile}`);
    }
    
    // Validate checksum format (SHA-256 = 64 hex characters)
    if (!/^[a-f0-9]{64}$/.test(checksums[modelFile])) {
      throw new Error(`Invalid checksum format for ${modelFile}`);
    }
    
    console.log(`✓ ${modelFile}: ${checksums[modelFile].substring(0, 16)}...`);
  });
  
  console.log('✓ PASS: model_checksums.json is valid\n');
} catch (error) {
  console.error(`❌ FAIL: model_checksums.json validation failed: ${error.message}\n`);
  process.exit(1);
}

// Test 5: Verify checksums match
console.log('Test 5: Checksum Verification');
try {
  const checksumsPath = path.join(MODELS_DIR, 'model_checksums.json');
  const checksums = JSON.parse(fs.readFileSync(checksumsPath, 'utf8'));
  
  const modelFiles = ['mobilenet_emotion.onnx', 'landmark_cnn_emotion.onnx', 'efficientnet_emotion.onnx'];
  
  let allChecksumsValid = true;
  
  modelFiles.forEach(modelFile => {
    const modelPath = path.join(MODELS_DIR, modelFile);
    const fileBuffer = fs.readFileSync(modelPath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const actualChecksum = hash.digest('hex');
    const expectedChecksum = checksums[modelFile];
    
    if (actualChecksum === expectedChecksum) {
      console.log(`✓ ${modelFile}: Checksum matches`);
    } else {
      console.error(`❌ ${modelFile}: Checksum mismatch`);
      console.error(`  Expected: ${expectedChecksum}`);
      console.error(`  Actual:   ${actualChecksum}`);
      allChecksumsValid = false;
    }
  });
  
  if (!allChecksumsValid) {
    throw new Error('Some checksums do not match');
  }
  
  console.log('✓ PASS: All checksums verified\n');
} catch (error) {
  console.error(`❌ FAIL: Checksum verification failed: ${error.message}\n`);
  process.exit(1);
}

// Test 6: Validate TypeScript configuration
console.log('Test 6: TypeScript Configuration');
try {
  const configPath = path.join(__dirname, '../src/config/emotionModels.ts');
  if (!fs.existsSync(configPath)) {
    throw new Error('emotionModels.ts not found');
  }
  console.log('✓ emotionModels.ts exists');
  
  const loaderPath = path.join(__dirname, '../src/lib/modelLoader.ts');
  if (!fs.existsSync(loaderPath)) {
    throw new Error('modelLoader.ts not found');
  }
  console.log('✓ modelLoader.ts exists');
  
  console.log('✓ PASS: TypeScript configuration files exist\n');
} catch (error) {
  console.error(`❌ FAIL: TypeScript configuration validation failed: ${error.message}\n`);
  process.exit(1);
}

// Summary
console.log('═══════════════════════════════════════════════════════');
console.log('✅ ALL TESTS PASSED');
console.log('═══════════════════════════════════════════════════════');
console.log('\nModel Storage Infrastructure Summary:');
console.log('  ✓ Directory structure created');
console.log('  ✓ 3 ONNX models deployed');
console.log('  ✓ Model versioning system implemented (v1.0.0)');
console.log('  ✓ Model integrity checks (SHA-256 checksums)');
console.log('  ✓ TypeScript configuration and loader');
console.log('\nTask 1.2 Status: ✅ COMPLETE');
console.log('═══════════════════════════════════════════════════════\n');
