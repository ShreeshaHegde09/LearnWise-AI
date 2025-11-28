'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { firestoreService } from '@/lib/firestoreService';
import { StudyMaterial, Flashcard, Quiz } from '@/types/dashboard.types';
import { ArrowLeft, BookOpen, Brain, Trophy, Calendar, Sparkles, Play, X } from 'lucide-react';
import QuizComponent from './Quiz';
import FlashcardsComponent from './Flashcards';

interface TopicDetailPageProps {
  topic: string;
}

export default function TopicDetailPage({ topic }: TopicDetailPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizContent, setQuizContent] = useState('');
  const [showFlashcardsGen, setShowFlashcardsGen] = useState(false);
  const [flashcardsContent, setFlashcardsContent] = useState('');

  useEffect(() => {
    if (user) {
      loadTopicData();
    }
  }, [user, topic]);

  const loadTopicData = async () => {
    if (!user) return;

    try {
      const [allMaterials, allFlashcards, allQuizzes] = await Promise.all([
        firestoreService.getStudyMaterials(user.uid),
        firestoreService.getFlashcards(user.uid),
        firestoreService.getQuizzes(user.uid)
      ]);

      setMaterials(allMaterials.filter(m => m.topic === topic));
      setFlashcards(allFlashcards.filter(f => f.topic === topic));
      setQuizzes(allQuizzes.filter(q => q.topic === topic));
    } catch (error) {
      console.error('Error loading topic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setShowSummary(true);

    try {
      const materialContent = materials.map(m => m.content || '').join('\n\n');
      
      const response = await fetch('http://localhost:5000/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic,
          content: materialContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummaryText(data.summary || 'No summary available');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryText('Failed to generate summary. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (materials.length === 0) return;
    
    const materialContent = materials.map(m => m.content || '').join('\n\n');
    setFlashcardsContent(materialContent);
    setShowFlashcardsGen(true);
  };

  const handleFlashcardsClose = async () => {
    setShowFlashcardsGen(false);
    // Reload data to show updated flashcard count
    await loadTopicData();
  };

  const handleGenerateQuiz = async () => {
    if (materials.length === 0) return;
    
    const materialContent = materials.map(m => m.content || '').join('\n\n');
    setQuizContent(materialContent);
    setShowQuiz(true);
  };

  const handleQuizComplete = async (score: number, total: number) => {
    // Save quiz result to Firestore
    if (user) {
      try {
        await firestoreService.addQuiz(user.uid, {
          title: `${topic} Quiz`,
          topic: topic,
          questions: [], // Questions are generated on the fly
          score: Math.round((score / total) * 100)
        });
        
        // Reload data to show updated quiz count
        await loadTopicData();
      } catch (error) {
        console.error('Error saving quiz result:', error);
      }
    }
    setShowQuiz(false);
  };

  const handleStudyMaterial = (material: StudyMaterial) => {
    // Store material info in sessionStorage and navigate to learning page
    sessionStorage.setItem('studyMaterial', JSON.stringify({
      id: material.id,
      title: material.title,
      topic: material.topic,
      content: material.content
    }));
    router.push('/learning');
  };

  const lastLearned = materials.reduce((latest, m) => {
    const mDate = m.lastStudied || m.createdAt;
    return !latest || (mDate && mDate > latest) ? mDate : latest;
  }, null as Date | null);

  const avgProgress = materials.length > 0
    ? materials.reduce((sum, m) => sum + (m.progress || 0), 0) / materials.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gradient-to-r from-red-900 to-black shadow-lg border-b border-red-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
            >
              <ArrowLeft size={18} />
              Dashboard
            </button>
            <h1 className="text-2xl font-bold text-white">{topic}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showQuiz && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <QuizComponent
                topic={topic}
                content={quizContent}
                onComplete={handleQuizComplete}
                onClose={() => setShowQuiz(false)}
              />
            </div>
          </div>
        )}

        {showFlashcardsGen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <FlashcardsComponent
                topic={topic}
                content={flashcardsContent}
                onClose={handleFlashcardsClose}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<BookOpen className="text-red-400" />} label="Materials" value={materials.length} />
          <StatCard icon={<Brain className="text-red-400" />} label="Flashcards" value={flashcards.length} />
          <StatCard icon={<Trophy className="text-red-400" />} label="Quizzes" value={quizzes.length} />
          <StatCard icon={<Calendar className="text-red-400" />} label="Last Studied" value={lastLearned ? new Date(lastLearned).toLocaleDateString() : 'Never'} />
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-red-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-semibold">Overall Progress</span>
            <span className="text-red-400 font-bold">{Math.round(avgProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        <div className="mb-8 flex gap-4">
          <button onClick={handleGenerateSummary} disabled={loadingSummary || materials.length === 0} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Sparkles size={20} />
            {loadingSummary ? 'Generating Summary...' : 'Generate AI Summary'}
          </button>
          <button onClick={handleGenerateFlashcards} disabled={materials.length === 0} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Brain size={20} />
            Generate Flashcards
          </button>
          <button onClick={handleGenerateQuiz} disabled={materials.length === 0} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Trophy size={20} />
            Take New Quiz
          </button>
        </div>

        {showSummary && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-red-500/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Topic Summary</h2>
              <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="text-gray-300 whitespace-pre-wrap">
              {loadingSummary ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  <span>Generating summary...</span>
                </div>
              ) : summaryText}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="text-red-400" />
            Flashcards
          </h2>
          {flashcards.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center border border-red-500/20">
              <p className="text-gray-400">No flashcards available for this topic yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card, index) => (
                <div key={card.id} className="bg-gray-900 rounded-lg p-6 border border-red-500/20 hover:border-red-500/50 transition cursor-pointer" onClick={() => setSelectedFlashcard(selectedFlashcard === index ? null : index)}>
                  <div className="text-white font-semibold mb-2">{selectedFlashcard === index ? 'Answer:' : 'Question:'}</div>
                  <div className="text-gray-300">{selectedFlashcard === index ? card.answer : card.question}</div>
                  <div className="mt-4 text-sm text-gray-500 text-center">Click to {selectedFlashcard === index ? 'see question' : 'reveal answer'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="text-red-400" />
            Quizzes
          </h2>
          {quizzes.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center border border-red-500/20">
              <p className="text-gray-400">No quizzes available for this topic yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-gray-900 rounded-lg p-6 border border-red-500/20">
                  <h3 className="text-lg font-semibold text-white mb-2">{quiz.title || 'Quiz'}</h3>
                  <div className="text-gray-400 text-sm mb-2">{quiz.questions?.length || 0} questions</div>
                  {quiz.score !== undefined && <div className="text-red-400 font-semibold">Best Score: {quiz.score}%</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-red-400" />
            Study Materials
          </h2>
          {materials.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center border border-red-500/20">
              <p className="text-gray-400">No study materials available for this topic yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="bg-gray-900 rounded-lg p-6 border border-red-500/20 hover:border-red-500/50 transition">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{material.title || 'Study Material'}</h3>
                      <p className="text-gray-400 text-sm">Uploaded: {new Date(material.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-red-400 font-semibold">{material.progress || 0}%</div>
                        <div className="text-gray-500 text-sm">Complete</div>
                      </div>
                      <button onClick={() => handleStudyMaterial(material)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                        <Play size={18} />
                        Study
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-red-500/20">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
