# LearnWise AI - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Backend Documentation](#backend-documentation)
7. [Frontend Documentation](#frontend-documentation)
8. [Database Schema](#database-schema)
9. [API Documentation](#api-documentation)
10. [Emotion Detection System](#emotion-detection-system)
11. [Chrome Extension](#chrome-extension)
12. [Setup & Installation](#setup--installation)
13. [Configuration](#configuration)
14. [Deployment](#deployment)
15. [Testing](#testing)
16. [Troubleshooting](#troubleshooting)
17. [Contributing](#contributing)
18. [Future Enhancements](#future-enhancements)

---

## Project Overview

### What is LearnWise AI?

LearnWise AI is an intelligent, adaptive learning platform that combines artificial intelligence, emotion detection, and personalized content delivery to create an optimal learning experience. The system monitors learner engagement through facial emotion recognition and attention tracking, dynamically adjusting content difficulty and providing timely interventions.

### Key Objectives

1. **Personalized Learning**: Adapt content based on user's emotional state and comprehension
2. **Engagement Monitoring**: Real-time tracking of attention and emotional responses
3. **Intelligent Interventions**: Proactive support when learners struggle or lose focus
4. **Content Generation**: AI-powered creation of learning materials, quizzes, and flashcards
5. **Progress Tracking**: Comprehensive analytics and progress monitoring

### Target Users

- Students seeking personalized learning experiences
- Self-learners and lifelong learners
- Educational institutions
- Corporate training programs

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│              (Next.js React Application)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Firebase   │ │   Backend   │ │   Chrome     │
│ (Auth & DB)  │ │   (Flask)   │ │  Extension   │
└──────────────┘ └──────┬──────┘ └──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Gemini AI  │ │  Emotion    │ │  SQLite DB   │
│   Service    │ │  Detection  │ │              │
└──────────────┘ └─────────────┘ └──────────────┘
```


### Component Interaction Flow

1. **User Authentication**: Firebase Authentication handles user login/signup
2. **Content Upload**: Users upload study materials (PDF, TXT, DOCX)
3. **Content Processing**: Backend extracts and processes content
4. **AI Generation**: Gemini AI generates structured learning chunks
5. **Learning Session**: User studies with real-time emotion monitoring
6. **Interventions**: System provides help based on emotional state
7. **Assessment**: Quizzes and flashcards test comprehension
8. **Progress Tracking**: Firestore stores user progress and analytics

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Icons**: Lucide React

### Backend
- **Framework**: Flask (Python 3.9+)
- **AI Service**: Google Gemini API
- **Database**: SQLite (local), Firestore (cloud)
- **File Processing**: PyPDF2, python-docx, pdfplumber
- **CORS**: Flask-CORS
- **Environment**: python-dotenv

### AI & ML
- **LLM**: Google Gemini 1.5 Flash
- **Emotion Detection**: TensorFlow.js (browser-based)
- **Models**: MobileNet, EfficientNet, Custom CNN

### Chrome Extension
- **Manifest**: V3
- **APIs**: Tabs, Storage, Alarms
- **Communication**: Message passing

### Development Tools
- **Package Manager**: npm (frontend), pip (backend)
- **Version Control**: Git
- **Code Editor**: VS Code
- **Testing**: Vitest (frontend), pytest (backend)

---

## Project Structure

```
NovProject/
│
├── backend/                      # Python Flask Backend
│   ├── app_minimal.py           # Main application file
│   ├── gemini_service.py        # Gemini AI integration
│   ├── content_extractor.py     # File processing utilities
│   ├── init_db.py               # Database initialization
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables
│   ├── start_server.bat         # Server startup script
│   ├── models/                  # AI model files
│   ├── uploads/                 # Uploaded files storage
│   └── instance/                # SQLite database
│
├── frontend/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── learning/        # Learning page
│   │   │   ├── login/           # Login page
│   │   │   ├── signup/          # Signup page
│   │   │   └── topic/[topic]/   # Topic detail page
│   │   │
│   │   ├── components/          # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LearningPage.tsx
│   │   │   ├── LearningInterface.tsx
│   │   │   ├── TopicDetailPage.tsx
│   │   │   ├── EmotionDetector.tsx
│   │   │   ├── AttentionTracker.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── Flashcards.tsx
│   │   │   ├── ChatBot.tsx
│   │   │   └── ... (25+ components)
│   │   │
│   │   ├── lib/                 # Utility libraries
│   │   │   ├── firebase.ts      # Firebase config
│   │   │   ├── firestoreService.ts
│   │   │   ├── EmotionStateManager.ts
│   │   │   ├── KiroEmotionEngine.ts
│   │   │   ├── TierEvaluator.ts
│   │   │   └── ... (15+ utilities)
│   │   │
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── types/               # TypeScript types
│   │   │   ├── dashboard.types.ts
│   │   │   └── kiro.types.ts
│   │   │
│   │   └── config/              # Configuration
│   │       ├── kiro.config.ts
│   │       └── emotionModels.ts
│   │
│   ├── public/                  # Static assets
│   ├── .env.local              # Environment variables
│   ├── package.json            # Dependencies
│   ├── next.config.js          # Next.js config
│   ├── tailwind.config.js      # Tailwind config
│   └── tsconfig.json           # TypeScript config
│
├── chrome-extension/            # Browser Extension
│   ├── manifest.json           # Extension manifest
│   ├── background.js           # Background service worker
│   ├── content.js              # Content script
│   ├── popup.html              # Extension popup
│   └── popup.js                # Popup logic
│
├── ai-models/                   # AI Model Files
│   ├── emotion_detector.py
│   ├── content_generator.py
│   └── README.md
│
├── database/                    # Database
│   └── schema.sql              # Database schema
│
└── Documentation Files
    ├── README.md
    ├── QUICK_START.md
    ├── AUTHENTICATION_SETUP_GUIDE.md
    ├── FIREBASE_SETUP.md
    ├── CHROME_EXTENSION_SETUP.md
    └── ... (various guides)
```


---

## Core Features

### 1. User Authentication & Management
- **Firebase Authentication**: Secure email/password authentication
- **User Profiles**: Personalized user accounts
- **Session Management**: Persistent login sessions
- **Protected Routes**: Route guards for authenticated pages

### 2. Content Upload & Processing
- **Supported Formats**: PDF, TXT, DOCX
- **Content Extraction**: Intelligent text extraction from documents
- **Topic Detection**: Automatic topic identification
- **Chunking**: Content divided into digestible learning chunks

### 3. AI-Powered Learning Content
- **Dynamic Generation**: Gemini AI creates structured learning materials
- **Adaptive Difficulty**: Content adjusts based on user performance
- **Learning Objectives**: Clear objectives for each section
- **Estimated Time**: Reading time estimates for planning

### 4. Real-Time Emotion Detection
- **Facial Analysis**: Browser-based emotion recognition
- **7 Emotions**: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral
- **Confidence Scoring**: Emotion confidence levels
- **Privacy-First**: All processing happens in the browser

### 5. Intelligent Intervention System
- **Tier 1 Interventions**: Content simplification for confusion
- **Tier 2 Interventions**: Break suggestions for disengagement
- **Cooldown Periods**: Prevents intervention flooding
- **Contextual Timing**: Interventions at appropriate moments

### 6. Attention Tracking
- **Focus Monitoring**: Tracks user attention during learning
- **Distraction Detection**: Identifies when user loses focus
- **Time Tracking**: Records time spent on each section
- **Engagement Metrics**: Comprehensive engagement analytics

### 7. Interactive Learning Tools

#### Quizzes
- **AI-Generated**: Questions created from learning content
- **Multiple Choice**: Various question types
- **Instant Feedback**: Immediate answer explanations
- **Score Tracking**: Performance history

#### Flashcards
- **Spaced Repetition**: Optimized review scheduling
- **Difficulty Levels**: Easy, Medium, Hard
- **Progress Tracking**: Correct/incorrect counts
- **Interactive Review**: Flip-card interface

#### AI Chatbot
- **Context-Aware**: Understands current learning content
- **Question Answering**: Answers questions about material
- **Clarification**: Explains difficult concepts
- **24/7 Availability**: Always available for help

### 8. Progress Dashboard
- **Topic Overview**: All learning topics in one place
- **Progress Tracking**: Visual progress indicators
- **Statistics**: Materials, flashcards, quizzes count
- **Last Studied**: Track recent activity
- **Mastery Levels**: Overall topic mastery

### 9. Topic Detail Pages
- **Material Management**: View all materials for a topic
- **Quiz History**: See past quiz scores
- **Flashcard Library**: Access all flashcards
- **AI Summary**: Generate topic summaries
- **Study Button**: Quick access to learning

### 10. Settings & Customization
- **Emotion Detection Toggle**: Enable/disable emotion tracking
- **Camera Permissions**: Manage camera access
- **Capture Frequency**: Adjust detection frequency
- **Theme**: Dark mode interface

---

## Backend Documentation

### Main Application (app_minimal.py)

The backend is a Flask application that handles all server-side operations.

#### Key Components

1. **Flask App Initialization**
```python
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///learning_system.db'
```

2. **Database Models**
- `LearningMaterial`: Stores uploaded materials
- `LearningSession`: Tracks learning sessions
- `EmotionData`: Stores emotion detection data
- `AttentionData`: Stores attention tracking data

3. **Core Endpoints**

#### File Upload & Processing
```
POST /api/upload-material
- Accepts: multipart/form-data
- Parameters: file, topic, user_id
- Returns: material_id, chunks, session_id
```

#### Content Generation
```
POST /api/continue-learning
- Generates new learning content from existing material
- Parameters: material_id, topic, content
- Returns: chunks, session_id
```

#### Quiz Generation
```
POST /api/generate-quiz
- Creates quiz from learning content
- Parameters: topic, content, question_count
- Returns: questions array
```

#### Flashcard Generation
```
POST /api/generate-flashcards
- Creates flashcards from content
- Parameters: topic, content, card_count
- Returns: flashcards array
```

#### AI Summary
```
POST /api/generate-summary
- Generates comprehensive topic summary
- Parameters: topic, content
- Returns: summary text
```

#### Chatbot
```
POST /api/chat
- Answers questions about learning content
- Parameters: message, current_chunk, context
- Returns: response text
```

#### Content Simplification
```
POST /api/simplify-content
- Simplifies difficult content
- Parameters: content, chunk_id
- Returns: simplified_content
```

#### Emotion Detection
```
POST /api/emotion/predict
- Processes emotion from image
- Parameters: image (base64)
- Returns: emotion, confidence, timestamp
```

### Gemini Service (gemini_service.py)

Handles all interactions with Google's Gemini AI.

#### Key Methods

1. **generate_learning_chunks()**: Creates structured learning content
2. **generate_quiz()**: Creates quiz questions
3. **generate_flashcards()**: Creates flashcard pairs
4. **generate_summary()**: Creates topic summaries
5. **chat_response()**: Handles chatbot conversations
6. **simplify_content()**: Simplifies complex content

### Content Extractor (content_extractor.py)

Extracts text from various file formats.

#### Supported Formats
- **PDF**: Using PyPDF2 and pdfplumber
- **DOCX**: Using python-docx
- **TXT**: Direct text reading


---

## Frontend Documentation

### Application Structure

The frontend is built with Next.js 14 using the App Router architecture.

### Key Pages

#### 1. Landing Page (`/`)
- Welcome screen
- Login/Signup options
- Feature highlights

#### 2. Dashboard (`/dashboard`)
- Topic cards with progress
- Quick stats (materials, flashcards, quizzes)
- Upload new material button
- Recent activity

#### 3. Learning Page (`/learning`)
- Material selection or upload
- Learning interface with chunks
- Emotion detection
- Attention tracking
- Chatbot sidebar
- Quiz and flashcard access

#### 4. Topic Detail Page (`/topic/[topic]`)
- Topic overview
- All materials for topic
- Flashcard library
- Quiz history
- Generate AI summary
- Generate new flashcards/quizzes

### Core Components

#### LearningInterface.tsx
The main learning experience component.

**Features:**
- Chunk navigation
- Progress tracking
- Content display
- Emotion detection integration
- Attention tracking
- Chatbot integration
- Quiz/flashcard modals
- Time tracking
- Completion modal

**State Management:**
- Current chunk index
- Completed chunks
- Sidebar visibility
- Quiz/flashcard visibility
- Emotion state
- Settings

#### EmotionDetector.tsx
Handles real-time emotion detection.

**Features:**
- Camera access
- Face detection
- Emotion classification
- Confidence scoring
- State updates
- Privacy controls

**Emotion States:**
- Happy
- Sad
- Angry
- Surprised
- Fearful
- Disgusted
- Neutral

#### AttentionTracker.tsx
Monitors user attention and engagement.

**Features:**
- Time tracking
- Focus detection
- Distraction alerts
- Engagement scoring
- Intervention triggers

#### Dashboard.tsx
Main dashboard component.

**Features:**
- Topic cards
- Progress visualization
- Statistics display
- Material upload
- Navigation

#### TopicDetailPage.tsx
Detailed view of a specific topic.

**Features:**
- Material list
- Flashcard display
- Quiz history
- AI summary generation
- New quiz/flashcard generation
- Study button

#### Quiz.tsx
Interactive quiz component.

**Features:**
- Question display
- Multiple choice options
- Answer validation
- Explanations
- Score calculation
- Progress tracking

#### Flashcards.tsx
Flashcard review component.

**Features:**
- Card flipping
- Navigation
- Difficulty marking
- Progress tracking
- Spaced repetition

#### ChatBot.tsx
AI-powered learning assistant.

**Features:**
- Context-aware responses
- Question answering
- Clarification
- Resizable sidebar
- Chat history

### State Management

#### AuthContext
Manages authentication state across the app.

**Provides:**
- Current user
- Login function
- Logout function
- Signup function
- Loading state

### Services & Utilities

#### firestoreService.ts
Handles all Firestore database operations.

**Methods:**
- `getStudyMaterials()`: Fetch user materials
- `addStudyMaterial()`: Add new material
- `updateStudyMaterial()`: Update material
- `getFlashcards()`: Fetch flashcards
- `addFlashcard()`: Add flashcard
- `getQuizzes()`: Fetch quizzes
- `addQuiz()`: Add quiz
- `getTopicSummaries()`: Get topic summaries

#### EmotionStateManager.ts
Manages emotion detection state and history.

**Features:**
- Emotion history tracking
- State transitions
- Confidence thresholds
- Action suggestions

#### KiroEmotionEngine.ts
Advanced emotion analysis engine.

**Features:**
- Multi-frame analysis
- Confidence smoothing
- Pattern detection
- Intervention recommendations

#### TierEvaluator.ts
Evaluates when interventions are needed.

**Tiers:**
- **Tier 1**: Confusion/Frustration → Simplify content
- **Tier 2**: Disengagement → Suggest break

**Criteria:**
- Emotion duration
- Confidence levels
- Attention metrics
- Cooldown periods

#### VisibilityMonitor.ts
Monitors if user is visible to camera.

**Features:**
- Face detection
- Visibility tracking
- Alert triggering
- Auto-resolution

### Styling

#### Tailwind CSS
Utility-first CSS framework.

**Theme:**
- Dark mode by default
- Red/orange accent colors
- Gradient backgrounds
- Smooth animations

#### Framer Motion
Animation library for smooth transitions.

**Used for:**
- Page transitions
- Modal animations
- Card hover effects
- Progress animations

---

## Database Schema

### SQLite (Backend)

#### learning_materials
```sql
CREATE TABLE learning_materials (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT,
    topic TEXT,
    content TEXT,
    file_path TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### learning_sessions
```sql
CREATE TABLE learning_sessions (
    id INTEGER PRIMARY KEY,
    material_id INTEGER,
    user_id INTEGER,
    session_id TEXT,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    chunks_completed INTEGER,
    total_chunks INTEGER,
    FOREIGN KEY (material_id) REFERENCES learning_materials(id)
);
```

#### emotion_data
```sql
CREATE TABLE emotion_data (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    emotion TEXT,
    confidence REAL,
    timestamp TIMESTAMP
);
```

#### attention_data
```sql
CREATE TABLE attention_data (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    attention_score REAL,
    timestamp TIMESTAMP
);
```

### Firestore (Cloud)

#### studyMaterials Collection
```typescript
{
  id: string,
  userId: string,
  title: string,
  topic: string,
  content: string,
  progress: number,
  createdAt: Timestamp,
  lastStudied?: Timestamp
}
```

#### flashcards Collection
```typescript
{
  id: string,
  userId: string,
  topic: string,
  question: string,
  answer: string,
  difficulty: 'easy' | 'medium' | 'hard',
  correctCount: number,
  incorrectCount: number,
  lastReviewed?: Timestamp,
  nextReview?: Timestamp
}
```

#### quizzes Collection
```typescript
{
  id: string,
  userId: string,
  topic: string,
  title: string,
  questions: QuizQuestion[],
  score?: number,
  completedAt?: Timestamp,
  createdAt: Timestamp
}
```


---

## API Documentation

### Authentication
All API requests to protected endpoints require authentication via Firebase Auth tokens.

### Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com
```

### Endpoints

#### 1. Upload Material
```http
POST /api/upload-material
Content-Type: multipart/form-data

Parameters:
- file: File (PDF, TXT, DOCX)
- topic: string
- user_id: string

Response:
{
  "material_id": "123",
  "session_id": "session_456",
  "topic": "Machine Learning",
  "chunks": [
    {
      "id": 1,
      "title": "Introduction",
      "content": "<p>...</p>",
      "estimated_time": "5 min"
    }
  ]
}
```

#### 2. Continue Learning
```http
POST /api/continue-learning
Content-Type: application/json

Body:
{
  "material_id": "123",
  "topic": "Neural Networks",
  "user_id": "user_789",
  "content": "...",
  "title": "ML Basics"
}

Response:
{
  "session_id": "session_456",
  "topic": "Neural Networks",
  "chunks": [...]
}
```

#### 3. Generate Quiz
```http
POST /api/generate-quiz
Content-Type: application/json

Body:
{
  "topic": "Python Programming",
  "content": "...",
  "question_count": 5
}

Response:
{
  "questions": [
    {
      "question": "What is a variable?",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "..."
    }
  ]
}
```

#### 4. Generate Flashcards
```http
POST /api/generate-flashcards
Content-Type: application/json

Body:
{
  "topic": "Data Structures",
  "content": "...",
  "card_count": 10
}

Response:
{
  "flashcards": [
    {
      "front": "What is a stack?",
      "back": "A LIFO data structure...",
      "difficulty": "medium"
    }
  ]
}
```

#### 5. Generate Summary
```http
POST /api/generate-summary
Content-Type: application/json

Body:
{
  "topic": "Algorithms",
  "content": "..."
}

Response:
{
  "summary": "This topic covers...",
  "topic": "Algorithms"
}
```

#### 6. Chat
```http
POST /api/chat
Content-Type: application/json

Body:
{
  "message": "What is recursion?",
  "current_chunk": {...},
  "context": "..."
}

Response:
{
  "response": "Recursion is a programming technique..."
}
```

#### 7. Simplify Content
```http
POST /api/simplify-content
Content-Type: application/json

Body:
{
  "session_id": "session_123",
  "chunk_id": 1,
  "content": "Complex technical content..."
}

Response:
{
  "simplified_content": "<p>Simpler explanation...</p>"
}
```

#### 8. Emotion Prediction
```http
POST /api/emotion/predict
Content-Type: application/json

Body:
{
  "image": "base64_encoded_image_data"
}

Response:
{
  "emotion": "happy",
  "confidence": 0.87,
  "timestamp": "2025-11-29T10:30:00Z",
  "all_emotions": {
    "happy": 0.87,
    "neutral": 0.10,
    "sad": 0.03
  }
}
```

### Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description",
  "status": 400
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Emotion Detection System

### Overview
The emotion detection system uses TensorFlow.js to perform real-time facial emotion recognition directly in the browser.

### Architecture

```
Camera → Face Detection → Emotion Classification → State Management → Interventions
```

### Components

#### 1. EmotionDetector.tsx
Main component that handles camera access and emotion detection.

**Process:**
1. Request camera permission
2. Capture video frames
3. Detect faces using TensorFlow.js
4. Classify emotions
5. Update state
6. Trigger interventions

#### 2. EmotionStateManager.ts
Manages emotion history and state transitions.

**Features:**
- Rolling window of recent emotions
- Confidence thresholding
- State persistence
- Action suggestions

#### 3. KiroEmotionEngine.ts
Advanced emotion analysis engine.

**Features:**
- Multi-frame analysis
- Exponential moving average smoothing
- Pattern detection
- Confidence calibration

#### 4. TierEvaluator.ts
Determines when interventions are needed.

**Tier 1 Triggers:**
- Confusion for 15+ seconds
- Frustration for 20+ seconds
- Confidence > 0.6

**Tier 2 Triggers:**
- Boredom for 30+ seconds
- Disengagement for 45+ seconds
- Confidence > 0.5

**Cooldown:**
- 2 minutes between Tier 1 interventions
- 5 minutes between Tier 2 interventions

### Emotion Categories

1. **Happy**: Positive engagement
2. **Neutral**: Normal state
3. **Sad**: Potential disengagement
4. **Angry**: Frustration
5. **Surprised**: Unexpected content
6. **Fearful**: Anxiety or confusion
7. **Disgusted**: Strong negative reaction

### Privacy & Security

- **Browser-Only Processing**: All emotion detection happens locally
- **No Data Upload**: Facial images never leave the user's device
- **User Control**: Can be disabled in settings
- **Transparent**: Clear indicators when active

### Performance Optimization

- **Capture Frequency**: Adjustable (default: every 7 seconds)
- **Frame Skipping**: Reduces CPU usage
- **Model Optimization**: Lightweight models for speed
- **Web Workers**: Offload processing from main thread

---

## Chrome Extension

### Purpose
Monitors user's screen activity and tab switching to detect attention loss.

### Features

1. **Tab Switching Detection**: Tracks when user switches tabs
2. **Idle Time Monitoring**: Detects when user is inactive
3. **Focus Tracking**: Monitors window focus
4. **Data Collection**: Sends attention data to backend

### Files

#### manifest.json
Extension configuration and permissions.

```json
{
  "manifest_version": 3,
  "name": "LearnWise Attention Monitor",
  "version": "1.0",
  "permissions": ["tabs", "storage", "alarms"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

#### background.js
Background service worker that monitors activity.

**Functions:**
- Track active tab
- Monitor idle time
- Send data to backend
- Handle alarms

#### content.js
Content script injected into web pages.

**Functions:**
- Detect page visibility
- Track focus events
- Communicate with background script

#### popup.html & popup.js
Extension popup interface.

**Features:**
- Enable/disable monitoring
- View statistics
- Configure settings

### Installation

1. Open Chrome Extensions (`chrome://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension` folder
5. Extension icon appears in toolbar

### Usage

1. Click extension icon
2. Enable monitoring
3. Start learning session
4. Extension tracks attention automatically


---

## Setup & Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: 3.9 or higher
- **npm**: v9.0.0 or higher
- **pip**: Latest version
- **Git**: For version control
- **Google Chrome**: For extension (optional)

### Backend Setup

#### 1. Navigate to Backend Directory
```bash
cd NovProject/backend
```

#### 2. Create Virtual Environment
```bash
python -m venv venv
```

#### 3. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

#### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 5. Configure Environment Variables

Create `.env` file in `backend/` directory:

```env
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Database
DATABASE_URL=sqlite:///learning_system.db

# CORS
CORS_ORIGINS=http://localhost:3000
```

#### 6. Initialize Database
```bash
python init_db.py
```

#### 7. Start Backend Server

**Windows:**
```bash
start_server.bat
```

**Mac/Linux:**
```bash
python app_minimal.py
```

Server runs on: `http://localhost:5000`

### Frontend Setup

#### 1. Navigate to Frontend Directory
```bash
cd NovProject/frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables

Create `.env.local` file in `frontend/` directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 4. Start Development Server

**Windows:**
```bash
start_dev.bat
```

**Mac/Linux:**
```bash
npm run dev
```

Application runs on: `http://localhost:3000`

### Chrome Extension Setup

#### 1. Open Chrome Extensions
Navigate to: `chrome://extensions/`

#### 2. Enable Developer Mode
Toggle "Developer mode" in top right

#### 3. Load Extension
1. Click "Load unpacked"
2. Select `NovProject/chrome-extension` folder
3. Extension appears in toolbar

#### 4. Configure Extension
1. Click extension icon
2. Enable monitoring
3. Set preferences

### Firebase Setup

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow setup wizard

#### 2. Enable Authentication
1. Go to Authentication
2. Enable Email/Password provider
3. Configure settings

#### 3. Create Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Start in production mode
4. Choose location

#### 4. Set Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /studyMaterials/{document} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
    }
    match /flashcards/{document} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
    }
    match /quizzes/{document} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
    }
  }
}
```

#### 5. Get Configuration
1. Go to Project Settings
2. Scroll to "Your apps"
3. Click web app icon
4. Copy configuration
5. Add to `.env.local`

### Gemini AI Setup

#### 1. Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy key

#### 2. Add to Backend .env
```env
GEMINI_API_KEY=your_api_key_here
```

### Verification

#### 1. Check Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status": "healthy", "message": "Backend is running!"}
```

#### 2. Check Frontend
Open browser: `http://localhost:3000`

Should see landing page

#### 3. Test Authentication
1. Click "Sign Up"
2. Create account
3. Should redirect to dashboard

#### 4. Test Upload
1. Upload a PDF/TXT file
2. Should process and show learning interface

---

## Configuration

### Backend Configuration

#### Flask Settings (app_minimal.py)
```python
# Debug mode
app.config['DEBUG'] = True

# Database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///learning_system.db'

# Upload folder
app.config['UPLOAD_FOLDER'] = 'uploads/'

# Max file size (16MB)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
```

#### Gemini Service Settings
```python
# Model selection
MODEL_NAME = "gemini-1.5-flash"

# Generation config
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}
```

### Frontend Configuration

#### Next.js Config (next.config.js)
```javascript
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}
```

#### Tailwind Config (tailwind.config.js)
```javascript
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#DC2626',
        secondary: '#EA580C',
      },
    },
  },
}
```

#### Emotion Detection Settings
```typescript
// Default settings
{
  enabled: true,
  captureFrequency: 7, // seconds
  cloudRecalibrationEnabled: true,
  cameraPermissionGranted: false
}
```

#### Kiro Config (kiro.config.ts)
```typescript
export const KIRO_CONFIG = {
  TIER_1_COOLDOWN: 120000, // 2 minutes
  TIER_2_COOLDOWN: 300000, // 5 minutes
  EMOTION_WINDOW_SIZE: 10,
  CONFIDENCE_THRESHOLD: 0.6,
  // ... more settings
}
```

### Environment Variables

#### Backend (.env)
```env
GEMINI_API_KEY=
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///learning_system.db
CORS_ORIGINS=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=http://localhost:5000
```


---

## Deployment

### Backend Deployment

#### Option 1: Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
cd backend
heroku create your-app-name
```

4. **Set Environment Variables**
```bash
heroku config:set GEMINI_API_KEY=your_key
heroku config:set FLASK_ENV=production
```

5. **Create Procfile**
```
web: gunicorn app_minimal:app
```

6. **Deploy**
```bash
git push heroku main
```

#### Option 2: Railway

1. Go to [Railway.app](https://railway.app/)
2. Connect GitHub repository
3. Select backend folder
4. Add environment variables
5. Deploy automatically

#### Option 3: DigitalOcean

1. Create Droplet (Ubuntu)
2. SSH into server
3. Install Python and dependencies
4. Clone repository
5. Set up Nginx reverse proxy
6. Use systemd for process management

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
cd frontend
vercel
```

4. **Set Environment Variables**
- Go to Vercel dashboard
- Add all NEXT_PUBLIC_* variables
- Redeploy

#### Option 2: Netlify

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

#### Option 3: Self-Hosted

1. Build production bundle
```bash
npm run build
```

2. Start production server
```bash
npm start
```

3. Use PM2 for process management
```bash
npm install -g pm2
pm2 start npm --name "learnwise" -- start
```

### Database Migration

#### From SQLite to PostgreSQL

1. **Install PostgreSQL**
```bash
pip install psycopg2-binary
```

2. **Update Database URL**
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

3. **Migrate Data**
```bash
python migrate_db.py
```

### SSL/HTTPS Setup

#### Using Let's Encrypt

1. **Install Certbot**
```bash
sudo apt-get install certbot
```

2. **Get Certificate**
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. **Configure Nginx**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
    }
}
```

### Production Checklist

- [ ] Environment variables set
- [ ] Database backed up
- [ ] SSL certificate installed
- [ ] CORS configured correctly
- [ ] Error logging enabled
- [ ] Performance monitoring set up
- [ ] Firestore security rules updated
- [ ] API rate limiting configured
- [ ] CDN configured for static assets
- [ ] Backup strategy in place

---

## Testing

### Backend Testing

#### Unit Tests
```bash
cd backend
pytest tests/
```

#### API Testing
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test upload
curl -X POST -F "file=@test.pdf" -F "topic=Test" \
  http://localhost:5000/api/upload-material
```

### Frontend Testing

#### Component Tests
```bash
cd frontend
npm run test
```

#### E2E Tests
```bash
npm run test:e2e
```

#### Manual Testing Checklist

**Authentication:**
- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Logout
- [ ] Password reset

**File Upload:**
- [ ] Upload PDF
- [ ] Upload TXT
- [ ] Upload DOCX
- [ ] Invalid file type rejection

**Learning Interface:**
- [ ] Navigate between chunks
- [ ] Mark chunks complete
- [ ] Open chatbot
- [ ] Simplify content
- [ ] Take quiz
- [ ] Review flashcards

**Emotion Detection:**
- [ ] Camera permission request
- [ ] Emotion detection active
- [ ] Tier 1 intervention triggers
- [ ] Tier 2 intervention triggers
- [ ] Settings toggle works

**Dashboard:**
- [ ] View all topics
- [ ] Click topic card
- [ ] View statistics
- [ ] Upload new material

**Topic Detail:**
- [ ] View materials
- [ ] Generate summary
- [ ] Generate flashcards
- [ ] Generate quiz
- [ ] Study button works

### Performance Testing

#### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/health
```

#### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit
4. Review scores

### Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Problem:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
pip install -r requirements.txt
```

**Problem:** `Port 5000 already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

#### Frontend Won't Start

**Problem:** `Module not found: Can't resolve 'firebase'`

**Solution:**
```bash
npm install
```

**Problem:** `Error: Invalid Firebase configuration`

**Solution:**
Check `.env.local` file has all required variables

#### Emotion Detection Not Working

**Problem:** Camera permission denied

**Solution:**
1. Check browser permissions
2. Allow camera access
3. Refresh page

**Problem:** No face detected

**Solution:**
1. Ensure good lighting
2. Face camera directly
3. Check camera is working

#### Database Errors

**Problem:** `OperationalError: no such table`

**Solution:**
```bash
python init_db.py
```

**Problem:** `Database is locked`

**Solution:**
Close all connections and restart server

#### Firestore Permission Denied

**Problem:** `Missing or insufficient permissions`

**Solution:**
1. Check Firestore rules
2. Ensure user is authenticated
3. Verify userId matches

#### Gemini API Errors

**Problem:** `API key not valid`

**Solution:**
1. Check `.env` file
2. Verify API key is correct
3. Check API key has proper permissions

**Problem:** `Quota exceeded`

**Solution:**
1. Check API usage in Google Cloud Console
2. Upgrade plan if needed
3. Implement rate limiting

### Debug Mode

#### Enable Backend Debug
```python
app.config['DEBUG'] = True
```

#### Enable Frontend Debug
```bash
NEXT_PUBLIC_DEBUG=true npm run dev
```

#### View Logs

**Backend:**
```bash
tail -f backend/logs/app.log
```

**Frontend:**
Open browser console (F12)

### Getting Help

1. Check documentation
2. Search existing issues on GitHub
3. Ask in community forum
4. Contact support

---

## Contributing

### Development Workflow

1. **Fork Repository**
```bash
git clone https://github.com/yourusername/learnwise-ai.git
```

2. **Create Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**
- Write code
- Add tests
- Update documentation

4. **Commit Changes**
```bash
git add .
git commit -m "Add: your feature description"
```

5. **Push to GitHub**
```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**
- Go to GitHub
- Click "New Pull Request"
- Describe changes
- Submit for review

### Code Style

#### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings
- Max line length: 100

#### TypeScript (Frontend)
- Use ESLint
- Follow Airbnb style guide
- Use Prettier for formatting
- Write JSDoc comments

### Commit Message Format

```
Type: Brief description

Detailed description of changes

Fixes #issue_number
```

**Types:**
- `Add`: New feature
- `Fix`: Bug fix
- `Update`: Update existing feature
- `Remove`: Remove code/feature
- `Refactor`: Code refactoring
- `Docs`: Documentation changes
- `Test`: Add/update tests

### Pull Request Guidelines

- Clear title and description
- Link related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation
- Request review from maintainers


---

## Future Enhancements

### Planned Features

#### 1. Advanced Analytics Dashboard
- Detailed learning analytics
- Emotion patterns over time
- Attention heatmaps
- Performance trends
- Personalized insights

#### 2. Social Learning Features
- Study groups
- Peer collaboration
- Shared materials
- Discussion forums
- Leaderboards

#### 3. Mobile Applications
- iOS app (React Native)
- Android app (React Native)
- Offline mode
- Push notifications
- Mobile-optimized UI

#### 4. Enhanced AI Capabilities
- Voice interaction
- Speech-to-text notes
- Automatic summarization
- Concept mapping
- Adaptive difficulty

#### 5. Gamification
- Achievement badges
- Streak tracking
- Points system
- Challenges
- Rewards

#### 6. Advanced Content Types
- Video lessons
- Interactive simulations
- Code playgrounds
- 3D visualizations
- Audio lessons

#### 7. Integration Features
- Google Classroom
- Canvas LMS
- Moodle
- Zoom
- Microsoft Teams

#### 8. Accessibility Improvements
- Screen reader support
- Keyboard navigation
- High contrast mode
- Text-to-speech
- Adjustable font sizes

#### 9. Advanced Emotion Features
- Multi-person detection
- Emotion trends analysis
- Stress level monitoring
- Fatigue detection
- Personalized interventions

#### 10. Content Marketplace
- Share materials
- Purchase courses
- Creator monetization
- Rating system
- Content recommendations

### Technical Improvements

#### Performance
- Server-side rendering optimization
- Image optimization
- Code splitting
- Lazy loading
- Caching strategies

#### Security
- Two-factor authentication
- End-to-end encryption
- Security audits
- Penetration testing
- GDPR compliance

#### Scalability
- Microservices architecture
- Load balancing
- Database sharding
- CDN integration
- Auto-scaling

#### DevOps
- CI/CD pipeline
- Automated testing
- Docker containers
- Kubernetes orchestration
- Monitoring and alerting

---

## Appendix

### Glossary

**Chunk**: A section of learning content, typically 3-5 minutes of reading

**Emotion State**: Current detected emotion with confidence score

**Intervention**: System action to help struggling learner

**Tier 1**: Light intervention (content simplification)

**Tier 2**: Heavy intervention (break suggestion)

**Firestore**: Google's NoSQL cloud database

**Gemini**: Google's large language model API

**TensorFlow.js**: JavaScript machine learning library

**Next.js**: React framework for production

**Flask**: Python web framework

### Keyboard Shortcuts

**Learning Interface:**
- `←` Previous chunk
- `→` Next chunk
- `Space` Mark complete
- `C` Open chatbot
- `Q` Open quiz
- `F` Open flashcards
- `S` Simplify content
- `Esc` Close modals

**Dashboard:**
- `N` New upload
- `S` Search topics
- `/` Focus search

### File Size Limits

- **PDF**: 16 MB
- **TXT**: 5 MB
- **DOCX**: 10 MB
- **Images**: 5 MB

### Browser Requirements

**Minimum:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Recommended:**
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### API Rate Limits

**Gemini API:**
- Free tier: 60 requests/minute
- Paid tier: 1000 requests/minute

**Firebase:**
- Reads: 50,000/day (free)
- Writes: 20,000/day (free)

### Support Channels

- **Email**: support@learnwise-ai.com
- **Discord**: discord.gg/learnwise
- **GitHub Issues**: github.com/learnwise-ai/issues
- **Documentation**: docs.learnwise-ai.com

### License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 LearnWise AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Credits

**Development Team:**
- Project Lead: [Your Name]
- Backend Developer: [Name]
- Frontend Developer: [Name]
- UI/UX Designer: [Name]
- ML Engineer: [Name]

**Technologies:**
- Google Gemini AI
- Firebase
- TensorFlow.js
- Next.js
- Flask
- Tailwind CSS
- Framer Motion

**Special Thanks:**
- Open source community
- Beta testers
- Contributors
- Supporters

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Core learning features
- Emotion detection
- Attention tracking
- Quiz and flashcards
- AI chatbot
- Dashboard
- Topic management

### Version 0.9.0 (Beta)
- Beta testing phase
- Bug fixes
- Performance improvements
- UI refinements

### Version 0.5.0 (Alpha)
- Alpha testing
- Core features implementation
- Initial emotion detection
- Basic learning interface

---

## Contact Information

**Project Website**: https://learnwise-ai.com

**Documentation**: https://docs.learnwise-ai.com

**GitHub**: https://github.com/learnwise-ai

**Email**: contact@learnwise-ai.com

**Twitter**: @learnwise_ai

**LinkedIn**: linkedin.com/company/learnwise-ai

---

## Acknowledgments

This project was built with the support of:
- Google Cloud Platform
- Firebase
- Vercel
- Open source community
- Beta testers and early adopters

Thank you for using LearnWise AI! We're committed to making learning more effective, engaging, and personalized for everyone.

---

**Last Updated**: November 29, 2025

**Document Version**: 1.0.0

**Maintained By**: LearnWise AI Team
