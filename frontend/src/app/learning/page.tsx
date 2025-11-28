import LearningPage from '@/components/LearningPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Learning() {
  return (
    <ProtectedRoute>
      <LearningPage />
    </ProtectedRoute>
  );
}
