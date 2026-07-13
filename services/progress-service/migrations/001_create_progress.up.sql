CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255) NOT NULL,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT idx_enrollment_user_course UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS wave_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    wave_id VARCHAR(255) NOT NULL,
    lesson_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255) NOT NULL,
    answers_json TEXT NOT NULL,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    xp_awarded INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempt_user_wave ON wave_attempts(user_id, wave_id);
