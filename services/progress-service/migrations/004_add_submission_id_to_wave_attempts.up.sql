ALTER TABLE wave_attempts ADD COLUMN IF NOT EXISTS submission_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_attempt_submission_id ON wave_attempts(submission_id);
