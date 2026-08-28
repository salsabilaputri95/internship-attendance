-- Enable UUID generation support if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('mentor', 'intern', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==========================================
-- 2. INTERNS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS interns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    university VARCHAR(150) NOT NULL,
    major VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interns_user_id ON interns(user_id);
CREATE INDEX IF NOT EXISTS idx_interns_supervisor_id ON interns(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_interns_status ON interns(status);

-- ==========================================
-- 3. LOCATIONS TABLE (Geofence Reference)
-- ==========================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius DOUBLE PRECISION NOT NULL DEFAULT 100.0, -- In meters
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. ATTENDANCE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    
    -- Check In Data
    check_in TIMESTAMPTZ,
    check_in_latitude DOUBLE PRECISION,
    check_in_longitude DOUBLE PRECISION,
    check_in_accuracy DOUBLE PRECISION,
    check_in_distance DOUBLE PRECISION,
    check_in_photo_url TEXT,
    
    -- Check Out Data
    check_out TIMESTAMPTZ,
    check_out_latitude DOUBLE PRECISION,
    check_out_longitude DOUBLE PRECISION,
    check_out_accuracy DOUBLE PRECISION,
    check_out_distance DOUBLE PRECISION,
    check_out_photo_url TEXT,
    
    -- Status & Notes
    status VARCHAR(20) NOT NULL DEFAULT 'BELUM_HADIR' CHECK (status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'ALPHA', 'BELUM_HADIR')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique 1 record attendance per intern per day
    CONSTRAINT uq_intern_attendance_date UNIQUE (intern_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_intern_id ON attendance(intern_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- ==========================================
-- 5. ATTENDANCE CORRECTIONS (Audit Log)
-- ==========================================
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    corrected_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    old_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_corrections_attendance_id ON attendance_corrections(attendance_id);
CREATE INDEX IF NOT EXISTS idx_corrections_corrected_by ON attendance_corrections(corrected_by);
