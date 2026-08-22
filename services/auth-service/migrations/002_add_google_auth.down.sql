DROP INDEX IF EXISTS idx_users_google_id;

ALTER TABLE users DROP COLUMN IF EXISTS google_id;
UPDATE users SET password_hash = '' WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
