/**
 * PerformanceMonitor
 * Monitors system performance and adjusts emotion detection parameters
 * Implements adaptive capture frequency and frame skipping
 */

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  inferenceTime: number;
  frameRate: number;
  isHighLoad: boolean;
}

export interface PerformanceSettings {
  captureInterval: number;
  imageResolution: number;
  skipFrames: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  private inferenceTimeSamples: number[] = [];
  private maxSamples: number = 10;
  private cpuThreshold: number = 80; // 80% CPU usage threshold
  private memoryThreshold: number = 200 * 1024 * 1024; // 200MB
  private slowInferenceThreshold: number = 150; // 150ms
  
  private baseInterval: number = 7000; // 7 seconds
  private fastInterval: number = 3000; // 3 seconds
  private slowInterval: number = 10000; // 10 seconds
  
  private baseResolution: number = 224;
  private lowResolution: number = 160;
  
  private isMonitoring: boolean = false;
  private performanceCheckInterval: NodeJS.Timeout | null = null;
  
  private currentSettings: PerformanceSettings = {
    captureInterval: 7000,
    imageResolution: 224,
    skipFrames: false
  };

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Check performance every 5 seconds
    this.performanceCheckInterval = setInterval(() => {
      this.checkPerformance();
    }, 5000);

    console.log('PerformanceMonitor started');
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring(): void {
    if (this.performanceCheckInterval) {
      clearInterval(this.performanceCheckInterval);
      this.performanceCheckInterval = null;
    }

    this.isMonitoring = false;
    console.log('PerformanceMonitor stopped');
  }

  /**
   * Record inference time sample
   */
  recordInferenceTime(time: number): void {
    this.inferenceTimeSamples.push(time);

    // Keep only recent samples
    if (this.inferenceTimeSamples.length > this.maxSamples) {
      this.inferenceTimeSamples.shift();
    }

    // Check if we need to adjust settings immediately
    if (time > this.slowInferenceThreshold) {
      this.adjustForSlowInference();
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const cpuUsage = this.estimateCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const avgInferenceTime = this.getAverageInferenceTime();
    const frameRate = this.estimateFrameRate();

    return {
      cpuUsage,
      memoryUsage,
      inferenceTime: avgInferenceTime,
      frameRate,
      isHighLoad: cpuUsage > this.cpuThreshold || avgInferenceTime > this.slowInferenceThreshold
    };
  }

  /**
   * Get current performance settings
   */
  getSettings(): PerformanceSettings {
    return { ...this.currentSettings };
  }

  /**
   * Check performance and adjust settings
   */
  private checkPerformance(): void {
    const metrics = this.getMetrics();

    // High CPU usage - reduce capture frequency
    if (metrics.cpuUsage > this.cpuThreshold) {
      console.warn(`High CPU usage detected: ${metrics.cpuUsage.toFixed(1)}%`);
      this.adjustForHighCPU();
    }
    // High memory usage - enable frame skipping
    else if (metrics.memoryUsage > this.memoryThreshold) {
      console.warn(`High memory usage detected: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      this.adjustForHighMemory();
    }
    // Slow inference - reduce resolution
    else if (metrics.inferenceTime > this.slowInferenceThreshold) {
      console.warn(`Slow inference detected: ${metrics.inferenceTime.toFixed(1)}ms`);
      this.adjustForSlowInference();
    }
    // Normal performance - restore defaults
    else if (metrics.cpuUsage < this.cpuThreshold * 0.7 && metrics.inferenceTime < this.slowInferenceThreshold * 0.7) {
      this.restoreDefaultSettings();
    }
  }

  /**
   * Adjust settings for high CPU usage
   */
  private adjustForHighCPU(): void {
    // Reduce capture frequency
    if (this.currentSettings.captureInterval < this.slowInterval) {
      this.currentSettings.captureInterval = this.slowInterval;
      console.log(`Adjusted capture interval to ${this.slowInterval}ms due to high CPU`);
    }

    // Enable frame skipping
    if (!this.currentSettings.skipFrames) {
      this.currentSettings.skipFrames = true;
      console.log('Enabled frame skipping due to high CPU');
    }
  }

  /**
   * Adjust settings for high memory usage
   */
  private adjustForHighMemory(): void {
    // Enable frame skipping
    if (!this.currentSettings.skipFrames) {
      this.currentSettings.skipFrames = true;
      console.log('Enabled frame skipping due to high memory');
    }

    // Reduce resolution
    if (this.currentSettings.imageResolution > this.lowResolution) {
      this.currentSettings.imageResolution = this.lowResolution;
      console.log(`Reduced image resolution to ${this.lowResolution}px due to high memory`);
    }
  }

  /**
   * Adjust settings for slow inference
   */
  private adjustForSlowInference(): void {
    // Reduce resolution
    if (this.currentSettings.imageResolution > this.lowResolution) {
      this.currentSettings.imageResolution = this.lowResolution;
      console.log(`Reduced image resolution to ${this.lowResolution}px due to slow inference`);
    }

    // Enable frame skipping
    if (!this.currentSettings.skipFrames) {
      this.currentSettings.skipFrames = true;
      console.log('Enabled frame skipping due to slow inference');
    }
  }

  /**
   * Restore default settings when performance improves
   */
  private restoreDefaultSettings(): void {
    let changed = false;

    if (this.currentSettings.captureInterval !== this.baseInterval) {
      this.currentSettings.captureInterval = this.baseInterval;
      changed = true;
    }

    if (this.currentSettings.imageResolution !== this.baseResolution) {
      this.currentSettings.imageResolution = this.baseResolution;
      changed = true;
    }

    if (this.currentSettings.skipFrames) {
      this.currentSettings.skipFrames = false;
      changed = true;
    }

    if (changed) {
      console.log('Restored default performance settings');
    }
  }

  /**
   * Estimate CPU usage (approximation based on inference time)
   */
  private estimateCPUUsage(): number {
    const avgInferenceTime = this.getAverageInferenceTime();
    
    // Rough estimation: 100ms inference ≈ 50% CPU usage
    // This is a simplified model
    const estimatedUsage = (avgInferenceTime / 100) * 50;
    
    return Math.min(100, Math.max(0, estimatedUsage));
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    // Return 0 if memory API not available
    return 0;
  }

  /**
   * Get average inference time
   */
  private getAverageInferenceTime(): number {
    if (this.inferenceTimeSamples.length === 0) {
      return 0;
    }

    const sum = this.inferenceTimeSamples.reduce((a, b) => a + b, 0);
    return sum / this.inferenceTimeSamples.length;
  }

  /**
   * Estimate frame rate
   */
  private estimateFrameRate(): number {
    const avgInferenceTime = this.getAverageInferenceTime();
    
    if (avgInferenceTime === 0) {
      return 0;
    }

    // Calculate theoretical max FPS based on inference time
    return 1000 / avgInferenceTime;
  }

  /**
   * Reset performance monitor
   */
  reset(): void {
    this.inferenceTimeSamples = [];
    this.restoreDefaultSettings();
  }

  /**
   * Set custom thresholds
   */
  setThresholds(options: {
    cpuThreshold?: number;
    memoryThreshold?: number;
    slowInferenceThreshold?: number;
  }): void {
    if (options.cpuThreshold !== undefined) {
      this.cpuThreshold = options.cpuThreshold;
    }
    if (options.memoryThreshold !== undefined) {
      this.memoryThreshold = options.memoryThreshold;
    }
    if (options.slowInferenceThreshold !== undefined) {
      this.slowInferenceThreshold = options.slowInferenceThreshold;
    }
  }

  /**
   * Check if memory usage is within acceptable limits
   */
  isMemoryHealthy(): boolean {
    const memoryUsage = this.getMemoryUsage();
    return memoryUsage === 0 || memoryUsage < this.memoryThreshold;
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    settings: PerformanceSettings;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const settings = this.getSettings();
    const recommendations: string[] = [];

    if (metrics.cpuUsage > this.cpuThreshold) {
      recommendations.push('High CPU usage detected. Consider reducing capture frequency.');
    }

    if (metrics.memoryUsage > this.memoryThreshold) {
      recommendations.push('High memory usage detected. Consider clearing old predictions.');
    }

    if (metrics.inferenceTime > this.slowInferenceThreshold) {
      recommendations.push('Slow inference detected. Consider reducing image resolution.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal.');
    }

    return {
      metrics,
      settings,
      recommendations
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
