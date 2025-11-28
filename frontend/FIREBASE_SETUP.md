# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "ai-learning-system")
4. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" sign-in method

## Step 3: Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Start in "production mode" (or test mode for development)
4. Choose a location

## Step 4: Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register your app
5. Copy the firebaseConfig object

## Step 5: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 6: Set Firestore Rules

In Firestore Database > Rules, add:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /studyMaterials/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    match /flashcards/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    match /quizzes/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

## Step 7: Run the App

```bash
npm run dev
```

Navigate to:
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Dashboard (requires authentication)

## Features

- Email/Password authentication
- Study materials tracking
- Flashcard management
- Quiz history
- Topic summaries with mastery levels
- Progress tracking
