/**
 * Enhanced Attention Tracker with Kiro Integration
 * 
 * Provides detailed attention state data optimized for Kiro's intervention logic.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AttentionState } from '../types/kiro.types';
import { ATTENTION_COLORS } from '../config/kiro.config';

interface AttentionTrackerWithKiroProps {
  onAttentionChange?: (attentionData: AttentionState) => void;
  showDebugInfo?: boolean;
  isActive?: boolean;
}

export const AttentionTrackerWithKiro: React.FC<AttentionTrackerWithKiroProps> = ({
  onAttentionChange,
  showDebugInfo = false,
  isActive = true
}) => {
  const [attentionState, setAttentionState] = useState<AttentionState>({
    level: 'high',
    isActive: true,
    isLookingAtScreen: true,
    isTabFocused: true,
    idleDuration: 0
  });

  const lastActivityTime = useRef<number>(Date.now());
  const idleCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Track mouse/keyboard activity
  const handleActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
    updateAttentionState({ isActive: true });
  }, []);

  // Track tab visibility
  const handleVisibilityChange = useCallback(() => {
    const isTabFocused = !document.hidden;
    updateAttentionState({ isTabFocused });
  }, []);

  // Update attention state
  const updateAttentionState = useCallback((updates: Partial<AttentionState>) => {
    setAttentionState(prev => {
      const newState = { ...prev, ...updates };
      onAttentionChange?.(newState);
      return newState;
    });
  }, [onAttentionChange]);

  // Check idle duration
  const checkIdleStatus = useCallback(() => {
    const now = Date.now();
    const idleDuration = Math.floor((now - lastActivityTime.current) / 1000);
    
    let level: AttentionState['level'] = 'high';
    if (!attentionState.isTabFocused || idleDuration > 120) {
      level = 'away';
    } else if (idleDuration > 30 || !attentionState.isActive) {
      level = 'low';
    } else if (idleDuration > 10) {
      level = 'medium';
    }

    updateAttentionState({ idleDuration, level });
  }, [attentionState.isTabFocused, attentionState.isActive, updateAttentionState]);

  // Setup event listeners
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    idleCheckInterval.current = setInterval(checkIdleStatus, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleCheckInterval.current) clearInterval(idleCheckInterval.current);
    };
  }, [isActive, handleActivity, handleVisibilityChange, checkIdleStatus]);

  if (!showDebugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-30">
      <h3 className="font-semibold text-sm mb-2">👁️ Attention Tracker</h3>
      <div className="text-xs space-y-1">
        <div className="flex items-center">
          <span className="w-24">Level:</span>
          <span 
            className="font-medium px-2 py-0.5 rounded"
            style={{ 
              backgroundColor: ATTENTION_COLORS[attentionState.level] + '40',
              color: ATTENTION_COLORS[attentionState.level]
            }}
          >
            {attentionState.level}
          </span>
        </div>
        <div>Active: {attentionState.isActive ? '✓' : '✗'}</div>
        <div>Tab Focused: {attentionState.isTabFocused ? '✓' : '✗'}</div>
        <div>Idle: {attentionState.idleDuration}s</div>
      </div>
    </div>
  );
};
