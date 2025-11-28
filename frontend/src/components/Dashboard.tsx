'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { firestoreService } from '@/lib/firestoreService';
import { StudyMaterial, Flashcard, Quiz, TopicSummary } from '@/types/dashboard.types';
import { BookOpen, Brain, Trophy, TrendingUp, LogOut, Plus, Play } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [summaries, setSummaries] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      console.log('Loading dashboard data for user:', user.uid);
      const [mats, cards, quizs, sums] = await Promise.all([
        firestoreService.getStudyMaterials(user.uid),
        firestoreService.getFlashcards(user.uid),
        firestoreService.getQuizzes(user.uid),
        firestoreService.getTopicSummaries(user.uid)
      ]);

      console.log('Loaded data:', { mats, cards, quizs, sums });
      setMaterials(mats);
      setFlashcards(cards);
      setQuizzes(quizs);
      setSummaries(sums);
      setError(null);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 to-black shadow-lg border-b border-red-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Learning Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <a
            href="/learning"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-semibold shadow-lg shadow-red-500/30"
          >
            <Plus size={20} />
            Upload New Material
          </a>
          <a
            href="/learning"
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold border border-gray-700"
          >
            <Play size={20} />
            Continue Learning
          </a>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="text-red-400" />}
            title="Study Materials"
            value={materials.length}
            color="bg-gray-900 border border-red-500/30"
          />
          <StatCard
            icon={<Brain className="text-red-400" />}
            title="Flashcards"
            value={flashcards.length}
            color="bg-gray-900 border border-red-500/30"
          />
          <StatCard
            icon={<Trophy className="text-red-400" />}
            title="Quizzes"
            value={quizzes.length}
            color="bg-gray-900 border border-red-500/30"
          />
          <StatCard
            icon={<TrendingUp className="text-red-400" />}
            title="Topics"
            value={summaries.length}
            color="bg-gray-900 border border-red-500/30"
          />
        </div>

        {/* Topic Summaries */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Topic Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.map((summary) => (
              <TopicCard key={summary.topic} summary={summary} />
            ))}
            {summaries.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400 bg-gray-900 rounded-lg border border-gray-800">
                No topics yet. Start by uploading study materials!
              </div>
            )}
          </div>
        </section>

        {/* Recent Study Materials */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Recent Study Materials</h2>
          <div className="bg-gray-900 rounded-lg shadow-lg border border-red-500/30">
            {materials.slice(0, 5).map((material) => (
              <MaterialRow key={material.id} material={material} />
            ))}
            {materials.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No study materials yet
              </div>
            )}
          </div>
        </section>



        {/* Recent Quizzes */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Recent Quizzes</h2>
          <div className="bg-gray-900 rounded-lg shadow-lg border border-red-500/30">
            {quizzes.slice(0, 5).map((quiz) => (
              <QuizRow key={quiz.id} quiz={quiz} />
            ))}
            {quizzes.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No quizzes yet
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  return (
    <div className={`${color} p-6 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function TopicCard({ summary }: { summary: TopicSummary }) {
  const router = useRouter();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleGenerateSummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingSummary(true);
    setShowSummary(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: summary.topic })
      });
      
      const data = await response.json();
      setSummaryText(data.summary || 'No summary available');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryText('Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/topic/${encodeURIComponent(summary.topic)}`);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-gray-900 p-6 rounded-lg shadow-lg hover:shadow-xl transition border border-red-500/30 cursor-pointer hover:border-red-500/60"
      >
        <h3 className="font-bold text-lg mb-3 text-white">{summary.topic}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Materials:</span>
            <span className="font-semibold text-white">{summary.totalMaterials}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Flashcards:</span>
            <span className="font-semibold text-white">{summary.totalFlashcards}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Quizzes:</span>
            <span className="font-semibold text-white">{summary.totalQuizzes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Score:</span>
            <span className="font-semibold text-white">{summary.averageScore.toFixed(0)}%</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1 text-gray-400">
              <span>Mastery</span>
              <span className="text-white">{summary.masteryLevel.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
                style={{ width: `${summary.masteryLevel}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleGenerateSummary}
            className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition text-sm font-semibold"
          >
            Quick Summary
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">Click card for full details</p>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSummary(false)}>
          <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">{summary.topic} - Summary</h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            {loadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{summaryText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MaterialRow({ material }: { material: StudyMaterial }) {
  return (
    <div className="p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-white">{material.title}</h3>
          <p className="text-sm text-gray-400">{material.topic}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-red-400">{material.progress}%</div>
          <div className="text-xs text-gray-500">
            {material.lastStudied?.toLocaleDateString() || 'Not studied'}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview({ card }: { card: Flashcard }) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg hover:shadow-xl transition border border-red-500/30">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs px-2 py-1 rounded ${
          card.difficulty === 'easy' ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
          card.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' :
          'bg-red-900/50 text-red-400 border border-red-500/30'
        }`}>
          {card.difficulty}
        </span>
        <span className="text-xs text-gray-500">{card.topic}</span>
      </div>
      <p className="font-semibold mb-2 text-white">{card.question}</p>
      <div className="text-xs text-gray-400">
        Correct: {card.correctCount} | Incorrect: {card.incorrectCount}
      </div>
    </div>
  );
}

function QuizRow({ quiz }: { quiz: Quiz }) {
  return (
    <div className="p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-white">{quiz.title}</h3>
          <p className="text-sm text-gray-400">{quiz.topic}</p>
        </div>
        <div className="text-right">
          {quiz.score !== undefined ? (
            <div className="text-sm font-semibold text-green-400">{quiz.score}%</div>
          ) : (
            <div className="text-sm text-gray-500">Not completed</div>
          )}
          <div className="text-xs text-gray-500">
            {quiz.completedAt?.toLocaleDateString() || 'Pending'}
          </div>
        </div>
      </div>
    </div>
  );
}
