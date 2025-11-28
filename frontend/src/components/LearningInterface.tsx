"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Extend Window interface for Chrome extension
declare global {
  interface Window {
    aiLearningMonitor?: {
      start: (sessionId: string) => void;
      stop: () => void;
      isActive: () => boolean;
    };
  }
}
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Menu,
  X,
  CheckCircle,
  Circle,
  Lightbulb,
  ArrowLeft,
  Trophy,
  BookOpen,
  Sparkles,
  Clock,
  Settings,
} from "lucide-react";
import ChatBot from "./ChatBot";
import ProgressBar from "./ProgressBar";
import Quiz from "./Quiz";
import Flashcards from "./Flashcards";
import AttentionAlert from "./AttentionAlert";
import AttentionTracker from "./AttentionTracker";
import { EmotionDetector } from "./EmotionDetector";
import EmotionAlert from "./EmotionAlert";
import VisibilityAlert from "./VisibilityAlert";
import EmotionSettings, { EmotionSettingsConfig } from "./EmotionSettings";
import { EmotionState } from "../lib/EmotionStateManager";
import { VisibilityIssue } from "../lib/VisibilityMonitor";

interface LearningInterfaceProps {
  sessionData: any;
  onBackToUpload: () => void;
}

export default function LearningInterface({
  sessionData,
  onBackToUpload,
}: LearningInterfaceProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [completedChunks, setCompletedChunks] = useState<Set<number>>(
    new Set()
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  // Fix: Properly extract chunks from sessionData
  const [chunks, setChunks] = useState(() => {
    const extractedChunks = sessionData?.chunks || sessionData?.content?.chunks || [];
    console.log('📦 Chunks loaded:', extractedChunks.length, extractedChunks);
    return extractedChunks;
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [chatbotWidth, setChatbotWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [chunkStartTime, setChunkStartTime] = useState<number>(Date.now());
  const [chunkTimeSpent, setChunkTimeSpent] = useState<number>(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const [chunkTimes, setChunkTimes] = useState<Map<number, number>>(new Map());
  
  // Emotion detection state
  const [emotionState, setEmotionState] = useState<EmotionState | undefined>(undefined);
  const [visibilityIssue, setVisibilityIssue] = useState<VisibilityIssue | null>(null);
  const [showEmotionAlert, setShowEmotionAlert] = useState(false);
  const [emotionAlertData, setEmotionAlertData] = useState<{
    tier: 1 | 2;
    message: string;
    emotion: string;
    confidence: number;
  } | null>(null);
  const [isEmotionDetectionActive, setIsEmotionDetectionActive] = useState(true);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [emotionSettings, setEmotionSettings] = useState<EmotionSettingsConfig>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('emotion_detection_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    // Default settings
    return {
      enabled: true,
      cameraPermissionGranted: false,
      captureFrequency: 7,
      cloudRecalibrationEnabled: true,
    };
  });

  const progress = chunks.length > 0 ? (completedChunks.size / chunks.length) * 100 : 0;

  // Debug: Log chunks on mount
  useEffect(() => {
    console.log('🎓 LearningInterface mounted');
    console.log('📦 Total chunks:', chunks.length);
    console.log('📝 Session data:', sessionData);
    if (chunks.length === 0) {
      console.error('⚠️  No chunks available! Check backend response.');
    }
  }, []);

  const handleChunkComplete = () => {
    const newCompleted = new Set(Array.from(completedChunks).concat([currentChunk]));
    setCompletedChunks(newCompleted);
    
    // Check if all chunks are completed
    if (newCompleted.size === chunks.length) {
      setShowCompletionModal(true);
    }
  };

  const handleSimplifyContent = async () => {
    setIsSimplifying(true);
    try {
      const response = await fetch("http://localhost:5000/api/simplify-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          chunk_id: chunks[currentChunk].id,
          content: chunks[currentChunk].content,
        }),
      });

      const data = await response.json();
      if (data.simplified_content) {
        const updatedChunks = [...chunks];
        updatedChunks[currentChunk].content = data.simplified_content;
        setChunks(updatedChunks);
      }
    } catch (error) {
      console.error("Error simplifying content:", error);
    } finally {
      setIsSimplifying(false);
    }
  };

  // Emotion detection callbacks
  const handleEmotionUpdate = (state: EmotionState) => {
    setEmotionState(state);
    
    // Check if intervention is needed based on action suggestion
    if (state.actionSuggestion === 'Simplify') {
      setEmotionAlertData({
        tier: 1,
        message: "Seems tough — shall I simplify this?",
        emotion: state.currentEmotion,
        confidence: state.confidenceScore
      });
      setShowEmotionAlert(true);
    } else if (state.actionSuggestion === 'Break') {
      setEmotionAlertData({
        tier: 2,
        message: "You've been disengaged for a while — would you like a short break?",
        emotion: state.currentEmotion,
        confidence: state.confidenceScore
      });
      setShowEmotionAlert(true);
    }
  };

  const handleVisibilityIssue = (issue: VisibilityIssue | null) => {
    setVisibilityIssue(issue);
  };

  const handleBreak = () => {
    // Pause emotion detection during break
    setIsEmotionDetectionActive(false);
    
    // Show break UI
    setPopupMessage("Take a short break. Stretch, rest your eyes, or grab some water. Click 'Continue' when you're ready to resume learning.");
    setShowPopup(true);
  };

  const handleResumeFromBreak = () => {
    // Resume emotion detection
    setIsEmotionDetectionActive(true);
    setShowPopup(false);
  };

  const handleSettingsChange = (newSettings: EmotionSettingsConfig) => {
    setEmotionSettings(newSettings);
    
    // Update emotion detection active state based on settings
    setIsEmotionDetectionActive(newSettings.enabled);
  };

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - chunkStartTime) / 1000);
      setChunkTimeSpent(timeSpent);
    }, 1000);

    return () => clearInterval(interval);
  }, [chunkStartTime]);

  // Update total time
  useEffect(() => {
    const total = Array.from(chunkTimes.values()).reduce((sum, time) => sum + time, 0) + chunkTimeSpent;
    setTotalTimeSpent(total);
  }, [chunkTimes, chunkTimeSpent]);

  // Start monitoring when component mounts (OPTIONAL - won't break if extension not loaded)
  useEffect(() => {
    try {
      if (window.aiLearningMonitor) {
        const sessionId = sessionData?.session_id || `session_${Date.now()}`;
        window.aiLearningMonitor.start(sessionId);
        console.log('✅ Attention monitoring started');
      } else {
        console.log('ℹ️  Attention monitoring not available (extension not loaded)');
      }
    } catch (error) {
      console.log('ℹ️  Attention monitoring failed to start:', error);
    }

    // Cleanup on unmount
    return () => {
      try {
        if (window.aiLearningMonitor) {
          window.aiLearningMonitor.stop();
          console.log('🛑 Attention monitoring stopped');
        }
      } catch (error) {
        // Silently fail
      }
    };
  }, [sessionData]);



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const navigateToChunk = (index: number) => {
    // Save time for current chunk
    const newChunkTimes = new Map(chunkTimes);
    const currentTime = newChunkTimes.get(currentChunk) || 0;
    newChunkTimes.set(currentChunk, currentTime + chunkTimeSpent);
    setChunkTimes(newChunkTimes);
    
    setCurrentChunk(index);
    setChunkStartTime(Date.now());
    setChunkTimeSpent(0);
    setLeftSidebarOpen(false);
  };

  const nextChunk = () => {
    if (currentChunk < chunks.length - 1) {
      navigateToChunk(currentChunk + 1);
    }
  };

  const prevChunk = () => {
    if (currentChunk > 0) {
      navigateToChunk(currentChunk - 1);
    }
  };

  // Listen for popup messages from monitoring
  useEffect(() => {
    const handlePopupMessage = (event: CustomEvent) => {
      setPopupMessage(event.detail.message);
      setShowPopup(true);
    };

    window.addEventListener(
      "showLearningPopup",
      handlePopupMessage as EventListener
    );
    return () =>
      window.removeEventListener(
        "showLearningPopup",
        handlePopupMessage as EventListener
      );
  }, []);

  // Handle chatbot resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 280;
      const maxWidth = 600;
      
      setChatbotWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Show error state if no chunks
  if (!chunks || chunks.length === 0) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">No Content Available</h2>
          <p className="text-gray-400 mb-6">
            We couldn't generate learning content from your file. This might be because:
          </p>
          <ul className="text-left text-gray-400 mb-6 space-y-2">
            <li>• The file content couldn't be extracted</li>
            <li>• The AI service is unavailable</li>
            <li>• The content is too short or empty</li>
          </ul>
          <button
            onClick={onBackToUpload}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Try Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Sidebar - Chunks List */}
      <AnimatePresence>
        {leftSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-80 bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-red-500/30 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-red-500/30 bg-gradient-to-r from-red-900/20 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Learning Path
                </h3>
                <button
                  onClick={() => setLeftSidebarOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProgressBar progress={progress} />
              <div className="mt-3 text-xs text-gray-400 flex items-center justify-between">
                <span>{completedChunks.size} of {chunks.length} completed</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chunks.map((chunk: any, index: number) => (
                <motion.div
                  key={chunk.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                    currentChunk === index
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30"
                      : "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50"
                  }`}
                  onClick={() => navigateToChunk(index)}
                >
                  {/* Number badge */}
                  <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                    currentChunk === index
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black"
                      : completedChunks.has(index)
                      ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {index + 1}
                  </div>

                  <div className="flex items-start justify-between ml-4">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm mb-1 ${
                        currentChunk === index ? "text-white" : "text-gray-200"
                      }`}>
                        {chunk.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs">
                        <Clock className="h-3 w-3" />
                        <span className={currentChunk === index ? "text-red-100" : "text-gray-400"}>
                          {chunk.estimated_time}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {completedChunks.has(index) ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : currentChunk === index ? (
                        <Circle className="h-5 w-5 text-white animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-black border-b border-red-500/30 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToUpload}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-all hover:scale-105 border border-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back</span>
              </button>

              {!leftSidebarOpen && (
                <button
                  onClick={() => setLeftSidebarOpen(true)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}

              <div className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-red-400" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {chunks[currentChunk]?.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Time Display */}
              <div className="flex items-center space-x-4 px-4 py-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg text-sm border border-blue-500/30 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">Section:</span>
                  <span className="text-white font-mono font-bold">{formatTime(chunkTimeSpent)}</span>
                </div>
                <div className="h-4 w-px bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-white font-mono font-bold">{formatTime(totalTimeSpent)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowFlashcards(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Flashcards</span>
              </button>

              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg transition-all hover:scale-105 shadow-lg shadow-yellow-500/30"
              >
                <Trophy className="h-4 w-4" />
                <span className="font-medium">Quiz</span>
              </button>

              <button
                onClick={handleSimplifyContent}
                disabled={isSimplifying}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 shadow-lg shadow-red-500/30"
              >
                {isSimplifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="font-medium">Simplifying...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4" />
                    <span className="font-medium">Simplify</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-3 rounded-lg transition-all hover:scale-105 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                title="Emotion Detection Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={`p-3 rounded-lg transition-all hover:scale-105 ${
                  rightSidebarOpen 
                    ? "bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/30" 
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                }`}
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-black via-gray-900/50 to-black">
          <motion.div
            key={currentChunk}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            {/* Progress indicator for current chunk */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {currentChunk + 1}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Section {currentChunk + 1} of {chunks.length}</div>
                  <div className="text-xs text-gray-500">{chunks[currentChunk]?.estimated_time}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {completedChunks.has(currentChunk) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center space-x-1 text-green-400 text-sm"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Completed</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Main content with enhanced styling */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 shadow-2xl focus-mode">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: chunks[currentChunk]?.content,
                }}
              />
            </div>

            {/* Learning objectives */}
            {/*{chunks[currentChunk]?.objectives && chunks[currentChunk].objectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6"
              >
                <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Learning Objectives
                </h4
                <ul className="space-y-2">
                  {chunks[currentChunk].objectives.map((obj: string, idx: number) => (
                    <li key={idx} className="flex items-start text-gray-300">
                      <span className="text-blue-400 mr-2">✓</span>
                      {obj}
                    </li>
                  ))}
                </ul>>
              </motion.div>
            )} */}
          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-black border-t border-red-500/30 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Left side with extra margin to avoid monitor overlap */}
            <button
              onClick={prevChunk}
              disabled={currentChunk === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 border border-gray-700 font-medium"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              {!completedChunks.has(currentChunk) ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleChunkComplete}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all shadow-lg shadow-green-500/30 font-semibold"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Mark Complete</span>
                </motion.button>
              ) : (
                <div className="flex items-center space-x-2 px-8 py-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  <span>Completed ✓</span>
                </div>
              )}

              <button
                onClick={nextChunk}
                disabled={currentChunk === chunks.length - 1}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 shadow-lg shadow-red-500/30 font-medium"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - ChatBot */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            style={{ width: chatbotWidth }}
            className="bg-gray-900 border-l border-red-500/20 relative"
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/20 hover:bg-red-500/40 cursor-col-resize transition-colors"
              onMouseDown={handleDragStart}
            >
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-red-500/30 rounded-full flex items-center justify-center">
                <div className="w-0.5 h-4 bg-red-500 rounded-full"></div>
              </div>
            </div>
            
            <ChatBot
              sessionId={sessionData?.session_id}
              currentChunk={chunks[currentChunk]}
              onClose={() => setRightSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Messages */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-gray-900 border border-red-500 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-400">
                Learning Assistant
              </h3>
              <p className="text-gray-300 mb-6">{popupMessage}</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleResumeFromBreak}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Continue Learning
                </button>
                {!popupMessage.includes("break") && (
                  <button
                    onClick={() => {
                      setShowPopup(false);
                      handleSimplifyContent();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Simplify Content
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-8 max-w-lg mx-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-4">Congratulations! 🎉</h2>
              <p className="text-xl text-gray-300 mb-6">
                You've completed all learning modules for <span className="text-red-400 font-semibold">{sessionData?.topic || "this topic"}</span>!
              </p>
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="text-4xl font-bold text-green-500 mb-2">100%</div>
                <p className="text-gray-400">Course Completion</p>
              </div>
              {quizScore !== null && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="text-2xl font-bold text-yellow-500 mb-2">
                    Quiz Score: {quizScore}%
                  </div>
                  <p className="text-gray-400">Great job on the quiz!</p>
                </div>
              )}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setShowQuiz(true);
                  }}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                >
                  <Trophy className="h-5 w-5" />
                  <span>Take Final Quiz</span>
                </button>
                <button
                  onClick={onBackToUpload}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-500 rounded-lg w-full max-w-3xl h-[80vh] mx-4"
            >
              <Quiz
                topic={sessionData?.topic || "Learning Topic"}
                content={chunks.map((c: any) => c.content).join("\n")}
                onComplete={(score, total) => {
                  const percentage = Math.round((score / total) * 100);
                  setQuizScore(percentage);
                  setShowQuiz(false);
                  // Only show completion modal if all chunks are actually completed
                  if (completedChunks.size === chunks.length) {
                    setShowCompletionModal(true);
                  }
                }}
                onClose={() => setShowQuiz(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcards Modal */}
      <AnimatePresence>
        {showFlashcards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-500 rounded-lg w-full max-w-4xl h-[80vh] mx-4"
            >
              <Flashcards
                topic={sessionData?.topic || "Learning Topic"}
                content={chunks.map((c: any) => c.content).join("\n")}
                onClose={() => setShowFlashcards(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emotion Detector */}
      {emotionSettings.enabled && (
        <EmotionDetector
          sessionId={sessionData?.session_id || 'unknown'}
          isActive={isEmotionDetectionActive}
          onEmotionUpdate={handleEmotionUpdate}
          onVisibilityIssue={handleVisibilityIssue}
          captureFrequency={emotionSettings.captureFrequency || 7}
          cloudRecalibrationEnabled={emotionSettings.cloudRecalibrationEnabled || true}
        />
      )}

      {/* Attention Tracker with Emotion Integration */}
      <AttentionTracker
        sessionId={sessionData?.session_id || 'unknown'}
        currentChunk={currentChunk}
        chunkStartTime={chunkStartTime}
        estimatedReadTime={parseInt(chunks[currentChunk]?.estimated_time?.replace(/\D/g, '') || '5') * 60}
        onSimplifyRequest={handleSimplifyContent}
        emotionState={emotionState}
      />

      {/* Emotion Alert */}
      {showEmotionAlert && emotionAlertData && (
        <EmotionAlert
          tier={emotionAlertData.tier}
          message={emotionAlertData.message}
          emotion={emotionAlertData.emotion}
          confidence={emotionAlertData.confidence}
          onSimplify={() => {
            setShowEmotionAlert(false);
            handleSimplifyContent();
          }}
          onBreak={() => {
            setShowEmotionAlert(false);
            handleBreak();
          }}
          onDismiss={() => setShowEmotionAlert(false)}
        />
      )}

      {/* Visibility Alert */}
      {visibilityIssue && (
        <VisibilityAlert
          issueType={visibilityIssue.type}
          message={visibilityIssue.message}
          consecutiveFrames={visibilityIssue.consecutiveFrames}
          onDismiss={() => setVisibilityIssue(null)}
          autoResolve={true}
        />
      )}

      {/* Emotion Settings Modal */}
      <EmotionSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={emotionSettings}
        onSettingsChange={handleSettingsChange}
      />

    </div>
  );
}
