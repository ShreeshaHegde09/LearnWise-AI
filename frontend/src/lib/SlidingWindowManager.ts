/**
 * Sliding Window Manager
 * 
 * Manages two sliding windows (20s and 60s) for temporal emotion tracking.
 * Uses circular buffers for efficient O(1) insertion and deletion.
 */

import { EmotionFrame, EmotionDistribution, EmotionProbabilities } from '../types/kiro.types';
import { WINDOW_SIZES } from '../config/kiro.config';

export class SlidingWindowManager {
  private window20s: EmotionFrame[] = [];
  private window60s: EmotionFrame[] = [];
  private maxSize20s: number;
  private maxSize60s: number;

  constructor(shortWindowSize: number = WINDOW_SIZES.SHORT, longWindowSize: number = WINDOW_SIZES.LONG) {
    this.maxSize20s = shortWindowSize;
    this.maxSize60s = longWindowSize;
  }

  /**
   * Add a new emotion frame to both windows
   * Automatically removes oldest frame if window is full
   * 
   * @param frame - Emotion frame to add
   */
  addFrame(frame: EmotionFrame): void {
    // Add to 20-second window
    this.window20s.push(frame);
    if (this.window20s.length > this.maxSize20s) {
      this.window20s.shift(); // Remove oldest
    }

    // Add to 60-second window
    this.window60s.push(frame);
    if (this.window60s.length > this.maxSize60s) {
      this.window60s.shift(); // Remove oldest
    }
  }

  /**
   * Get aggregated emotion distribution from 20-second window
   * 
   * @returns Short-term emotional snapshot
   */
  get20sAggregate(): EmotionDistribution {
    return this.aggregateWindow(this.window20s);
  }

  /**
   * Get aggregated emotion distribution from 60-second window
   * 
   * @returns Trend-level emotional state
   */
  get60sAggregate(): EmotionDistribution {
    return this.aggregateWindow(this.window60s);
  }

  /**
   * Aggregate emotion probabilities across all frames in a window
   * 
   * @param frames - Array of emotion frames
   * @returns Aggregated emotion distribution
   */
  private aggregateWindow(frames: EmotionFrame[]): EmotionDistribution {
    if (frames.length === 0) {
      // Return neutral state if no frames
      return {
        dominant: 'Focused',
        distribution: {
          Focused: 0.25,
          Confused: 0.25,
          Bored: 0.25,
          Tired: 0.25
        },
        confidence: 0
      };
    }

    // Calculate average probabilities across all frames
    const avgProbs: EmotionProbabilities = {
      Focused: 0,
      Confused: 0,
      Bored: 0,
      Tired: 0
    };

    for (const frame of frames) {
      avgProbs.Focused += frame.probabilities.Focused;
      avgProbs.Confused += frame.probabilities.Confused;
      avgProbs.Bored += frame.probabilities.Bored;
      avgProbs.Tired += frame.probabilities.Tired;
    }

    const frameCount = frames.length;
    avgProbs.Focused /= frameCount;
    avgProbs.Confused /= frameCount;
    avgProbs.Bored /= frameCount;
    avgProbs.Tired /= frameCount;

    // Find dominant emotion
    const emotions: Array<keyof EmotionProbabilities> = ['Focused', 'Confused', 'Bored', 'Tired'];
    const dominant = emotions.reduce((a, b) => avgProbs[a] > avgProbs[b] ? a : b);

    return {
      dominant,
      distribution: avgProbs,
      confidence: avgProbs[dominant]
    };
  }

  /**
   * Get current size of a window
   * 
   * @param duration - Window duration (20 or 60)
   * @returns Number of frames in window
   */
  getWindowSize(duration: 20 | 60): number {
    return duration === 20 ? this.window20s.length : this.window60s.length;
  }

  /**
   * Get the oldest frame in a window
   * 
   * @param duration - Window duration (20 or 60)
   * @returns Oldest frame or null if window is empty
   */
  getOldestFrame(duration: 20 | 60): EmotionFrame | null {
    const window = duration === 20 ? this.window20s : this.window60s;
    return window.length > 0 ? window[0] : null;
  }

  /**
   * Get the newest frame in a window
   * 
   * @param duration - Window duration (20 or 60)
   * @returns Newest frame or null if window is empty
   */
  getNewestFrame(duration: 20 | 60): EmotionFrame | null {
    const window = duration === 20 ? this.window20s : this.window60s;
    return window.length > 0 ? window[window.length - 1] : null;
  }

  /**
   * Get frame count for debugging
   * 
   * @returns Object with frame counts for both windows
   */
  getFrameCount(): { short: number; long: number } {
    return {
      short: this.window20s.length,
      long: this.window60s.length
    };
  }

  /**
   * Clear all frames from both windows
   */
  clear(): void {
    this.window20s = [];
    this.window60s = [];
  }

  /**
   * Get all frames from a window (for debugging)
   * 
   * @param duration - Window duration (20 or 60)
   * @returns Array of frames
   */
  getFrames(duration: 20 | 60): EmotionFrame[] {
    return duration === 20 ? [...this.window20s] : [...this.window60s];
  }
}
