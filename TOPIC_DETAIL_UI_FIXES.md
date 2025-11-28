# Topic Detail Page - UI Fixes Needed

## Issues to Fix:

### 1. ✅ Overall Progress Always 0%
**Problem**: Progress bar shows 0% even after studying
**Cause**: Progress not being tracked/updated in Firestore
**Fix**: Update progress when user completes learning chunks

### 2. ✅ AI Summary Button Not Working for New Topics
**Problem**: Summary button doesn't work for topics generated from existing materials
**Cause**: Need to check backend endpoint and data flow
**Fix**: Ensure summary generation works with all topics

### 3. ✅ Quiz Section - Remove "Start Quiz" Buttons
**Problem**: Too many "Start Quiz" buttons in lower section
**Change**: Just show quiz cards with scores, no buttons

### 4. ✅ Add Flashcards & Quiz Buttons Near Summary
**Problem**: No way to generate new flashcards/quizzes
**Fix**: Add buttons next to "Generate AI Summary":
- "Generate Flashcards" button
- "Generate Quiz" button

### 5. ✅ Last Studied Shows "Never"
**Problem**: Shows "Never" even after just studying
**Cause**: lastStudied not being updated in Firestore
**Fix**: Update lastStudied timestamp when user accesses topic

### 6. ✅ Study Materials Section - Remove Content Preview
**Problem**: Shows raw HTML content in preview
**Change**: 
- Remove content preview
- Show "Start Learning" button instead
- Button navigates to learning page with that material

## Implementation Priority:
1. Study Materials section (most visible issue)
2. Add Flashcards/Quiz buttons
3. Remove Start Quiz buttons from lower section
4. Fix Last Studied timestamp
5. Fix Overall Progress tracking
6. Fix AI Summary for new topics
