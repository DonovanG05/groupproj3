-- Seed data for testing and development
-- Community Message Board Database
-- Updated for separate user role tables and DATETIME columns

-- Insert sample buildings
INSERT INTO buildings (building_name, building_password, description) VALUES
('Main Hall', '$2y$10$example_hash_main', 'Main residence hall for first-year students'),
('West Dorm', '$2y$10$example_hash_west', 'West side residence hall'),
('East Tower', '$2y$10$example_hash_east', 'East tower residence hall');

-- Note: In production, building_password should be hashed using bcrypt or similar
-- For testing, you can use a simple hash or plain text (not recommended for production)

-- Insert base users (must be inserted first)
-- Password: admin123 (should be hashed in production)
INSERT INTO users (username, student_email, password_hash) VALUES
('admin', 'admin@school.edu', '$2y$10$example_admin_hash'),
('ra_main', 'ra.main@school.edu', '$2y$10$example_ra_hash'),
('ra_west', 'ra.west@school.edu', '$2y$10$example_ra_hash2'),
('student1', 'student1@school.edu', '$2y$10$example_student_hash'),
('student2', 'student2@school.edu', '$2y$10$example_student_hash2'),
('student3', 'student3@school.edu', '$2y$10$example_student_hash3');

-- Insert admin user (user_id = 1)
INSERT INTO admins (user_id, admin_level, phone_number) VALUES
(1, 'super_admin', '555-0100');

-- Insert RA users (user_id = 2, 3)
-- ra_main assigned to Main Hall (building_id = 1)
-- ra_west assigned to West Dorm (building_id = 2)
INSERT INTO ras (user_id, building_id, phone_number, office_location) VALUES
(2, 1, '555-0200', 'Main Hall - Room 101'),
(3, 2, '555-0201', 'West Dorm - Room 201');

-- Insert student users (user_id = 4, 5, 6)
INSERT INTO students (user_id, room_number, floor_number) VALUES
(4, '205', 2),
(5, '312', 3),
(6, '108', 1);

-- Link students to buildings
-- Admin can access all buildings (handled in application logic)
-- RAs are linked via ras.building_id
-- Students are linked via user_buildings
INSERT INTO user_buildings (user_id, building_id) VALUES
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
