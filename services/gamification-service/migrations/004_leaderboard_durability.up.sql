-- Redis holds leaderboards as a derived index. Everything needed to rebuild
-- every scope after a Redis flush must therefore live here.

-- Display name and grade let the rebuild restore GLOBAL and GRADE boards with
-- real names instead of re-seeding every student as "Student Scholar".
ALTER TABLE user_xp ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE user_xp ADD COLUMN IF NOT EXISTS grade INTEGER NOT NULL DEFAULT 0;

-- course_id attributes an award to a course, so the course leaderboard ranks
-- by XP earned inside that course rather than by the student's global total.
ALTER TABLE xp_history ADD COLUMN IF NOT EXISTS course_id VARCHAR(255) NOT NULL DEFAULT '';

-- Rebuild queries: per-course sums, and per-week sums for the weekly board.
CREATE INDEX IF NOT EXISTS idx_xp_history_course
    ON xp_history(course_id, user_id)
    WHERE course_id <> '';

CREATE INDEX IF NOT EXISTS idx_xp_history_created_at
    ON xp_history(created_at);

CREATE INDEX IF NOT EXISTS idx_user_xp_grade ON user_xp(grade) WHERE grade <> 0;
