DROP INDEX IF EXISTS idx_attempt_submission_id;
ALTER TABLE wave_attempts DROP COLUMN IF EXISTS submission_id;
