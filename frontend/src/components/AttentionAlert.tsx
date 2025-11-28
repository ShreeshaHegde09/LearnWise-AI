"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Lightbulb } from "lucide-react";

interface AttentionAlertProps {
  message: string;
  alertType?: string;
  onSimplify: () => void;
  onDismiss: () => void;
}

export default function AttentionAlert({
  message,
  alertType = "low_attention",
  onSimplify,
  onDismiss,
}: AttentionAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const isAwayAlert = alertType === "away";

  // Track tab visibility - only show alert on unfocused tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabFocused(!document.hidden);
    };

    const handleFocus = () => {
      setIsTabFocused(true);
    };

    const handleBlur = () => {
      setIsTabFocused(false);
    };

    // Set initial state
    setIsTabFocused(!document.hidden);

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Auto-dismiss after 10 seconds (15 for away alerts)
  useEffect(() => {
    const dismissTime = isAwayAlert ? 15000 : 10000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation to complete
    }, dismissTime);

    return () => clearTimeout(timer);
  }, [onDismiss, isAwayAlert]);

  const handleSimplify = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSimplify();
      onDismiss();
    }, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  // Only show alert if tab is NOT focused (user is on another tab)
  const shouldShowAlert = isVisible && !isTabFocused;

  return (
    <AnimatePresence>
      {shouldShowAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-20 right-6 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500/50 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-yellow-400">
                  Attention Check
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message */}
            <p className="text-sm text-gray-300 mb-4">{message}</p>

            {/* Actions */}
            <div className="flex space-x-2">
              {isAwayAlert ? (
                <>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    I'm Back!
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    Later
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSimplify}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Yes, Simplify</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    No, I'm Fine
                  </button>
                </>
              )}
            </div>

            {/* Progress bar for auto-dismiss */}
            <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: isAwayAlert ? 15 : 10, ease: "linear" }}
                className="h-full bg-yellow-500"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
