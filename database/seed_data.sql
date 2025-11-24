-- Seed data for testing and development
-- Community Message Board Database

-- Insert sample buildings
INSERT INTO buildings (building_name, building_password, description) VALUES
('Main Hall', '$2y$10$example_hash_main', 'Main residence hall for first-year students'),
('West Dorm', '$2y$10$example_hash_west', 'West side residence hall'),
('East Tower', '$2y$10$example_hash_east', 'East tower residence hall');

-- Note: In production, building_password should be hashed using bcrypt or similar
-- For testing, you can use a simple hash or plain text (not recommended for production)

-- Insert sample admin user
-- Password: admin123 (should be hashed in production)
INSERT INTO users (username, student_email, password_hash, role) VALUES
('admin', 'admin@school.edu', '$2y$10$example_admin_hash', 'admin');

-- Insert sample RA users
-- Password: ra123 (should be hashed in production)
INSERT INTO users (username, student_email, password_hash, role) VALUES
('ra_main', 'ra.main@school.edu', '$2y$10$example_ra_hash', 'RA'),
('ra_west', 'ra.west@school.edu', '$2y$10$example_ra_hash2', 'RA');

-- Insert sample student users
-- Password: student123 (should be hashed in production)
INSERT INTO users (username, student_email, password_hash, role) VALUES
('student1', 'student1@school.edu', '$2y$10$example_student_hash', 'student'),
('student2', 'student2@school.edu', '$2y$10$example_student_hash2', 'student'),
('student3', 'student3@school.edu', '$2y$10$example_student_hash3', 'student');

-- Link users to buildings
-- Admin can access all buildings (handled in application logic)
-- RAs are linked to their respective buildings
INSERT INTO user_buildings (user_id, building_id) VALUES
(2, 1), -- ra_main -> Main Hall
(3, 2), -- ra_west -> West Dorm
(4, 1), -- student1 -> Main Hall
(5, 1), -- student2 -> Main Hall
(6, 2); -- student3 -> West Dorm

-- Insert sample pinned messages (announcements from RAs/admins)
INSERT INTO pinned_messages (user_id, building_id, content) VALUES
(1, 1, 'Welcome to the community message board! This is a space for residents to share updates, ask questions, and stay connected. Please be respectful and follow community guidelines.'),
(2, 1, 'Important: Building maintenance scheduled for this Saturday from 9 AM to 12 PM. Please plan accordingly.');

-- Insert sample regular messages
INSERT INTO messages (user_id, building_id, content, is_anonymous) VALUES
(4, 1, 'Welcome to the building message board! Feel free to share updates and connect with neighbors.', FALSE),
(5, 1, 'Does anyone know when the laundry room will be available?', FALSE),
(6, 2, 'Looking for a study group for the upcoming exam!', TRUE);

-- Insert sample emergency message (unverified)
INSERT INTO emergency_messages (user_id, building_id, emergency_type, location, description) VALUES
(4, 1, 'other', 'Room 205', 'Water leak in the hallway near room 205. Please send maintenance.');

