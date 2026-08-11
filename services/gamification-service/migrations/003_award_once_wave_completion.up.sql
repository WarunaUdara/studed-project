-- Deduplicate any existing duplicate wave completion records before creating unique index
DELETE FROM xp_history a USING xp_history b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.source_id = b.source_id
  AND a.reason = b.reason
  AND a.reason = 'wave_completed';

CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_history_wave_completion
    ON xp_history(user_id, source_id, reason)
    WHERE reason = 'wave_completed';

