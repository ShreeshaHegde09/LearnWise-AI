/**
 * Emotion Detector with Kiro Integration
 * Wrapper that adds Kiro intelligence with proper cooldown handling
 */

import React, { useState, useCallback, useRef } from 'react';
import { KiroEmotionEngine } from '../lib/KiroEmotionEngine';
import { KiroInterventionModal, useKiroInterventionManager } from './KiroInterventionModal';
import { EmotionFrame, AttentionState, KiroAnalysis, EmotionClass } from '../types/kiro.types';

interface EmotionDetectorWithKiroProps {
  emotionData?: { emotion: string; confidence: number; probabilities: Record<string, number> };
  attentionData?: AttentionState;
  onKiroIntervention?: (tier: number, action: string) => void;
}

export const EmotionDetectorWithKiro: React.FC<EmotionDetectorWithKiroProps> = ({
  emotionData,
  attentionData,
  onKiroIntervention
}) => {
  const [kiroEngine] = useState(() => new KiroEmotionEngine());
  const [currentAnalysis, setCurrentAnalysis] = useState<KiroAnalysis | null>(null);
  const interventionManager = useKiroInterventionManager();
  const lastInterventionTime = useRef<number>(0);
  const lastInterventionTier = useRef<number | null>(null);

  // Process emotion data through Kiro - DISABLED FOR NOW
  const processWithKiro = useCallback(() => {
    if (!emotionData) return;

    // SIMPLE SYSTEM: Just track emotion, NO AUTO-ALERTS
    const emotionFrame: EmotionFrame = {
      emotion: emotionData.emotion as EmotionClass,
      probabilities: {
        Focused: emotionData.probabilities?.Focused || 0,
        Confused: emotionData.probabilities?.Confused || 0,
        Bored: emotionData.probabilities?.Bored || 0,
        Tired: emotionData.probabilities?.Tired || 0
      },
      confidence: emotionData.confidence,
      timestamp: Date.now()
    };

    const attentionState: AttentionState = attentionData || {
      level: 'high',
      isActive: true,
      isLookingAtScreen: true,
      isTabFocused: true,
      idleDuration: 0
    };

    // Process frame through Kiro engine for tracking only
    const analysis = kiroEngine.processFrame(emotionFrame, attentionState);
    setCurrentAnalysis(analysis);

    // ALERTS DISABLED - System will only track emotions
    // No automatic interventions to prevent flooding
    console.log(`📊 Emotion: ${analysis.dominant_emotion} | Attention: ${analysis.attention_state.level}`);
  }, [emotionData, attentionData, kiroEngine]);

  // Process whenever emotion data changes
  React.useEffect(() => {
    processWithKiro();
  }, [processWithKiro]);

  const handleInterventionAction = (action: string) => {
    const tier = interventionManager.currentIntervention?.tier;
    if (tier) onKiroIntervention?.(tier, action);
    interventionManager.handleAction(action);
    
    // Reset last intervention tracking when user takes action
    lastInterventionTime.current = Date.now();
  };

  const handleDismiss = () => {
    interventionManager.dismissIntervention();
    // Reset last intervention tracking when user dismisses
    lastInterventionTime.current = Date.now();
  };

  return (
    <>
      {currentAnalysis && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <div>Emotion: {currentAnalysis.dominant_emotion}</div>
            <div>Attention: {currentAnalysis.attention_state.level}</div>
            {currentAnalysis.should_intervene && (
              <div className="text-orange-600 font-medium mt-2">
                Tier {currentAnalysis.trigger_tier} ready (cooldown active)
              </div>
            )}
          </div>
        </div>
      )}
      
      <KiroInterventionModal
        isVisible={interventionManager.isVisible}
        tier={interventionManager.currentIntervention?.tier || null}
        onAction={handleInterventionAction}
        onDismiss={handleDismiss}
      />
    </>
  );
};

export const useEmotionDetectorWithKiro = () => {
  const [kiroEngine] = useState(() => new KiroEmotionEngine());
  const interventionManager = useKiroInterventionManager();
  const [currentAnalysis, setCurrentAnalysis] = useState<KiroAnalysis | null>(null);
  const lastInterventionTime = useRef<number>(0);

  const processEmotionWithKiro = useCallback((emotionData: any, attentionData: any) => {
    const emotionFrame: EmotionFrame = {
      emotion: emotionData.emotion || 'Focused',
      probabilities: emotionData.probabilities || { Focused: 0.25, Confused: 0.25, Bored: 0.25, Tired: 0.25 },
      confidence: emotionData.confidence || 0.5,
      timestamp: Date.now()
    };

    const attentionState: AttentionState = {
      level: attentionData?.level || 'high',
      isActive: attentionData?.isActive ?? true,
      isLookingAtScreen: attentionData?.isLookingAtScreen ?? true,
      isTabFocused: attentionData?.isTabFocused ?? true,
      idleDuration: attentionData?.idleDuration ?? 0
    };

    // Process through Kiro engine for tracking only - NO AUTO-ALERTS
    const analysis = kiroEngine.processFrame(emotionFrame, attentionState);
    setCurrentAnalysis(analysis);

    // ALERTS DISABLED to prevent flooding
    console.log(`📊 Hook - Emotion: ${analysis.dominant_emotion}`);

    return analysis;
  }, [kiroEngine]);

  return { kiroEngine, currentAnalysis, processEmotionWithKiro, interventionManager, isReady: kiroEngine.isReady() };
};
