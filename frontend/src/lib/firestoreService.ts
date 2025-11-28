import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { StudyMaterial, Flashcard, Quiz, TopicSummary } from '@/types/dashboard.types';

export const firestoreService = {
  // Study Materials
  async getStudyMaterials(userId: string): Promise<StudyMaterial[]> {
    const q = query(
      collection(db, 'studyMaterials'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const materials = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastStudied: doc.data().lastStudied?.toDate()
    })) as StudyMaterial[];
    
    // Sort in memory instead of using Firestore index
    return materials.sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  },

  async addStudyMaterial(userId: string, material: Omit<StudyMaterial, 'id' | 'createdAt'>) {
    return await addDoc(collection(db, 'studyMaterials'), {
      ...material,
      userId,
      progress: material.progress || 0,
      createdAt: Timestamp.now()
    });
  },

  async updateStudyMaterial(materialId: string, updates: Partial<StudyMaterial>) {
    const materialRef = doc(db, 'studyMaterials', materialId);
    const updateData: any = { ...updates };
    
    if (updates.lastStudied) {
      updateData.lastStudied = Timestamp.fromDate(updates.lastStudied);
    }
    
    return await updateDoc(materialRef, updateData);
  },

  // Flashcards
  async getFlashcards(userId: string): Promise<Flashcard[]> {
    const q = query(
      collection(db, 'flashcards'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const cards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastReviewed: doc.data().lastReviewed?.toDate(),
      nextReview: doc.data().nextReview?.toDate()
    })) as Flashcard[];
    
    // Sort in memory instead of using Firestore index
    return cards.sort((a, b) => {
      const aTime = a.lastReviewed?.getTime() || 0;
      const bTime = b.lastReviewed?.getTime() || 0;
      return bTime - aTime;
    });
  },

  async addFlashcard(userId: string, flashcard: Omit<Flashcard, 'id'>) {
    return await addDoc(collection(db, 'flashcards'), {
      ...flashcard,
      userId
    });
  },

  // Quizzes
  async getQuizzes(userId: string): Promise<Quiz[]> {
    const q = query(
      collection(db, 'quizzes'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const quizzes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate()
    })) as Quiz[];
    
    // Sort in memory instead of using Firestore index
    return quizzes.sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  },

  async addQuiz(userId: string, quiz: Omit<Quiz, 'id' | 'createdAt'>) {
    return await addDoc(collection(db, 'quizzes'), {
      ...quiz,
      userId,
      createdAt: Timestamp.now()
    });
  },

  // Topic Summaries
  async getTopicSummaries(userId: string): Promise<TopicSummary[]> {
    const materials = await this.getStudyMaterials(userId);
    const flashcards = await this.getFlashcards(userId);
    const quizzes = await this.getQuizzes(userId);

    const topicsMap = new Map<string, TopicSummary>();

    materials.forEach(m => {
      if (!topicsMap.has(m.topic)) {
        topicsMap.set(m.topic, {
          topic: m.topic,
          totalMaterials: 0,
          totalFlashcards: 0,
          totalQuizzes: 0,
          averageScore: 0,
          lastStudied: m.lastStudied || m.createdAt,
          masteryLevel: 0
        });
      }
      const summary = topicsMap.get(m.topic)!;
      summary.totalMaterials++;
      summary.masteryLevel += m.progress;
    });

    flashcards.forEach(f => {
      if (!topicsMap.has(f.topic)) {
        topicsMap.set(f.topic, {
          topic: f.topic,
          totalMaterials: 0,
          totalFlashcards: 0,
          totalQuizzes: 0,
          averageScore: 0,
          lastStudied: new Date(),
          masteryLevel: 0
        });
      }
      topicsMap.get(f.topic)!.totalFlashcards++;
    });

    quizzes.forEach(q => {
      if (!topicsMap.has(q.topic)) {
        topicsMap.set(q.topic, {
          topic: q.topic,
          totalMaterials: 0,
          totalFlashcards: 0,
          totalQuizzes: 0,
          averageScore: 0,
          lastStudied: new Date(),
          masteryLevel: 0
        });
      }
      const summary = topicsMap.get(q.topic)!;
      summary.totalQuizzes++;
      if (q.score) summary.averageScore += q.score;
    });

    return Array.from(topicsMap.values()).map(s => ({
      ...s,
      averageScore: s.totalQuizzes > 0 ? s.averageScore / s.totalQuizzes : 0,
      masteryLevel: s.totalMaterials > 0 ? s.masteryLevel / s.totalMaterials : 0
    }));
  }
};
