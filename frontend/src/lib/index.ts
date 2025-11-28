/**
 * Kiro Emotion Intelligence System - Main Export
 * 
 * Exports all core components and utilities for the Kiro system.
 */

// Core Engine
export { KiroEmotionEngine } from './KiroEmotionEngine';

// Component Classes
export { SlidingWindowManager } from './SlidingWindowManager';
export { EMASmoother } from './EMASmoother';
export { TierEvaluator } from './TierEvaluator';

// Types
export * from '../types/kiro.types';

// Configuration
export * from '../config/kiro.config';

// React Components
export { KiroInterventionModal, useKiroInterventionManager } from '../components/KiroInterventionModal';
export { EmotionDetectorWithKiro, useEmotionDetectorWithKiro } from '../components/EmotionDetectorWithKiro';
export { AttentionTrackerWithKiro } from '../components/AttentionTrackerWithKiro';
export { KiroLearningPage } from '../pages/KiroLearningPage';

/**
 * Quick Start Helper
 * 
 * Creates a pre-configured Kiro engine ready for use
 */
export const createKiroEngine = () => {
  const { KiroEmotionEngine: Engine } = require('./KiroEmotionEngine');
  return new Engine();
};

/**
 * Version information
 */
export const KIRO_VERSION = '1.0.0';
