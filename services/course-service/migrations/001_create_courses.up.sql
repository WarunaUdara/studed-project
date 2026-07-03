CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    slug VARCHAR(255) UNIQUE NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    educator_id UUID NOT NULL,
    price DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_educator_id ON courses(educator_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_grade_level ON courses(grade_level);
