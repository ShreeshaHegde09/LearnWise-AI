/**
 * Model Loader and Integrity Checker
 * Handles loading ONNX models with versioning and checksum verification
 */

import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime Web to use local WASM files
// WASM files are copied to public/ directory during build
if (typeof window !== 'undefined') {
  ort.env.wasm.wasmPaths = '/';
  ort.env.wasm.numThreads = 1; // Single thread for stability
  // Note: SIMD is enabled by default and required for the available WASM files
}

interface ModelInfo {
  name: string;
  input_shape: number[];
  output_shape: number[];
  classes: string[];
  checksum: string;
  note?: string;
}

interface ModelMetadata {
  version: string;
  models: {
    [key: string]: ModelInfo;
  };
}

interface ModelChecksums {
  [key: string]: string;
}

export class ModelLoader {
  private static instance: ModelLoader;
  private modelCache: Map<string, ort.InferenceSession> = new Map();
  private metadata: ModelMetadata | null = null;
  private checksums: ModelChecksums | null = null;
  private basePath: string = '/models';

  private constructor() {}

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  /**
   * Initialize the model loader by fetching metadata
   */
  async initialize(): Promise<void> {
    try {
      // Fetch model metadata
      const metadataResponse = await fetch(`${this.basePath}/model_info.json`);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch model metadata');
      }
      this.metadata = await metadataResponse.json();

      // Fetch checksums
      const checksumsResponse = await fetch(`${this.basePath}/model_checksums.json`);
      if (!checksumsResponse.ok) {
        throw new Error('Failed to fetch model checksums');
      }
      this.checksums = await checksumsResponse.json();

      console.log('Model loader initialized', {
        version: this.metadata.version,
        models: Object.keys(this.metadata.models)
      });
    } catch (error) {
      console.error('Failed to initialize model loader:', error);
      throw error;
    }
  }

  /**
   * Get model metadata
   */
  getMetadata(): ModelMetadata | null {
    return this.metadata;
  }

  /**
   * Get model info for a specific model
   */
  getModelInfo(modelName: string): ModelInfo | null {
    if (!this.metadata) return null;
    return this.metadata.models[modelName] || null;
  }

  /**
   * Verify model checksum
   */
  async verifyChecksum(modelName: string, modelData: ArrayBuffer): Promise<boolean> {
    if (!this.checksums || !this.checksums[modelName]) {
      console.warn(`No checksum available for ${modelName}`);
      return true; // Skip verification if no checksum available
    }

    try {
      const expectedChecksum = this.checksums[modelName];
      const actualChecksum = await this.calculateChecksum(modelData);
      
      const isValid = expectedChecksum === actualChecksum;
      
      if (!isValid) {
        console.error(`Checksum mismatch for ${modelName}`, {
          expected: expectedChecksum,
          actual: actualChecksum
        });
      } else {
        console.log(`✓ Checksum verified for ${modelName}`);
      }
      
      return isValid;
    } catch (error) {
      console.error(`Failed to verify checksum for ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Calculate SHA-256 checksum of model data
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Load a model with caching and integrity check
   */
  async loadModel(modelName: string, verifyIntegrity: boolean = true): Promise<ort.InferenceSession> {
    // Check cache first
    if (this.modelCache.has(modelName)) {
      console.log(`Using cached model: ${modelName}`);
      return this.modelCache.get(modelName)!;
    }

    try {
      console.log(`Loading model: ${modelName}`);
      
      // Fetch model file
      const modelPath = `${this.basePath}/${modelName}`;
      const response = await fetch(modelPath);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      const modelData = await response.arrayBuffer();
      
      // Verify checksum if requested
      if (verifyIntegrity) {
        const isValid = await this.verifyChecksum(modelName, modelData);
        if (!isValid) {
          throw new Error(`Model integrity check failed for ${modelName}`);
        }
      }

      // Create ONNX session
      const session = await ort.InferenceSession.create(modelData, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      // Cache the session
      this.modelCache.set(modelName, session);
      
      console.log(`✓ Model loaded successfully: ${modelName}`);
      
      return session;
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Load multiple models in parallel
   */
  async loadModels(modelNames: string[], verifyIntegrity: boolean = true): Promise<Map<string, ort.InferenceSession>> {
    const loadPromises = modelNames.map(name => 
      this.loadModel(name, verifyIntegrity)
        .then(session => ({ name, session }))
    );

    const results = await Promise.all(loadPromises);
    
    const sessionsMap = new Map<string, ort.InferenceSession>();
    results.forEach(({ name, session }) => {
      sessionsMap.set(name, session);
    });

    return sessionsMap;
  }

  /**
   * Preload models for faster inference
   */
  async preloadModels(modelNames: string[]): Promise<void> {
    console.log('Preloading models:', modelNames);
    await this.loadModels(modelNames, true);
    console.log('✓ All models preloaded');
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.modelCache.clear();
    console.log('Model cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { modelName: string; cached: boolean }[] {
    if (!this.metadata) return [];
    
    return Object.keys(this.metadata.models).map(modelName => ({
      modelName,
      cached: this.modelCache.has(modelName)
    }));
  }

  /**
   * Get model version
   */
  getVersion(): string | null {
    return this.metadata?.version || null;
  }

  /**
   * Check if models are compatible with current version
   */
  isVersionCompatible(requiredVersion: string): boolean {
    if (!this.metadata) return false;
    return this.metadata.version === requiredVersion;
  }
}

// Export singleton instance
export const modelLoader = ModelLoader.getInstance();
