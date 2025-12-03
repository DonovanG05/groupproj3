-- Common SQL Queries for Community Message Board
-- Updated for separate user role tables (students, ras, admins)
-- Useful queries for the application

-- ============================================
-- USER AUTHENTICATION & MANAGEMENT
-- ============================================

-- Check if student email already exists
SELECT user_id, username FROM users WHERE student_email = ?;

-- Verify user login (check email and password hash)
SELECT user_id, username, password_hash FROM users WHERE student_email = ?;

-- Determine user role (check which role table they exist in)
-- Returns: 'student', 'RA', 'admin', or NULL
SELECT 
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'student'
        WHEN r.user_id IS NOT NULL THEN 'RA'
        WHEN a.user_id IS NOT NULL THEN 'admin'
        ELSE NULL
    END AS role
FROM users u
LEFT JOIN students s ON u.user_id = s.user_id
LEFT JOIN ras r ON u.user_id = r.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
WHERE u.user_id = ?;

-- Get user by ID with role and building info
SELECT 
    u.user_id,
    u.username,
    u.student_email,
    u.last_login,
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'student'
        WHEN r.user_id IS NOT NULL THEN 'RA'
        WHEN a.user_id IS NOT NULL THEN 'admin'
        ELSE NULL
    END AS role,
    s.room_number,
    s.floor_number,
    r.building_id AS ra_building_id,
    r.phone_number AS ra_phone,
    a.admin_level,
    b.building_id,
    b.building_name
FROM users u
LEFT JOIN students s ON u.user_id = s.user_id
LEFT JOIN ras r ON u.user_id = r.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
LEFT JOIN user_buildings ub ON u.user_id = ub.user_id
LEFT JOIN buildings b ON ub.building_id = b.building_id OR r.building_id = b.building_id
WHERE u.user_id = ?;

-- Get all buildings for a user (students and RAs)
SELECT 
    b.building_id,
    b.building_name,
    b.description
FROM buildings b
INNER JOIN user_buildings ub ON b.building_id = ub.building_id
WHERE ub.user_id = ?;

-- Get building for an RA
SELECT 
    b.building_id,
    b.building_name,
    b.description
FROM buildings b
INNER JOIN ras r ON b.building_id = r.building_id
WHERE r.user_id = ?;

-- Verify building password (for signup)
SELECT building_id, building_name FROM buildings 
WHERE building_id = ? AND building_password = ?;

-- Create new user (returns user_id)
INSERT INTO users (username, student_email, password_hash)
VALUES (?, ?, ?);

-- Create new student
INSERT INTO students (user_id, room_number, floor_number)
VALUES (?, ?, ?);

-- Create new RA
INSERT INTO ras (user_id, building_id, phone_number, office_location)
VALUES (?, ?, ?, ?);

-- Create new admin
INSERT INTO admins (user_id, admin_level, phone_number)
VALUES (?, ?, ?);

-- Link user to building
INSERT INTO user_buildings (user_id, building_id)
VALUES (?, ?);

-- ============================================
-- MESSAGES
-- ============================================

-- Get all regular messages for a building (newest first)
SELECT 
    m.message_id,
    m.content,
    m.is_anonymous,
    m.created_at,
    CASE 
        WHEN m.is_anonymous THEN 'Anonymous'
        ELSE u.username
    END AS author,
    u.user_id,
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'student'
        WHEN r.user_id IS NOT NULL THEN 'RA'
        WHEN a.user_id IS NOT NULL THEN 'admin'
        ELSE NULL
    END AS author_role
FROM messages m
INNER JOIN users u ON m.user_id = u.user_id
LEFT JOIN students s ON u.user_id = s.user_id
LEFT JOIN ras r ON u.user_id = r.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
WHERE m.building_id = ?
ORDER BY m.created_at DESC;

-- Get pinned messages for a building (newest first)
SELECT 
    pm.pinned_message_id,
    pm.content,
    pm.created_at,
    u.username AS author,
    u.user_id,
    CASE 
        WHEN r.user_id IS NOT NULL THEN 'RA'
        WHEN a.user_id IS NOT NULL THEN 'admin'
        ELSE NULL
    END AS author_role
FROM pinned_messages pm
INNER JOIN users u ON pm.user_id = u.user_id
LEFT JOIN ras r ON u.user_id = r.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
WHERE pm.building_id = ?
ORDER BY pm.created_at DESC;

-- Insert a new regular message
INSERT INTO messages (user_id, building_id, content, is_anonymous)
VALUES (?, ?, ?, ?);

-- Insert a new pinned message (RA/admin only)
INSERT INTO pinned_messages (user_id, building_id, content)
VALUES (?, ?, ?);

-- Delete a message (user can only delete their own)
DELETE FROM messages WHERE message_id = ? AND user_id = ?;

-- ============================================
-- EMERGENCY MESSAGES
-- ============================================

-- Get all emergency messages for a building (newest first)
SELECT 
    em.emergency_id,
    em.emergency_type,
    em.location,
    em.description,
    em.is_verified,
    em.verified_at,
    em.created_at,
    u.username AS reported_by,
    verifier.username AS verified_by_username
FROM emergency_messages em
INNER JOIN users u ON em.user_id = u.user_id
LEFT JOIN users verifier ON em.verified_by = verifier.user_id
WHERE em.building_id = ?
ORDER BY em.created_at DESC;

-- Get unverified emergency messages (for RAs and admins)
SELECT 
    em.emergency_id,
    em.emergency_type,
    em.location,
    em.description,
    em.created_at,
    b.building_name,
    u.username AS reported_by
FROM emergency_messages em
INNER JOIN buildings b ON em.building_id = b.building_id
INNER JOIN users u ON em.user_id = u.user_id
WHERE em.is_verified = FALSE
ORDER BY em.created_at DESC;

-- Get unverified emergencies for a specific building (for RAs)
SELECT 
    em.emergency_id,
    em.emergency_type,
    em.location,
    em.description,
    em.created_at,
    u.username AS reported_by
FROM emergency_messages em
INNER JOIN users u ON em.user_id = u.user_id
WHERE em.building_id = ? AND em.is_verified = FALSE
ORDER BY em.created_at DESC;

-- Insert a new emergency message
INSERT INTO emergency_messages (user_id, building_id, emergency_type, location, description)
VALUES (?, ?, ?, ?, ?);

-- Verify an emergency message (RA/admin only)
UPDATE emergency_messages 
SET is_verified = TRUE,
    verified_at = CURRENT_TIMESTAMP,
    verified_by = ?
WHERE emergency_id = ?;

-- Record emergency verification
INSERT INTO emergency_verifications (emergency_id, verified_by, verification_notes)
VALUES (?, ?, ?);

-- Get emergency verification history
SELECT 
    ev.verification_id,
    ev.verification_notes,
    ev.created_at,
    u.username AS verified_by
FROM emergency_verifications ev
INNER JOIN users u ON ev.verified_by = u.user_id
WHERE ev.emergency_id = ?
ORDER BY ev.created_at DESC;

-- ============================================
-- ADMIN QUERIES
-- ============================================

-- Get all buildings (admin can see all)
SELECT building_id, building_name, description, created_at FROM buildings
ORDER BY building_name;

-- Get all users with their roles
SELECT 
    u.user_id,
    u.username,
    u.student_email,
    u.created_at,
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'student'
        WHEN r.user_id IS NOT NULL THEN 'RA'
        WHEN a.user_id IS NOT NULL THEN 'admin'
        ELSE NULL
    END AS role
FROM users u
LEFT JOIN students s ON u.user_id = s.user_id
LEFT JOIN ras r ON u.user_id = r.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
ORDER BY role, username;

-- Get all messages across all buildings (admin view)
SELECT 
    m.message_id,
    m.content,
    m.is_anonymous,
    m.created_at,
    CASE 
        WHEN m.is_anonymous THEN 'Anonymous'
        ELSE u.username
    END AS author,
    b.building_name
FROM messages m
INNER JOIN users u ON m.user_id = u.user_id
INNER JOIN buildings b ON m.building_id = b.building_id
ORDER BY m.created_at DESC;

-- Get all emergency messages across all buildings (admin view)
SELECT 
    em.emergency_id,
    em.emergency_type,
    em.location,
    em.description,
    em.is_verified,
    em.created_at,
    b.building_name,
    u.username AS reported_by
FROM emergency_messages em
INNER JOIN buildings b ON em.building_id = b.building_id
INNER JOIN users u ON em.user_id = u.user_id
ORDER BY em.created_at DESC;

-- ============================================
-- STATISTICS & REPORTS
-- ============================================

-- Count messages per building
SELECT 
    b.building_name,
    COUNT(m.message_id) AS message_count
FROM buildings b
LEFT JOIN messages m ON b.building_id = m.building_id
GROUP BY b.building_id, b.building_name
ORDER BY message_count DESC;

-- Count users per building
SELECT 
    b.building_name,
    COUNT(ub.user_id) AS user_count
FROM buildings b
LEFT JOIN user_buildings ub ON b.building_id = ub.building_id
GROUP BY b.building_id, b.building_name
ORDER BY user_count DESC;

-- Count unverified emergencies per building
SELECT 
    b.building_name,
    COUNT(em.emergency_id) AS unverified_count
FROM buildings b
LEFT JOIN emergency_messages em ON b.building_id = em.building_id AND em.is_verified = FALSE
GROUP BY b.building_id, b.building_name
HAVING unverified_count > 0
ORDER BY unverified_count DESC;

-- Count users by role
SELECT 
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'student'
        WHEN r.user_id IS NOT NULL THEN 'RA'
        WHEN a.user_id IS NOT NULL THEN 'admin'
        ELSE 'unknown'
    END AS role,
    COUNT(*) AS count
FROM users u
LEFT JOIN students s ON u.user_id = s.user_id
LEFT JOIN ras r ON u.user_id = r.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
GROUP BY role;
