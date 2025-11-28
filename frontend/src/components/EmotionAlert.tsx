"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Coffee, Lightbulb, X } from "lucide-react";

interface EmotionAlertProps {
  tier: 1 | 2;
  message: string;
  emotion: string;
  confidence: number;
  onSimplify?: () => void;
  onBreak?: () => void;
  onDismiss: () => void;
}

/**
 * EmotionAlert Component
 * 
 * Displays emotion-based intervention alerts for Tier 1 and Tier 2 interventions
 * 
 * Tier 1: Persistent confusion/boredom (1-3 minutes)
 * - Message: "Seems tough — shall I simplify this?"
 * - Actions: Simplify or Dismiss
 * 
 * Tier 2: Prolonged disengagement (>5 minutes)
 * - Message: "You've been disengaged for a while — would you like a short break?"
 * - Actions: Take Break or Dismiss
 * 
 * Requirements: 5.1, 5.2
 */
export default function EmotionAlert({
  tier,
  message,
  emotion,
  confidence,
  onSimplify,
  onBreak,
  onDismiss,
}: EmotionAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after 15 seconds for Tier 1, 20 seconds for Tier 2
  const dismissTime = tier === 1 ? 15000 : 20000;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, dismissTime);

    return () => clearTimeout(timer);
  }, [dismissTime]);

  const handleSimplify = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSimplify?.();
      onDismiss();
    }, 300);
  };

  const handleBreak = () => {
    setIsVisible(false);
    setTimeout(() => {
      onBreak?.();
      onDismiss();
    }, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  // Tier-specific styling
  const tierColors = {
    1: {
      border: "border-orange-500/50",
      gradient: "from-orange-900/40 to-gray-900",
      icon: "text-orange-400",
      title: "text-orange-300",
      progress: "bg-orange-500",
      primaryButton: "bg-orange-600 hover:bg-orange-700",
    },
    2: {
      border: "border-purple-500/50",
      gradient: "from-purple-900/40 to-gray-900",
      icon: "text-purple-400",
      title: "text-purple-300",
      progress: "bg-purple-500",
      primaryButton: "bg-purple-600 hover:bg-purple-700",
    },
  };

  const colors = tierColors[tier];
  const Icon = tier === 1 ? Brain : Coffee;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-20 right-6 z-50 max-w-sm"
        >
          <div
            className={`bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} rounded-lg shadow-2xl p-4 backdrop-blur-sm`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${colors.icon} animate-pulse`} />
                <h3 className={`text-sm font-semibold ${colors.title}`}>
                  {tier === 1 ? "Learning Support" : "Break Suggestion"}
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message */}
            <p className="text-sm text-gray-300 mb-3">{message}</p>

            {/* Emotion Context (subtle) */}
            <div className="text-xs text-gray-500 mb-4 flex items-center space-x-2">
              <span>Detected: {emotion}</span>
              <span>•</span>
              <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {tier === 1 ? (
                <>
                  <button
                    onClick={handleSimplify}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 ${colors.primaryButton} rounded-lg transition-colors text-sm font-medium`}
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Simplify</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    I'm Fine
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBreak}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 ${colors.primaryButton} rounded-lg transition-colors text-sm font-medium`}
                  >
                    <Coffee className="h-4 w-4" />
                    <span>Take Break</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    Continue
                  </button>
                </>
              )}
            </div>

            {/* Progress bar for auto-dismiss */}
            <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{
                  duration: dismissTime / 1000,
                  ease: "linear",
                }}
                className={`h-full ${colors.progress}`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
