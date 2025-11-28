/**
 * Model Loader Tests
 * Tests for model storage and loading infrastructure
 */

import { ModelLoader } from '../modelLoader';

describe('ModelLoader', () => {
  let modelLoader: ModelLoader;

  beforeEach(() => {
    modelLoader = ModelLoader.getInstance();
  });

  describe('Initialization', () => {
    it('should initialize and load metadata', async () => {
      await modelLoader.initialize();
      
      const metadata = modelLoader.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.version).toBe('1.0.0');
      expect(metadata?.models).toBeDefined();
    });

    it('should load model checksums', async () => {
      await modelLoader.initialize();
      
      const mobilenetInfo = modelLoader.getModelInfo('mobilenet_emotion.onnx');
      expect(mobilenetInfo).not.toBeNull();
      expect(mobilenetInfo?.checksum).toBeDefined();
      expect(mobilenetInfo?.checksum.length).toBe(64); // SHA-256 hex length
    });
  });

  describe('Model Information', () => {
    beforeEach(async () => {
      await modelLoader.initialize();
    });

    it('should return correct model info for MobileNet', () => {
      const info = modelLoader.getModelInfo('mobilenet_emotion.onnx');
      
      expect(info).not.toBeNull();
      expect(info?.name).toBe('MobileNetV2');
      expect(info?.input_shape).toEqual([1, 3, 224, 224]);
      expect(info?.output_shape).toEqual([1, 4]);
      expect(info?.classes).toEqual(['Bored', 'Confused', 'Focused', 'Tired']);
    });

    it('should return correct model info for LandmarkCNN', () => {
      const info = modelLoader.getModelInfo('landmark_cnn_emotion.onnx');
      
      expect(info).not.toBeNull();
      expect(info?.name).toBe('LandmarkCNN');
      expect(info?.classes).toEqual(['Bored', 'Confused', 'Focused', 'Tired']);
    });

    it('should return null for non-existent model', () => {
      const info = modelLoader.getModelInfo('nonexistent.onnx');
      expect(info).toBeNull();
    });
  });

  describe('Version Management', () => {
    beforeEach(async () => {
      await modelLoader.initialize();
    });

    it('should return correct version', () => {
      const version = modelLoader.getVersion();
      expect(version).toBe('1.0.0');
    });

    it('should check version compatibility', () => {
      expect(modelLoader.isVersionCompatible('1.0.0')).toBe(true);
      expect(modelLoader.isVersionCompatible('2.0.0')).toBe(false);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await modelLoader.initialize();
    });

    it('should track cache status', () => {
      const status = modelLoader.getCacheStatus();
      
      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBeGreaterThan(0);
      
      status.forEach(item => {
        expect(item).toHaveProperty('modelName');
        expect(item).toHaveProperty('cached');
        expect(typeof item.cached).toBe('boolean');
      });
    });

    it('should clear cache', () => {
      modelLoader.clearCache();
      
      const status = modelLoader.getCacheStatus();
      status.forEach(item => {
        expect(item.cached).toBe(false);
      });
    });
  });
});
