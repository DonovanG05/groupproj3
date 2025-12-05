-- Seed data for testing and development
-- Community Message Board Database
-- Updated for separate user role tables and DATETIME columns
-- Simplified: 1 admin, 1 RA, 1 student

-- Insert sample building
INSERT INTO buildings (building_name, building_password, description) VALUES
('Main Hall', 'mainhall123', 'Main residence hall for first-year students');

-- Note: In production, building_password should be hashed using bcrypt or similar
-- For testing, using plain text password: 'mainhall123'

-- Insert base users (must be inserted first)
-- Password for all users: 'password123'
-- These are real bcrypt hashes generated for 'password123'
INSERT INTO users (username, student_email, password_hash) VALUES
('admin', 'admin@school.edu', '$2b$10$vJkp.X2UnVJuN8NNleeuA.nJ8SnrCoDYC3VQIbVuP6iDK9hNM0yrG'),
('ra_main', 'ra.main@school.edu', '$2b$10$vJkp.X2UnVJuN8NNleeuA.nJ8SnrCoDYC3VQIbVuP6iDK9hNM0yrG'),
('student1', 'student1@school.edu', '$2b$10$vJkp.X2UnVJuN8NNleeuA.nJ8SnrCoDYC3VQIbVuP6iDK9hNM0yrG');

-- Insert admin user (user_id = 1)
INSERT INTO admins (user_id, admin_level, phone_number) VALUES
(1, 'super_admin', '555-0100');

-- Insert RA user (user_id = 2)
-- ra_main assigned to Main Hall (building_id = 1)
INSERT INTO ras (user_id, building_id, phone_number, office_location) VALUES
(2, 1, '555-0200', 'Main Hall - Room 101');

-- Insert student user (user_id = 3)
INSERT INTO students (user_id, room_number, floor_number) VALUES
(3, '205', 2);

-- Link student to building
-- Students are linked via user_buildings
-- student1 -> Main Hall
INSERT INTO user_buildings (user_id, building_id) VALUES
(3, 1);

-- Note: Messages, pinned messages, and emergencies can be added through the application
-- or you can add sample data here if needed for testing
