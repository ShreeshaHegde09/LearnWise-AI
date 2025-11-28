"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCw, X, Sparkles, Check, XIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreService } from "@/lib/firestoreService";

interface FlashcardsProps {
  topic: string;
  content: string;
  onClose: () => void;
}

interface Flashcard {
  front: string;
  back: string;
  correct?: number;
  incorrect?: number;
}

export default function Flashcards({ topic, content, onClose }: FlashcardsProps) {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCountSelect, setShowCountSelect] = useState(true);
  const [cardCount, setCardCount] = useState(10);

  const fetchFlashcards = async (count: number) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content, card_count: count }),
      });

      const data = await response.json();
      if (data.flashcards) {
        const cardsWithStats = data.flashcards.map((card: Flashcard) => ({
          ...card,
          correct: 0,
          incorrect: 0
        }));
        setFlashcards(cardsWithStats);
        
        // Save flashcards to Firestore
        if (user) {
          try {
            for (const card of cardsWithStats) {
              await firestoreService.addFlashcard(user.uid, {
                question: card.front,
                answer: card.back,
                topic: topic,
                difficulty: 'medium',
                correctCount: 0,
                incorrectCount: 0
              });
            }
            console.log('✅ Flashcards saved to Firestore');
          } catch (error) {
            console.error('Error saving flashcards:', error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCorrect = () => {
    const updatedCards = [...flashcards];
    updatedCards[currentCard].correct = (updatedCards[currentCard].correct || 0) + 1;
    setFlashcards(updatedCards);
    handleNext();
  };

  const handleMarkIncorrect = () => {
    const updatedCards = [...flashcards];
    updatedCards[currentCard].incorrect = (updatedCards[currentCard].incorrect || 0) + 1;
    setFlashcards(updatedCards);
    handleNext();
  };

  const handleStartFlashcards = () => {
    setShowCountSelect(false);
    fetchFlashcards(cardCount);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  if (showCountSelect) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <Sparkles className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Create Flashcards</h2>
          <p className="text-gray-400 mb-6">
            Generate flashcards for <span className="text-red-400">{topic}</span>
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              How many flashcards would you like?
            </label>
            <div className="flex justify-center space-x-3">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setCardCount(count)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    cardCount === count
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleStartFlashcards}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Generate Flashcards
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating {cardCount} flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No flashcards generated</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const card = flashcards[currentCard];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-red-500/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Flashcards: {topic}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Card {currentCard + 1} of {flashcards.length}
          </span>
          <span>Click card to flip</span>
        </div>
        <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all"
            style={{
              width: `${((currentCard + 1) / flashcards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="relative w-full max-w-2xl h-96 cursor-pointer"
          onClick={handleFlip}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isFlipped ? "back" : "front"}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-red-500/30 rounded-2xl shadow-2xl flex items-center justify-center p-8"
            >
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-4">
                  {isFlipped ? "Answer" : "Question"}
                </div>
                <p className="text-2xl font-medium leading-relaxed">
                  {isFlipped ? card.back : card.front}
                </p>
                <div className="mt-6 flex items-center justify-center space-x-2 text-gray-500">
                  <RotateCw className="h-4 w-4" />
                  <span className="text-sm">Click to flip</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-red-500/20 flex-shrink-0">
        {isFlipped && (
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={handleMarkIncorrect}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <XIcon className="h-4 w-4" />
              <span>Incorrect</span>
            </button>
            <button
              onClick={handleMarkCorrect}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Correct</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="text-center">
            <div className="text-sm text-gray-400">
              {currentCard + 1} / {flashcards.length}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentCard === flashcards.length - 1}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
