# Smart Content Extraction & Persistent Learning

## New Features Implemented

### 1. 🎯 Smart Content Extraction

**Problem Solved:**
- Gemini was receiving entire file content (including irrelevant intro sections)
- Generated same generic content for every topic
- Quiz/flashcards asked about file introduction instead of actual topic

**Solution:**
Created `content_extractor.py` that intelligently extracts ONLY topic-relevant content before sending to Gemini.

**How It Works:**

1. **Keyword Extraction:**
   - Extracts important keywords from topic
   - Example: "Transactions in DBMS" → ["transactions", "dbms", "transactions in dbms"]

2. **Section Detection:**
   - Splits document into logical sections
   - Detects headers (markdown, numbered, ALL CAPS)
   - Falls back to paragraph splitting

3. **Relevance Scoring:**
   - Scores each section based on keyword frequency
   - Weights longer keywords more heavily
   - Bonus points for keywords in section headers

4. **Smart Selection:**
   - Sorts sections by relevance score
   - Takes top relevant sections (up to 80% of original)
   - Ensures minimum content threshold

**Benefits:**
- ✅ Gemini receives ONLY relevant content
- ✅ Faster processing (less content to analyze)
- ✅ More accurate chunk generation
- ✅ Quiz/flashcards focus on actual topic
- ✅ Better content quality

**Example:**
```
File: 500 pages DBMS textbook
Topic: "Transactions in DBMS"

Before: Sends all 500 pages → Gemini times out or uses first 4000 chars
After: Extracts 50 pages about transactions → Gemini generates perfect content
```

---

### 2. 📚 Persistent File Storage

**Problem Solved:**
- Had to re-upload same file every time
- Couldn't continue learning different chapters from same book
- Lost progress when closing browser

**Solution:**
- Store full file content in database
- Create separate learning sessions for each topic
- Material selector UI to continue learning

**New Database Structure:**

**LearningMaterial Table:**
- Stores uploaded files permanently
- Full content saved
- Tracks last accessed time
- One material = one uploaded file/book

**LearningSession Table:**
- Multiple sessions per material
- Each session = one topic/chapter
- Stores generated chunks
- Tracks progress percentage

**Workflow:**

1. **First Upload:**
   ```
   Upload "DBMS_Textbook.pdf"
   → Saved as Material ID: 1
   → Topic: "Chapter 1: Introduction"
   → Creates Session ID: 1
   ```

2. **Continue Learning (Days Later):**
   ```
   Select Material ID: 1 (DBMS_Textbook.pdf)
   → Enter Topic: "Chapter 5: Transactions"
   → Extracts transaction-related content
   → Creates Session ID: 2
   → No re-upload needed!
   ```

3. **Another Topic:**
   ```
   Select Material ID: 1 (same book)
   → Enter Topic: "Chapter 8: Normalization"
   → Creates Session ID: 3
   ```

---

### 3. 🎨 Material Selector UI

**Features:**

1. **Material Library:**
   - Shows all uploaded materials
   - Sorted by last accessed (recent first)
   - Displays file size and upload date
   - Search functionality

2. **Quick Actions:**
   - Click material to select
   - Enter new topic/chapter
   - Continue learning button
   - New upload button

3. **Visual Design:**
   - Card-based layout
   - Hover effects
   - Selected state highlighting
   - Responsive grid

---

## API Endpoints

### New Endpoints:

1. **GET `/api/materials/<user_id>`**
   - Get all uploaded materials for user
   - Returns: id, title, filename, dates, content_length

2. **GET `/api/materials/<material_id>/sessions`**
   - Get all learning sessions for a material
   - Returns: session id, topic, progress, dates

3. **POST `/api/continue-learning`**
   - Continue learning from existing material
   - Body: `{ material_id, topic, user_id }`
   - Returns: session data with chunks

### Updated Endpoints:

1. **POST `/api/upload-material`**
   - Now saves full content to database
   - Checks for existing material (updates if exists)
   - Uses smart extraction before generating chunks
   - Creates learning session
   - Returns: material_id, session_id, chunks

---

## Usage Guide

### First Time Upload:

1. **Start Application:**
   - Opens to Material Selector screen
   - Click "New Upload" button

2. **Upload File:**
   - Select file (PDF, DOCX, PPTX, TXT)
   - Enter topic (e.g., "Chapter 1: Introduction")
   - Click "Start Learning Journey"

3. **Learning:**
   - Content generated specifically for your topic
   - Progress tracked
   - Can complete and return later

### Continue Learning:

1. **Open Application:**
   - See list of previously uploaded materials
   - Search if you have many files

2. **Select Material:**
   - Click on the book/document you want to continue
   - Card highlights when selected

3. **Enter New Topic:**
   - Type the chapter/unit you want to learn
   - Examples:
     - "Chapter 5: Transactions"
     - "Unit 3: Normalization"
     - "Section 2.4: JOIN Operations"
     - "Transactions in DBMS"

4. **Continue:**
   - Click "Continue Learning"
   - System extracts relevant content
   - Generates new chunks for that topic
   - Start learning!

---

## Technical Details

### Content Extraction Algorithm:

```python
def extract_topic_content(full_content, topic):
    1. Extract keywords from topic
    2. Split content into sections
    3. Score each section:
       - Count keyword occurrences
       - Weight by keyword length
       - Bonus for header matches
    4. Sort by score (highest first)
    5. Take top sections (up to 80% of original)
    6. Return extracted content
```

### Database Schema:

```sql
-- Materials (uploaded files)
CREATE TABLE learning_material (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(200),
    filename VARCHAR(200),
    content TEXT,  -- Full file content
    uploaded_at DATETIME,
    last_accessed DATETIME
);

-- Sessions (learning instances)
CREATE TABLE learning_session (
    id INTEGER PRIMARY KEY,
    material_id INTEGER,  -- FK to learning_material
    user_id INTEGER,
    topic VARCHAR(200),  -- Specific chapter/topic
    chunks TEXT,  -- JSON of generated chunks
    progress INTEGER,  -- 0-100%
    created_at DATETIME,
    updated_at DATETIME
);
```

---

## Benefits

### For Users:

1. **No Re-uploading:**
   - Upload once, learn forever
   - Continue from where you left off
   - Learn different chapters without re-upload

2. **Better Content:**
   - Focused on your specific topic
   - No irrelevant introductory content
   - Accurate quiz/flashcards

3. **Organized Learning:**
   - See all your materials in one place
   - Track what you've learned
   - Easy to find and continue

### For System:

1. **Faster Processing:**
   - Less content to send to Gemini
   - Quicker response times
   - Lower API costs

2. **Better Accuracy:**
   - Gemini receives relevant content only
   - More focused generation
   - Higher quality output

3. **Scalability:**
   - Store files once
   - Reuse for multiple sessions
   - Efficient database usage

---

## Examples

### Example 1: Learning from Textbook

```
Day 1:
- Upload: "Database_Systems.pdf" (500 pages)
- Topic: "Chapter 1: Introduction to Databases"
- System extracts: Pages 1-25
- Generates: 6 chunks about database basics

Day 5:
- Select: "Database_Systems.pdf" (no upload!)
- Topic: "Chapter 5: Transactions and Concurrency"
- System extracts: Pages 150-200
- Generates: 8 chunks about transactions

Day 10:
- Select: "Database_Systems.pdf" (still no upload!)
- Topic: "Chapter 8: Normalization"
- System extracts: Pages 250-290
- Generates: 7 chunks about normalization
```

### Example 2: Multiple Books

```
Materials Library:
1. Database_Systems.pdf (uploaded 2 weeks ago)
2. Python_Programming.pdf (uploaded 1 week ago)
3. Machine_Learning.pdf (uploaded 3 days ago)

Today:
- Want to learn: "Neural Networks" from ML book
- Select: Machine_Learning.pdf
- Topic: "Chapter 7: Neural Networks"
- Continue learning!
```

---

## Testing

### Test Smart Extraction:

1. **Upload Large File:**
   - Use a textbook or comprehensive guide
   - Should have multiple chapters/sections

2. **Test Topic Extraction:**
   - Topic: "Transactions in DBMS"
   - Check backend logs:
     ```
     🔍 Extracting topic-relevant content for: Transactions in DBMS
     ✂️  Extracted 15000 characters (from 50000)
     📊 Reduction: 70%
     ```

3. **Verify Content Quality:**
   - Generated chunks should be about transactions
   - Quiz should ask about ACID properties, not intro content
   - Flashcards should cover transaction concepts

### Test Persistent Storage:

1. **First Upload:**
   - Upload a file
   - Note the material_id in response
   - Complete some learning

2. **Close Browser:**
   - Close and reopen application

3. **Continue Learning:**
   - Should see uploaded material in list
   - Select it
   - Enter new topic
   - Should work without re-upload

4. **Check Database:**
   ```bash
   sqlite3 learning_system.db
   SELECT * FROM learning_material;
   SELECT * FROM learning_session;
   ```

---

## Troubleshooting

### Content Still Generic:

1. **Check Extraction Logs:**
   ```
   Look for: "✂️ Extracted X characters"
   Should show significant reduction
   ```

2. **Verify Topic Keywords:**
   - Make topic specific
   - Good: "Transactions in DBMS"
   - Bad: "DBMS" (too broad)

3. **Check File Content:**
   - Ensure file has relevant sections
   - Check if topic exists in file

### Material Not Showing:

1. **Check Database:**
   ```python
   # In Python console
   from app_minimal import db, LearningMaterial
   materials = LearningMaterial.query.all()
   print(materials)
   ```

2. **Check API Response:**
   ```bash
   curl http://localhost:5000/api/materials/1
   ```

3. **Check Browser Console:**
   - Look for fetch errors
   - Check network tab

---

## Future Enhancements

### Possible Improvements:

1. **Chapter Detection:**
   - Automatically detect chapters in uploaded files
   - Suggest topics based on detected chapters

2. **Progress Tracking:**
   - Visual progress bars for each session
   - Completion badges
   - Learning streaks

3. **Smart Recommendations:**
   - "You learned Chapter 5, try Chapter 6 next"
   - Related topics suggestions

4. **Export/Import:**
   - Export learning progress
   - Share materials with others
   - Import from cloud storage

5. **Advanced Search:**
   - Search within file content
   - Filter by date, progress, topic
   - Tags and categories

---

All features are now implemented and ready to use! 🚀
