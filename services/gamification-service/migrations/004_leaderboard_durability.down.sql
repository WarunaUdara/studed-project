DROP INDEX IF EXISTS idx_user_xp_grade;
DROP INDEX IF EXISTS idx_xp_history_created_at;
DROP INDEX IF EXISTS idx_xp_history_course;
ALTER TABLE xp_history DROP COLUMN IF EXISTS course_id;
ALTER TABLE user_xp DROP COLUMN IF EXISTS grade;
ALTER TABLE user_xp DROP COLUMN IF EXISTS display_name;
