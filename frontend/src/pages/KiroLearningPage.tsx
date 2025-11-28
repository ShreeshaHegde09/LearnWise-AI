/**
 * Kiro Learning Page - Complete Integration Example
 * 
 * Demonstrates full integration of:
 * - Emotion Detection
 * - Attention Tracking
 * - Kiro Intelligence Engine
 * - Intervention System
 */

import React, { useState, useCallback } from 'react';
import { EmotionDetectorWithKiro, AttentionTrackerWithKiro } from '../lib';
import { AttentionState } from '../types/kiro.types';

export const KiroLearningPage: React.FC = () => {
  const [attentionData, setAttentionData] = useState<AttentionState | undefined>();
  const [learningContent, setLearningContent] = useState<'normal' | 'simplified'>('normal');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Handle attention updates from tracker
  const handleAttentionChange = useCallback((attention: AttentionState) => {
    setAttentionData(attention);
  }, []);

  // Handle emotion detection
  const handleEmotionDetected = useCallback((emotion: string, confidence: number) => {
    console.log(`Emotion detected: ${emotion} (${(confidence * 100).toFixed(1)}%)`);
  }, []);

  // Handle Kiro interventions
  const handleKiroIntervention = useCallback((tier: number, action: string) => {
    console.log(`Kiro Intervention - Tier ${tier}: ${action}`);
    
    switch (action) {
      case 'simplify':
        setLearningContent('simplified');
        break;
      case 'break':
        setIsOnBreak(true);
        setTimeout(() => setIsOnBreak(false), 300000); // 5 min break
        break;
      case 'quiz':
        setShowQuiz(true);
        break;
      case 'continue':
        setLearningContent('normal');
        setIsOnBreak(false);
        setShowQuiz(false);
        break;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧠 Kiro Intelligent Learning System
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Learning Content */}
          <div className="lg:col-span-2">
            {isOnBreak ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">☕</div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Take a Break</h2>
                <p className="text-blue-700">
                  Kiro detected you need rest. Come back refreshed!
                </p>
              </div>
            ) : showQuiz ? (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-purple-900 mb-4">Quick Quiz</h2>
                <p className="text-purple-700 mb-4">
                  Let's test your understanding to re-engage your focus!
                </p>
                <button
                  onClick={() => setShowQuiz(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Complete Quiz
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">
                  Learning Content {learningContent === 'simplified' && '(Simplified)'}
                </h2>
                <div className="prose">
                  {learningContent === 'simplified' ? (
                    <div>
                      <p className="text-lg leading-relaxed">
                        This is simplified content with clearer explanations and examples.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        This is the normal learning content with full complexity.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Emotion Detection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">Emotion Monitor</h3>
              <EmotionDetectorWithKiro
                attentionData={attentionData}
                onKiroIntervention={handleKiroIntervention}
              />
            </div>
          </div>
        </div>

        {/* Attention Tracker */}
        <AttentionTrackerWithKiro
          onAttentionChange={handleAttentionChange}
          showDebugInfo={true}
          isActive={!isOnBreak}
        />
      </div>
    </div>
  );
};
