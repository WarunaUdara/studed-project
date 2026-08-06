-- Convert answers_json column to JSONB format for indexed JSON querying (PERF-06)
ALTER TABLE wave_attempts ALTER COLUMN answers_json TYPE JSONB USING answers_json::jsonb;
