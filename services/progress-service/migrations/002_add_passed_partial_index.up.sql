CREATE INDEX IF NOT EXISTS idx_wave_attempts_user_passed 
ON wave_attempts(user_id, course_id, lesson_id) 
WHERE passed IS TRUE;
