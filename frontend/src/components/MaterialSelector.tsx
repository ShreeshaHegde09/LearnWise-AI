'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/lib/firestoreService';
import { StudyMaterial } from '@/types/dashboard.types';

interface MaterialSelectorProps {
  onSelectMaterial: (material: StudyMaterial, topic: string) => void;
  onNewUpload: () => void;
}

export default function MaterialSelector({ onSelectMaterial, onNewUpload }: MaterialSelectorProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [topic, setTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchMaterials();
    }
  }, [user]);

  const fetchMaterials = async () => {
    if (!user) return;
    
    try {
      const data = await firestoreService.getStudyMaterials(user.uid);
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedMaterial && topic) {
      onSelectMaterial(selectedMaterial, topic);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
          Continue Learning
        </h2>
        <p className="text-gray-300 text-lg">
          Select a previously uploaded material or upload a new one
        </p>
      </div>

      {/* Search and New Upload */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your materials..."
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-400"
          />
        </div>
        <button
          onClick={onNewUpload}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all hover:scale-105 shadow-lg shadow-red-500/30"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">New Upload</span>
        </button>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading your materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-red-500/20">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">
            {searchQuery ? 'No materials found matching your search' : 'No materials uploaded yet'}
          </p>
          <button
            onClick={onNewUpload}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Upload Your First Material
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {filteredMaterials.map((material) => (
            <motion.div
              key={material.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedMaterial(material);
                setTopic(material.topic);
              }}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedMaterial?.id === material.id
                  ? 'bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400'
                  : 'bg-gray-900/50 border border-red-500/20 hover:border-red-500/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{material.title}</h3>
                  <p className="text-sm text-gray-400">{material.topic}</p>
                </div>
                <BookOpen className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(material.lastStudied)}</span>
                </div>
                <div className="px-2 py-1 bg-gray-800 rounded">
                  {material.progress}% complete
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Topic Input (shown when material selected) */}
      {selectedMaterial && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 rounded-lg border border-red-500/20 p-6"
        >
          <h3 className="text-xl font-semibold mb-4">What do you want to learn?</h3>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Chapter 5: Transactions, Unit 3: Normalization, etc."
            className="w-full px-4 py-3 bg-gray-900 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-400 mb-4"
            autoFocus
          />
          <button
            onClick={handleContinue}
            disabled={!topic}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-semibold"
          >
            Continue Learning
          </button>
        </motion.div>
      )}
    </div>
  );
}
