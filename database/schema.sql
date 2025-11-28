-- AI Learning System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE,
    learning_style TEXT, -- JSON data for learning preferences
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic VARCHAR(200) NOT NULL,
    content_chunks TEXT, -- JSON data for learning chunks
    progress TEXT, -- JSON data for completion progress
    emotion_data TEXT, -- JSON data for emotion tracking
    screen_data TEXT, -- JSON data for screen monitoring
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    completion_percentage REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Learning content table
CREATE TABLE IF NOT EXISTS learning_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    chunk_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    simplified_content TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    time_spent INTEGER DEFAULT 0, -- in seconds
    quiz_data TEXT, -- JSON data for quizzes
    summary TEXT,
    flashcards TEXT, -- JSON data for flashcards
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Emotion tracking table
CREATE TABLE IF NOT EXISTS emotion_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dominant_emotion VARCHAR(20),
    emotion_scores TEXT, -- JSON data for all emotion scores
    confidence REAL,
    facial_landmarks TEXT, -- JSON data for facial landmarks
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Screen activity table
CREATE TABLE IF NOT EXISTS screen_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activity_type VARCHAR(50), -- mouse_move, keystroke, tab_switch, idle, etc.
    activity_data TEXT, -- JSON data for specific activity details
    mouse_movements INTEGER DEFAULT 0,
    keystrokes INTEGER DEFAULT 0,
    tab_switches INTEGER DEFAULT 0,
    idle_time INTEGER DEFAULT 0, -- in seconds
    window_focused BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    chunk_id VARCHAR(50),
    questions TEXT NOT NULL, -- JSON data for quiz questions
    user_answers TEXT, -- JSON data for user responses
    score REAL,
    total_questions INTEGER,
    correct_answers INTEGER,
    time_taken INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    chunk_id VARCHAR(50),
    summary_text TEXT NOT NULL,
    summary_type VARCHAR(20) DEFAULT 'auto', -- auto, user_requested, ai_generated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    chunk_id VARCHAR(50),
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Learning analytics table
CREATE TABLE IF NOT EXISTS learning_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    metric_name VARCHAR(50) NOT NULL,
    metric_value REAL,
    metric_data TEXT, -- JSON data for complex metrics
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preference_key VARCHAR(50) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, preference_key)
);

-- Reinforcement learning data table
CREATE TABLE IF NOT EXISTS rl_training_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    state_data TEXT NOT NULL, -- JSON: emotion, attention, progress, etc.
    action_taken VARCHAR(100), -- simplify, encourage, quiz, break, etc.
    reward REAL, -- calculated based on user response and progress
    next_state_data TEXT, -- JSON: state after action
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (session_id) REFERENCES study_sessions (id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_content_session_id ON learning_content(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_tracking_session_id ON emotion_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_screen_activity_session_id ON screen_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_session_id ON quizzes(session_id);
CREATE INDEX IF NOT EXISTS idx_summaries_session_id ON summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_session_id ON flashcards(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_id ON learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_rl_training_data_user_id ON rl_training_data(user_id);

-- Insert default user for testing
INSERT OR IGNORE INTO users (id, username, email, learning_style) 
VALUES (1, 'demo_user', 'demo@example.com', '{"preferred_chunk_size": "medium", "learning_pace": "normal", "content_difficulty": "intermediate"}');