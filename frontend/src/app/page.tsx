'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, BookOpen, Zap, TrendingUp, Users, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-red-500/30 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Brain className="h-10 w-10 text-red-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              LearnWise AI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/login"
              className="flex items-center gap-2 px-6 py-2 text-white hover:text-red-400 transition font-medium"
            >
              <LogIn size={20} />
              Login
            </a>
            <a
              href="/signup"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition shadow-lg shadow-red-500/30 font-semibold"
            >
              <UserPlus size={20} />
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-red-500 via-red-400 to-white bg-clip-text text-transparent">
                AI-Powered Learning
              </span>
              <br />
              <span className="text-white">Reimagined</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform any document into an intelligent, adaptive learning experience with emotion detection and personalized guidance
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-lg font-semibold transition shadow-lg shadow-red-500/30 hover:scale-105"
              >
                Start Learning Free
              </a>
              <a
                href="#features"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-lg font-semibold transition border border-gray-700"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              Intelligent Features
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-12 w-12 text-red-500" />}
              title="Emotion Detection"
              description="AI monitors your emotional state and adapts content difficulty in real-time for optimal learning"
            />
            <FeatureCard
              icon={<Sparkles className="h-12 w-12 text-red-500" />}
              title="Smart Content Generation"
              description="Automatically breaks down complex materials into digestible chunks with quizzes and flashcards"
            />
            <FeatureCard
              icon={<Zap className="h-12 w-12 text-red-500" />}
              title="Adaptive Learning"
              description="Content simplifies when you're struggling and advances when you're ready for more"
            />
            <FeatureCard
              icon={<TrendingUp className="h-12 w-12 text-red-500" />}
              title="Progress Tracking"
              description="Comprehensive analytics show your mastery level, quiz scores, and learning patterns"
            />
            <FeatureCard
              icon={<BookOpen className="h-12 w-12 text-red-500" />}
              title="Multi-Format Support"
              description="Upload PDFs, Word docs, PowerPoints, or images - we extract and structure the content"
            />
            <FeatureCard
              icon={<Users className="h-12 w-12 text-red-500" />}
              title="AI Tutor Chat"
              description="Context-aware chatbot provides detailed explanations and answers your questions"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard number="1" title="Upload" description="Upload your study material in any format" />
            <StepCard number="2" title="AI Processing" description="Our AI breaks it into structured learning chunks" />
            <StepCard number="3" title="Learn" description="Study with emotion-adaptive content delivery" />
            <StepCard number="4" title="Master" description="Track progress with quizzes and flashcards" />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              Built by Innovators
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Developed by a passionate team of students
          </p>
          <div className="flex justify-center gap-8 flex-wrap">
            <TeamMember name="Shreesha Hegde" />
            <TeamMember name="Vishaka V" />
            <TeamMember name="Spurthi B S" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
                Ready to Transform Your Learning?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of students learning smarter with AI
            </p>
            <a
              href="/signup"
              className="inline-block px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-xl font-semibold transition shadow-lg shadow-red-500/30 hover:scale-105"
            >
              Get Started Now - It's Free
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-red-500/30">
        <div className="container mx-auto text-center text-gray-400">
          <p>&copy; 2025 LearnWise AI. Built with ❤️ for better learning.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="p-6 bg-gray-900 rounded-xl border border-red-500/30 hover:border-red-500/60 transition"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-red-500/30">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function TeamMember({ name }: { name: string }) {
  return (
    <div className="px-8 py-4 bg-gray-900 rounded-lg border border-red-500/30">
      <p className="text-lg font-semibold text-white">{name}</p>
      <p className="text-sm text-gray-400">Developer</p>
    </div>
  );
}
