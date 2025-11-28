"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Trophy, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreService } from "@/lib/firestoreService";

interface QuizProps {
  topic: string;
  content: string;
  onComplete: (score: number, total: number) => void;
  onClose: () => void;
}

interface Question {
  question: string;
  type: "multiple_choice" | "fill_blank" | "true_false";
  options?: string[];
  correct: number | string;
  explanation: string;
  userAnswer?: string;
}

export default function Quiz({ topic, content, onComplete, onClose }: QuizProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showQuestionCountSelect, setShowQuestionCountSelect] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);

  const fetchQuiz = async (count: number) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content, question_count: count }),
      });

      const data = await response.json();
      if (data.questions) {
        setQuestions(data.questions);
        if (data.questions.length > 0) {
          shuffleCurrentQuestion(data.questions[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleCurrentQuestion = (question: Question) => {
    if (question.type === "multiple_choice" && question.options) {
      const options = [...question.options];
      const correctAnswer = options[question.correct as number];
      
      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      
      // Find new position of correct answer
      const newCorrectIndex = options.indexOf(correctAnswer);
      
      setShuffledOptions(options);
      setCorrectAnswerIndex(newCorrectIndex);
    }
  };

  const handleStartQuiz = () => {
    setShowQuestionCountSelect(false);
    fetchQuiz(questionCount);
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    const question = questions[currentQuestion];
    let isCorrect = false;

    if (question.type === "multiple_choice") {
      if (selectedAnswer === null) return;
      isCorrect = selectedAnswer === correctAnswerIndex;
    } else if (question.type === "fill_blank" || question.type === "true_false") {
      if (!textAnswer.trim()) return;
      const correctAnswer = String(question.correct).toLowerCase().trim();
      isCorrect = textAnswer.toLowerCase().trim() === correctAnswer;
    }
    
    setShowExplanation(true);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      const nextQuestion = questions[currentQuestion + 1];
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setTextAnswer("");
      setShowExplanation(false);
      shuffleCurrentQuestion(nextQuestion);
    } else {
      setQuizComplete(true);
    }
  };

  const handleFinishQuiz = async () => {
    // Save quiz to Firestore
    if (user) {
      try {
        await firestoreService.addQuiz(user.uid, {
          title: `${topic} Quiz`,
          topic: topic,
          questions: questions.map(q => ({
            id: Math.random().toString(36).substr(2, 9),
            question: q.question,
            options: q.options || [],
            correctAnswer: typeof q.correct === 'number' ? q.correct : 0,
            explanation: q.explanation
          })),
          score: Math.round((score / questions.length) * 100)
        });
        console.log('✅ Quiz saved to Firestore');
      } catch (error) {
        console.error('Error saving quiz:', error);
      }
    }
    onComplete(score, questions.length);
  };

  if (showQuestionCountSelect) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Ready for the Quiz?</h2>
          <p className="text-gray-400 mb-6">
            Test your knowledge on <span className="text-red-400">{topic}</span>
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              How many questions would you like?
            </label>
            <div className="flex justify-center space-x-3">
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    questionCount === count
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
              onClick={handleStartQuiz}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Start Quiz
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
          <p className="text-gray-400">Generating {questionCount} quiz questions...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full p-6"
      >
        <Trophy className="h-20 w-20 text-yellow-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
        <div className="text-6xl font-bold text-red-500 mb-2">
          {percentage}%
        </div>
        <p className="text-xl text-gray-400 mb-8">
          You scored {score} out of {questions.length}
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleFinishQuiz}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Finish
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-red-500/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Quiz: {topic}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-2 text-xs text-gray-500 uppercase tracking-wide">
              {question.type === "multiple_choice" && "Multiple Choice"}
              {question.type === "fill_blank" && "Fill in the Blank"}
              {question.type === "true_false" && "True or False"}
            </div>
            <h3 className="text-xl font-semibold mb-6">{question.question}</h3>

            {/* Multiple Choice Options */}
            {question.type === "multiple_choice" && (
              <div className="space-y-3 mb-6">
                {shuffledOptions.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === correctAnswerIndex;
                  const showResult = showExplanation;

                  let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all ";
                  
                  if (!showResult) {
                    buttonClass += isSelected
                      ? "border-red-500 bg-red-500/10"
                      : "border-gray-600 hover:border-gray-500 bg-gray-800";
                  } else {
                    if (isCorrect) {
                      buttonClass += "border-green-500 bg-green-500/10";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-500/10";
                    } else {
                      buttonClass += "border-gray-600 bg-gray-800";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showResult && isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill in the Blank / True False */}
            {(question.type === "fill_blank" || question.type === "true_false") && (
              <div className="mb-6">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={showExplanation}
                  placeholder="Type your answer here..."
                  className="w-full p-4 bg-gray-800 border-2 border-gray-600 rounded-lg focus:border-red-500 focus:outline-none text-white disabled:opacity-50"
                />
                {showExplanation && (
                  <div className="mt-3 flex items-center space-x-2">
                    {textAnswer.toLowerCase().trim() === String(question.correct).toLowerCase().trim() ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-500">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-500">
                          Incorrect. Correct answer: <strong>{question.correct}</strong>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <h4 className="font-semibold mb-2 text-red-400">Explanation:</h4>
                  <p className="text-gray-300">{question.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="p-6 border-t border-red-500/20 flex-shrink-0">
        <div className="flex justify-end space-x-3">
          {!showExplanation ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={(question.type === "multiple_choice" && selectedAnswer === null) || 
                       ((question.type === "fill_blank" || question.type === "true_false") && !textAnswer.trim())}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <span>Submit Answer</span>
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <span>{currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
