/**
 * Intervention Modal Component
 * 
 * Displays tier-specific intervention messages to learners
 * with appropriate action buttons based on emotional state.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Coffee, Brain, Zap, ArrowRight } from 'lucide-react';
import { TIER_MESSAGES, TIER_ACTIONS } from '../config/kiro.config';

interface InterventionModalProps {
  tier: number;
  emotion: string;
  onAction: (action: string) => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export default function InterventionModal({
  tier,
  emotion,
  onAction,
  onDismiss,
  isVisible
}: InterventionModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Get tier-specific content
  const message = TIER_MESSAGES[tier as keyof typeof TIER_MESSAGES] || 'How can I help?';
  const actions = TIER_ACTIONS[tier as keyof typeof TIER_ACTIONS] || [];

  // Get tier-specific styling
  const getTierColor = () => {
    switch (tier) {
      case 1: return 'amber';   // Confusion
      case 2: return 'red';     // Tired
      case 3: return 'indigo';  // Bored
      case 4: return 'gray';    // Away
      default: return 'blue';
    }
  };

  const getTierIcon = () => {
    switch (tier) {
      case 1: return <AlertCircle className="h-8 w-8" />;
      case 2: return <Coffee className="h-8 w-8" />;
      case 3: return <Brain className="h-8 w-8" />;
      case 4: return <ArrowRight className="h-8 w-8" />;
      default: return <Zap className="h-8 w-8" />;
    }
  };

  const color = getTierColor();

  const handleAction = (action: string) => {
    setIsClosing(true);
    setTimeout(() => {
      onAction(action);
      setIsClosing(false);
    }, 300);
  };

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
      setIsClosing(false);
    }, 300);
  };

  // Auto-dismiss after 30 seconds if no action taken
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && !isClosing && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className={`bg-gray-900 rounded-2xl shadow-2xl border-2 border-${color}-500/30 overflow-hidden`}>
              {/* Header */}
              <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 p-6 relative`}>
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-white/10 rounded-full text-white`}>
                    {getTierIcon()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Kiro Assistant</h3>
                    <p className="text-white/80 text-sm">Emotion: {emotion}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                  {message}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction(action.action)}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                        index === 0
                          ? `bg-gradient-to-r from-${color}-600 to-${color}-700 hover:from-${color}-700 hover:to-${color}-800 text-white shadow-lg shadow-${color}-500/30`
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                      }`}
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>

                {/* Dismiss hint */}
                <p className="text-center text-gray-500 text-xs mt-4">
                  This message will auto-dismiss in 30 seconds
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
