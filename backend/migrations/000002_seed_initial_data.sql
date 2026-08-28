-- ==========================================
-- SEED INITIAL DATA: BPS Jeneponto Attendance
-- Default Password for Mentor: password123
-- ==========================================

-- 1. Insert Default Office Location: BPS Kabupaten Jeneponto
INSERT INTO locations (id, name, latitude, longitude, radius, status)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Kantor BPS Kabupaten Jeneponto',
    -5.6783321,
    119.7498101,
    100.0,
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius = EXCLUDED.radius;

-- 2. Insert Supervisor / Mentor
INSERT INTO users (id, name, email, password_hash, role)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Pembimbing BPS Jeneponto',
    'bpskabjeneponto@gmail.com',
    '{{BCRYPT_PASSWORD_HASH}}',
    'mentor'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;