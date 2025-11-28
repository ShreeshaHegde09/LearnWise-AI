# 🚀 Quick Reference Card

## Setup (One Time)

```bash
# 1. Create Firebase project at console.firebase.google.com
# 2. Enable Email/Password auth
# 3. Create Firestore database
# 4. Copy config to .env.local

# 5. Run the app
cd NovProject/frontend
npm run dev
```

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Routes

- `/` - Home (redirects to dashboard if logged in)
- `/login` - Login page
- `/signup` - Sign up page
- `/dashboard` - Main dashboard (protected)
- `/learning` - Learning interface (protected)

## Key Components

| Component | Purpose |
|-----------|---------|
| `AuthContext` | Manages authentication state |
| `ProtectedRoute` | Wraps protected pages |
| `LoginPage` | Email/password login |
| `SignupPage` | User registration |
| `Dashboard` | Main dashboard with stats |
| `LearningPage` | Upload & study interface |

## Firestore Service

```typescript
import { firestoreService } from '@/lib/firestoreService';

// Get user's study materials
const materials = await firestoreService.getStudyMaterials(userId);

// Add new material
await firestoreService.addStudyMaterial(userId, {
  title: 'React Basics',
  topic: 'Web Development',
  content: '...',
  progress: 0
});

// Get flashcards
const cards = await firestoreService.getFlashcards(userId);

// Get quizzes
const quizzes = await firestoreService.getQuizzes(userId);

// Get topic summaries
const summaries = await firestoreService.getTopicSummaries(userId);
```

## Auth Hook

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signup, login, logout } = useAuth();
  
  // Sign up
  await signup('email@example.com', 'password123');
  
  // Login
  await login('email@example.com', 'password123');
  
  // Logout
  await logout();
  
  // Check user
  if (user) {
    console.log(user.email, user.uid);
  }
}
```

## Common Tasks

### Protect a Page
```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

### Get Current User
```typescript
const { user } = useAuth();
const userId = user?.uid;
const email = user?.email;
```

### Redirect After Login
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
await login(email, password);
router.push('/dashboard');
```

## Firestore Collections

### studyMaterials
- `userId`, `title`, `topic`, `content`, `progress`, `createdAt`, `lastStudied`

### flashcards
- `userId`, `question`, `answer`, `topic`, `difficulty`, `correctCount`, `incorrectCount`

### quizzes
- `userId`, `title`, `topic`, `questions[]`, `score`, `createdAt`, `completedAt`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | Restart dev server |
| Firebase error | Check `.env.local` |
| Empty dashboard | Upload materials first |
| Auth not working | Verify Firebase config |

## Testing Checklist

- [ ] Sign up with new email
- [ ] Login with credentials
- [ ] View empty dashboard
- [ ] Upload study material
- [ ] See stats update
- [ ] Logout
- [ ] Login again
- [ ] Data persists

## Production Deployment

1. Update Firestore rules (see AUTHENTICATION_SETUP_GUIDE.md)
2. Set environment variables in hosting platform
3. Build: `npm run build`
4. Deploy: `npm start`

---

**Need help?** Check `AUTHENTICATION_SETUP_GUIDE.md` for detailed instructions.
