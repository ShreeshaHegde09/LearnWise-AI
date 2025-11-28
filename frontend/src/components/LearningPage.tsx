'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Brain, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FileUploadSimple from './FileUploadSimple';
import LearningInterface from './LearningInterface';
import MaterialSelector from './MaterialSelector';

export default function LearningPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'select' | 'upload' | 'learning'>('select');
  const [sessionData, setSessionData] = useState<any>(null);

  const handleFileUploaded = async (data: any) => {
    console.log('📥 File uploaded, data received:', data);
    
    // Update lastStudied timestamp if material_id exists
    if (user?.uid && data.material_id) {
      try {
        const { firestoreService } = await import('@/lib/firestoreService');
        await firestoreService.updateStudyMaterial(data.material_id, {
          lastStudied: new Date()
        });
      } catch (error) {
        console.error('Error updating lastStudied:', error);
      }
    }
    
    const sessionWithId = {
      ...data,
      session_id: data.session_id || data.material_id || `session_${Date.now()}`
    };
    console.log('✅ Session data prepared:', sessionWithId);
    setSessionData(sessionWithId);
    setCurrentView('learning');
  };

  const handleContinueLearning = async (material: any, topic: string) => {
    try {
      console.log('📚 Continuing learning with NEW topic:', material.title, '→', topic);
      
      // Update lastStudied timestamp
      if (user?.uid) {
        const { firestoreService } = await import('@/lib/firestoreService');
        await firestoreService.updateStudyMaterial(material.id, {
          lastStudied: new Date()
        });
      }
      
      // Call backend to generate NEW content for the new topic from existing material
      const response = await fetch('http://localhost:5000/api/continue-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          material_id: material.id,
          topic: topic,
          user_id: user?.uid || '1',
          content: material.content,  // Send the full content
          title: material.title
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate learning content');
      }
      
      const data = await response.json();
      console.log('✅ New content generated for topic:', topic, data);
      
      const sessionWithId = {
        ...data,
        session_id: data.session_id || `session_${Date.now()}`,
        material_id: material.id
      };
      
      setSessionData(sessionWithId);
      setCurrentView('learning');
    } catch (error) {
      console.error('Error continuing learning:', error);
      alert('Failed to generate learning content. Please try again.');
    }
  };

  // Check if there's a material to study from sessionStorage
  useEffect(() => {
    const storedMaterial = sessionStorage.getItem('studyMaterial');
    if (storedMaterial) {
      try {
        const material = JSON.parse(storedMaterial);
        sessionStorage.removeItem('studyMaterial');
        // Load the material for studying
        handleContinueLearning(material, material.topic);
      } catch (error) {
        console.error('Error loading stored material:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 to-black p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft size={18} />
              Dashboard
            </a>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold">LearnWise AI</h1>
            </div>
          </div>
          <div className="text-gray-300">
            {user?.email}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {currentView === 'select' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MaterialSelector
              onSelectMaterial={handleContinueLearning}
              onNewUpload={() => setCurrentView('upload')}
            />
          </motion.div>
        ) : currentView === 'upload' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
                Upload Your Learning Material
              </h2>
              <p className="text-gray-300 text-lg">
                Upload your study materials and let AI create a personalized learning experience
              </p>
            </div>
            
            <FileUploadSimple onFileUploaded={handleFileUploaded} />
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-gray-900 p-6 rounded-lg border border-red-500/20">
                <Upload className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Smart Upload</h3>
                <p className="text-gray-400">Upload PDFs, DOCs, PPTs, or images and we'll extract the content intelligently</p>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-red-500/20">
                <BookOpen className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Progressive Learning</h3>
                <p className="text-gray-400">Content broken into digestible chunks with clear learning objectives</p>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-red-500/20">
                <MessageCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
                <p className="text-gray-400">Context-aware chatbot that adapts to your emotional state and learning progress</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <LearningInterface 
            sessionData={sessionData} 
            onBackToUpload={() => {
              setCurrentView('select');
            }}
          />
        )}
      </main>
    </div>
  );
}
