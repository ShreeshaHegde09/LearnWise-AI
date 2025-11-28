"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  X,
  Camera,
  Clock,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Simplified Emotion Detection Settings
 * 
 * Only essential controls:
 * - Enable/disable detection
 * - Camera permission status
 * - System information
 */

export interface EmotionSettingsConfig {
  enabled: boolean;
  cameraPermissionGranted: boolean;
  captureFrequency?: number;
  cloudRecalibrationEnabled?: boolean;
}

interface EmotionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: EmotionSettingsConfig;
  onSettingsChange: (settings: EmotionSettingsConfig) => void;
}

const STORAGE_KEY = 'emotion_detection_settings';

export default function EmotionSettings({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
}: EmotionSettingsProps) {
  const [settings, setSettings] = useState<EmotionSettingsConfig>(currentSettings);
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Load camera permission status
  useEffect(() => {
    checkCameraPermission();
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraStatus(result.state as 'granted' | 'denied' | 'prompt');
      
      result.addEventListener('change', () => {
        setCameraStatus(result.state as 'granted' | 'denied' | 'prompt');
      });
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
  };

  const handleSettingChange = (key: keyof EmotionSettingsConfig, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleRevokeCameraAccess = async () => {
    alert(
      'To revoke camera access:\n\n' +
      '1. Click the camera icon in your browser\'s address bar\n' +
      '2. Select "Block" or "Reset permission"\n' +
      '3. Refresh the page'
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 border border-red-500/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-900/30 to-transparent border-b border-red-500/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Emotion Detection Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {settings.enabled ? (
                    <Eye className="h-5 w-5 text-green-400" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">Emotion Detection</h3>
                    <p className="text-sm text-gray-400">
                      {settings.enabled ? 'Currently active' : 'Currently disabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('enabled', !settings.enabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Detection System</h3>
                  <p className="text-sm text-gray-400">
                    Tracks emotions every 4 seconds (alerts currently disabled)
                  </p>
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-200">
                    <strong>Note:</strong> Automatic interventions are temporarily disabled to prevent alert flooding. 
                    The system is tracking your emotions but won't show popup alerts.
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Permission Status */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <Camera className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Camera Permission</h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {cameraStatus === 'granted' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">Granted</span>
                    </>
                  ) : cameraStatus === 'denied' ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">Denied</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Not requested</span>
                    </>
                  )}
                </div>
                {cameraStatus === 'granted' && (
                  <button
                    onClick={handleRevokeCameraAccess}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            </div>

            {/* Privacy Info */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300 space-y-2">
                  <p className="font-semibold text-white">Privacy & How It Works</p>
                  <ul className="space-y-1 text-xs">
                    <li>• All emotion detection runs locally in your browser</li>
                    <li>• Captures frames every 4 seconds for analysis</li>
                    <li>• No video recorded - only temporary frame snapshots</li>
                    <li>• Data stored locally on your device only</li>
                    <li>• No data sent to external servers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
