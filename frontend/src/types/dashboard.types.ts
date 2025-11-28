export interface StudyMaterial {
  id: string;
  title: string;
  topic: string;
  content: string;
  createdAt: Date;
  lastStudied?: Date;
  progress: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
  correctCount: number;
  incorrectCount: number;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface TopicSummary {
  topic: string;
  totalMaterials: number;
  totalFlashcards: number;
  totalQuizzes: number;
  averageScore: number;
  lastStudied: Date;
  masteryLevel: number;
}
