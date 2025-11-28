import TopicDetailPage from '@/components/TopicDetailPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TopicDetail({ params }: { params: { topic: string } }) {
  return (
    <ProtectedRoute>
      <TopicDetailPage topic={decodeURIComponent(params.topic)} />
    </ProtectedRoute>
  );
}
