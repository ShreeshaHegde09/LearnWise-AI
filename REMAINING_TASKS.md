# 🎯 Remaining Tasks - Priority Order

## CRITICAL FIXES (Do First)

### 1. Fix Summary Endpoint ✅ (Quick Fix)
**Error:** `cannot import name 'generate_content_with_gemini' from 'gemini_service'`
**Fix:** Use correct method from GeminiService class
**File:** `backend/app_minimal.py`

### 2. Fix File Extraction & Content Generation
**Issue:** Files not extracting correctly, learning content not generating
**Files to check:**
- `backend/app_minimal.py` - upload endpoint
- `backend/content_extractor.py` - extraction logic
- `backend/gemini_service.py` - chunk generation

### 3. Remove 404 /log Errors
**Issue:** Frontend trying to POST to `/log` endpoint that doesn't exist
**Fix:** Find and remove/fix the logging calls in frontend components

## UI IMPROVEMENTS

### 4. Create Landing Page (Not Logged In)
**Requirements:**
- Show when user NOT logged in
- Login and Signup buttons
- Project information
- Developers: Shreesha Hegde, Vishaka V, Spurthi B S
- Red/black theme
**File:** `frontend/src/app/page.tsx`

### 5. Improve Login/Signup Pages
**Requirements:**
- Make them prettier
- Red/black theme
- Better styling
**Files:**
- `frontend/src/components/LoginPage.tsx`
- `frontend/src/components/SignupPage.tsx`

### 6. Dashboard Improvements
**Remove:**
- "Flashcards Due for Review" section

**Add:**
- Click on topic card → Opens detailed page with:
  - All flashcards from that topic
  - Summary button
  - Date of last learning
  - Quiz button
  - All in single new page

**Files:**
- `frontend/src/components/Dashboard.tsx`
- Create: `frontend/src/app/topic/[id]/page.tsx` (new detail page)

## PRIORITY ORDER

1. **Fix summary endpoint** (5 min) - Quick win
2. **Fix file extraction** (15 min) - Critical for functionality
3. **Remove /log errors** (10 min) - Clean up console
4. **Landing page** (30 min) - Important for UX
5. **Pretty login/signup** (20 min) - Polish
6. **Dashboard improvements** (45 min) - Feature enhancement

## Estimated Total Time: ~2 hours

Let's start with the quick fixes first!
