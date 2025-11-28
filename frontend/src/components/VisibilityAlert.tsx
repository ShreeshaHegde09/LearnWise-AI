"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Eye, Lightbulb as LightbulbIcon, X } from "lucide-react";

export type VisibilityIssueType = 'no_face' | 'poor_lighting' | 'eyes_not_visible';

interface VisibilityAlertProps {
  issueType: VisibilityIssueType;
  message: string;
  consecutiveFrames: number;
  onDismiss: () => void;
  autoResolve?: boolean; // Auto-dismiss when issue is resolved
}

/**
 * VisibilityAlert Component
 * 
 * Displays non-intrusive notifications for face visibility and lighting issues
 * 
 * Issue Types:
 * - no_face: Face not detected by MediaPipe
 * - poor_lighting: Detection confidence below threshold
 * - eyes_not_visible: Key eye landmarks not detected
 * 
 * Features:
 * - Auto-dismiss when issue is resolved (if autoResolve is true)
 * - Non-intrusive styling (smaller, bottom-right position)
 * - Helpful suggestions for each issue type
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export default function VisibilityAlert({
  issueType,
  message,
  consecutiveFrames,
  onDismiss,
  autoResolve = true,
}: VisibilityAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after 10 seconds if not auto-resolving
  useEffect(() => {
    if (!autoResolve) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [autoResolve]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  // Issue-specific configuration
  const issueConfig = {
    no_face: {
      icon: Camera,
      color: "blue",
      title: "Face Not Visible",
      suggestions: [
        "Adjust your camera position",
        "Ensure you're centered in frame",
        "Check camera is not blocked",
      ],
    },
    poor_lighting: {
      icon: LightbulbIcon,
      color: "yellow",
      title: "Poor Lighting",
      suggestions: [
        "Turn on more lights",
        "Face a window or light source",
        "Avoid backlighting",
      ],
    },
    eyes_not_visible: {
      icon: Eye,
      color: "purple",
      title: "Eyes Not Visible",
      suggestions: [
        "Ensure your face is fully visible",
        "Remove obstructions (glasses glare, hair)",
        "Look towards the camera",
      ],
    },
  };

  const config = issueConfig[issueType];
  const Icon = config.icon;

  // Color schemes for each issue type
  const colorSchemes = {
    blue: {
      border: "border-blue-500/40",
      gradient: "from-blue-900/30 to-gray-900/90",
      icon: "text-blue-400",
      title: "text-blue-300",
      badge: "bg-blue-500/20 text-blue-300",
    },
    yellow: {
      border: "border-yellow-500/40",
      gradient: "from-yellow-900/30 to-gray-900/90",
      icon: "text-yellow-400",
      title: "text-yellow-300",
      badge: "bg-yellow-500/20 text-yellow-300",
    },
    purple: {
      border: "border-purple-500/40",
      gradient: "from-purple-900/30 to-gray-900/90",
      icon: "text-purple-400",
      title: "text-purple-300",
      badge: "bg-purple-500/20 text-purple-300",
    },
  };

  const colors = colorSchemes[config.color];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-40 max-w-xs"
        >
          <div
            className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-lg shadow-xl p-3 backdrop-blur-md`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon className={`h-4 w-4 ${colors.icon}`} />
                <h4 className={`text-xs font-semibold ${colors.title}`}>
                  {config.title}
                </h4>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Message */}
            <p className="text-xs text-gray-300 mb-2">{message}</p>

            {/* Suggestions */}
            <div className="space-y-1 mb-2">
              {config.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-400 flex items-start"
                >
                  <span className="mr-1.5 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}
              >
                {consecutiveFrames} frames
              </span>
              {autoResolve && (
                <span className="text-xs text-gray-500">
                  Auto-resolves
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
