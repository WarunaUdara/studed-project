ALTER TABLE wave_attempts ALTER COLUMN answers_json TYPE TEXT USING answers_json::text;
