# 🔐 Complete Authentication & Dashboard Setup Guide

## Overview

Your AI Learning System now has:
- ✅ Firebase Authentication (Email/Password)
- ✅ Login & Signup Pages
- ✅ Protected Dashboard
- ✅ User Data Storage (Firestore)
- ✅ Study Materials, Flashcards & Quiz Tracking

## Quick Start (5 Minutes)

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it (e.g., "ai-learning-system")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Email/Password"
4. Toggle "Enable"
5. Click "Save"

### 3. Create Firestore Database

1. Click "Firestore Database" in left sidebar
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a location (closest to you)
5. Click "Enable"

### 4. Get Firebase Config

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll to "Your apps"
4. Click the web icon `</>`
5. Register app (name it anything)
6. Copy the `firebaseConfig` object

### 5. Configure Environment

Create `NovProject/frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 6. Run the App

```bash
cd NovProject/frontend
npm run dev
```

Visit: http://localhost:3000

## Routes

| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Landing page with login/signup buttons | No |
| `/login` | Login page | No |
| `/signup` | Registration page | No |
| `/dashboard` | Main dashboard with stats | Yes |
| `/learning` | Learning interface | Yes |

## Dashboard Features

### Stats Cards
- 📚 Study Materials count
- 🧠 Flashcards count
- 🏆 Quizzes completed
- 📈 Topics being studied

### Topic Overview
Each topic card shows:
- Number of materials
- Number of flashcards
- Number of quizzes
- Average quiz score
- Mastery level (progress bar)

### Recent Study Materials
- Material title and topic
- Progress percentage
- Last studied date

### Flashcards Due for Review
- Question preview
- Difficulty badge (easy/medium/hard)
- Correct/incorrect count

### Recent Quizzes
- Quiz title and topic
- Score percentage
- Completion date

## Firestore Collections

### studyMaterials
```javascript
{
  userId: string,
  title: string,
  topic: string,
  content: string,
  progress: number,
  createdAt: timestamp,
  lastStudied: timestamp
}
```

### flashcards
```javascript
{
  userId: string,
  question: string,
  answer: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  correctCount: number,
  incorrectCount: number,
  lastReviewed: timestamp,
  nextReview: timestamp
}
```

### quizzes
```javascript
{
  userId: string,
  title: string,
  topic: string,
  questions: array,
  score: number,
  createdAt: timestamp,
  completedAt: timestamp
}
```

## Security Rules (Production)

In Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Study Materials
    match /studyMaterials/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Flashcards
    match /flashcards/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Quizzes
    match /quizzes/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

## Testing the Flow

1. **Sign Up**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Enter email and password
   - You'll be redirected to dashboard

2. **Dashboard**
   - Initially empty (no data yet)
   - Click "Upload New Material"

3. **Learning**
   - Upload a study material
   - Data will sync to Firestore
   - Return to dashboard to see stats

4. **Logout & Login**
   - Click "Logout" in dashboard
   - Login again with same credentials
   - Your data persists!

## Integration with Existing Backend

To connect with your Flask backend:

### Update File Upload
In `FileUploadSimple.tsx`, add user ID:

```typescript
const { user } = useAuth();

const formData = new FormData();
formData.append('file', file);
formData.append('topic', topic);
formData.append('userId', user?.uid || ''); // Add this
```

### Update Backend
In `app.py`, save with user ID:

```python
user_id = request.form.get('userId')
# Store user_id with material
```

### Sync to Firestore
After backend processing, save to Firestore:

```typescript
await firestoreService.addStudyMaterial(user.uid, {
  title: materialTitle,
  topic: topic,
  content: content,
  progress: 0
});
```

## Troubleshooting

### "Cannot find module '@/contexts/AuthContext'"
- Make sure `tsconfig.json` has path aliases configured
- Restart the dev server

### "Firebase: Error (auth/invalid-api-key)"
- Check `.env.local` file exists
- Verify all Firebase config values are correct
- Restart dev server after adding env vars

### "Missing or insufficient permissions"
- Update Firestore security rules
- Make sure user is authenticated

### Dashboard is empty
- This is normal for new users
- Upload materials through the learning interface
- Data will appear after first upload

## Next Features to Add

- [ ] Google Sign-In
- [ ] Password reset
- [ ] Email verification
- [ ] User profile page
- [ ] Study streaks
- [ ] Achievement system
- [ ] Social features (share progress)
- [ ] Export study data
- [ ] Dark/light theme toggle

## Files Created

```
NovProject/frontend/
├── .env.local.example
├── FIREBASE_SETUP.md
├── AUTH_INTEGRATION_COMPLETE.md
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── learning/page.tsx
│   │   ├── layout.tsx (updated)
│   │   └── page.tsx (updated)
│   ├── components/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LearningPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── firestoreService.ts
│   └── types/
│       └── dashboard.types.ts
└── tsconfig.json (updated)
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase config in `.env.local`
3. Check Firestore rules are set correctly
4. Ensure backend is running on port 5000

Happy learning! 🚀
