# LearnWise AI - Quick Reference Guide

## Quick Start Commands

### Backend
```bash
cd NovProject/backend
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
python app_minimal.py
```
**Runs on**: http://localhost:5000

### Frontend
```bash
cd NovProject/frontend
npm run dev
```
**Runs on**: http://localhost:3000

## Project Structure at a Glance

```
NovProject/
├── backend/
│   ├── app_minimal.py          # Main backend (USE THIS)
│   ├── gemini_service.py       # AI service
│   └── .env                    # API keys
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Pages (Next.js App Router)
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities
│   │   └── types/              # TypeScript types
│   └── .env.local              # Firebase config
│
└── chrome-extension/           # Browser extension
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/app_minimal.py` | Main backend application |
| `backend/gemini_service.py` | AI content generation |
| `frontend/src/components/LearningInterface.tsx` | Main learning UI |
| `frontend/src/components/Dashboard.tsx` | Dashboard |
| `frontend/src/components/EmotionDetector.tsx` | Emotion detection |
| `frontend/src/lib/firestoreService.ts` | Database operations |

## Essential Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_key_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Main API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload-material` | POST | Upload learning material |
| `/api/continue-learning` | POST | Generate new content |
| `/api/generate-quiz` | POST | Create quiz |
| `/api/generate-flashcards` | POST | Create flashcards |
| `/api/generate-summary` | POST | Generate summary |
| `/api/chat` | POST | Chatbot interaction |
| `/api/simplify-content` | POST | Simplify content |
| `/api/emotion/predict` | POST | Emotion detection |

## User Flow

1. **Sign Up/Login** → Firebase Auth
2. **Upload Material** → PDF/TXT/DOCX
3. **AI Processing** → Gemini generates chunks
4. **Learning Session** → Study with emotion tracking
5. **Interventions** → Help when needed
6. **Assessment** → Quizzes and flashcards
7. **Progress Tracking** → Dashboard analytics

## Component Hierarchy

```
App
├── AuthContext (Authentication)
├── Layout
│   ├── Header
│   └── Main Content
│       ├── Dashboard
│       │   └── TopicCards
│       ├── LearningPage
│       │   ├── MaterialSelector
│       │   ├── FileUpload
│       │   └── LearningInterface
│       │       ├── ChunkDisplay
│       │       ├── EmotionDetector
│       │       ├── AttentionTracker
│       │       ├── ChatBot
│       │       ├── Quiz
│       │       └── Flashcards
│       └── TopicDetailPage
│           ├── MaterialList
│           ├── FlashcardLibrary
│           └── QuizHistory
```

## Emotion Detection Flow

```
Camera → Face Detection → Emotion Classification → State Manager → Tier Evaluator → Intervention
```

**Emotions**: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral

**Tiers**:
- **Tier 1**: Confusion/Frustration → Simplify content
- **Tier 2**: Disengagement → Suggest break

## Database Collections

### Firestore
- `studyMaterials` - User uploaded materials
- `flashcards` - Generated flashcards
- `quizzes` - Quiz history and scores

### SQLite (Backend)
- `learning_materials` - Uploaded files
- `learning_sessions` - Session tracking
- `emotion_data` - Emotion logs
- `attention_data` - Attention logs

## Common Tasks

### Add New Component
```bash
cd frontend/src/components
# Create YourComponent.tsx
```

### Add New API Endpoint
```python
# In backend/app_minimal.py
@app.route('/api/your-endpoint', methods=['POST'])
def your_endpoint():
    # Your code here
    return jsonify({"result": "success"})
```

### Update Firestore Rules
```javascript
// Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /collection/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend won't start | `pip install -r requirements.txt` |
| Frontend won't start | `npm install` |
| Port 5000 in use | Kill process or change port |
| Camera not working | Check browser permissions |
| Firestore permission denied | Check auth and rules |
| Gemini API error | Verify API key in .env |

## Testing Checklist

- [ ] Backend health check: `curl http://localhost:5000/api/health`
- [ ] Frontend loads: Open `http://localhost:3000`
- [ ] Sign up works
- [ ] Login works
- [ ] File upload works
- [ ] Learning interface loads
- [ ] Emotion detection works
- [ ] Quiz generation works
- [ ] Flashcards work
- [ ] Dashboard shows data

## Deployment Quick Steps

### Backend (Heroku)
```bash
heroku create your-app
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
```

### Frontend (Vercel)
```bash
vercel
# Add environment variables in dashboard
```

## Important Links

- **Documentation**: PROJECT_DOCUMENTATION.md
- **Setup Guide**: QUICK_START.md
- **Firebase Setup**: AUTHENTICATION_SETUP_GUIDE.md
- **Recent Fixes**: TOPIC_DETAIL_FIXES_SUMMARY.md

## Support

- Check documentation first
- Search GitHub issues
- Contact: support@learnwise-ai.com

---

**Last Updated**: November 29, 2025
