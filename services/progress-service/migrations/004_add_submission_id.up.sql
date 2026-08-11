-- Add submission_id to wave_attempts for retry idempotency (the model has
-- carried this field since the original schema, but no migration ever
-- created the column; GetAttemptBySubmissionID relies on it to reconcile
-- retried submissions without double-awarding XP).
ALTER TABLE wave_attempts ADD COLUMN IF NOT EXISTS submission_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_attempt_submission_id ON wave_attempts(submission_id);
