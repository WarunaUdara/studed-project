CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_history_wave_completion
    ON xp_history(user_id, source_id, reason)
    WHERE reason = 'wave_completed';
