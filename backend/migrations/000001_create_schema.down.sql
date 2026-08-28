-- Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS attendance_corrections CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS interns CASCADE;
DROP TABLE IF EXISTS users CASCADE;
