/**
 * Kiro Intervention Modal Component
 * Displays tier-specific intervention messages
 */

import React, { useState, useEffect } from 'react';
import { TIER_MESSAGES, TIER_ACTIONS } from '../config/kiro.config';

interface KiroInterventionModalProps {
  isVisible: boolean;
  tier: number | null;
  onAction: (action: string) => void;
  onDismiss: () => void;
}

export const KiroInterventionModal: React.FC<KiroInterventionModalProps> = ({
  isVisible,
  tier,
  onAction,
  onDismiss
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) setIsAnimating(true);
  }, [isVisible]);

  if (!isVisible || !tier) return null;

  const message = TIER_MESSAGES[tier as keyof typeof TIER_MESSAGES];
  const actions = TIER_ACTIONS[tier as keyof typeof TIER_ACTIONS];

  const handleAction = (action: string) => {
    setIsAnimating(false);
    setTimeout(() => onAction(action), 200);
  };

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => onDismiss(), 200);
  };

  const getTierColor = (tier: number): string => {
    const colors = {
      1: 'bg-amber-50 border-amber-200',
      2: 'bg-red-50 border-red-200',
      3: 'bg-indigo-50 border-indigo-200',
      4: 'bg-gray-50 border-gray-200'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`relative max-w-md w-full rounded-lg shadow-xl border-2 ${getTierColor(tier)} p-6`}>
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            ×
          </button>
          <h3 className="text-lg font-semibold mb-4">Kiro Assistant</h3>
          <p className="mb-6">{message}</p>
          <div className="flex gap-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.action)}
                className={`px-4 py-2 rounded-md font-medium ${
                  index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export const useKiroInterventionManager = () => {
  const [currentIntervention, setCurrentIntervention] = useState<{ tier: number; timestamp: number } | null>(null);

  return {
    currentIntervention,
    showIntervention: (tier: number) => setCurrentIntervention({ tier, timestamp: Date.now() }),
    dismissIntervention: () => setCurrentIntervention(null),
    handleAction: (action: string) => {
      console.log(`Intervention action: ${action}`);
      setCurrentIntervention(null);
      return action;
    },
    isVisible: currentIntervention !== null
  };
};
