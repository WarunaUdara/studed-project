CREATE TABLE IF NOT EXISTS user_streaks (
    user_id VARCHAR(255) PRIMARY KEY,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_login_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon_url VARCHAR(255) NOT NULL,
    criteria VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id VARCHAR(255) NOT NULL,
    achievement_id VARCHAR(255) NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Seed default achievements
INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('first_wave', 'First Wave', 'Complete your first wave', 'waves', 'completed_waves >= 1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('perfect_score', 'Perfect Score', 'Score 100% on any wave', 'target', 'has_perfect_score')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('lesson_complete', 'Lesson Complete', 'Complete all waves in a lesson', 'book', 'completed_lessons >= 1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('lesson_proficient', 'Lesson Proficient', 'Reach Proficient in a lesson', 'star', 'proficient_lessons >= 1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('rising_star', 'Rising Star', 'Earn 500 XP', 'sparkles', 'total_xp >= 500')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('scholar', 'Scholar', 'Earn 2,000 XP', 'graduation', 'total_xp >= 2000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('master', 'Master', 'Earn 5,000 XP', 'crown', 'total_xp >= 5000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, name, description, icon_url, criteria) VALUES
('first_course', 'Course Conqueror', 'Complete an entire course', 'trophy', 'completed_courses >= 1')
ON CONFLICT (id) DO NOTHING;
