-- Community Message Board Database Schema
-- MySQL 5.7+ / MariaDB 10.2+ compatible
-- For JawsDB (MySQL compatible)
-- Run this to create all tables

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    building_password VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_building_name (building_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (base table for all user types)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME NULL DEFAULT NULL,
    UNIQUE KEY unique_username (username),
    UNIQUE KEY unique_student_email (student_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_number VARCHAR(20),
    floor_number INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_student (user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resident Assistants (RAs) table
CREATE TABLE IF NOT EXISTS ras (
    ra_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    phone_number VARCHAR(20),
    office_location VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_ra (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_building_id (building_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admin_level ENUM('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'admin',
    phone_number VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_admin (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_admin_level (admin_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Building relationship (for students and RAs)
CREATE TABLE IF NOT EXISTS user_buildings (
    user_building_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_building (user_id, building_id),
    INDEX idx_building_id (building_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(255) NOT NULL COMMENT 'SHA-256 hash of content for integrity verification',
    is_anonymous TINYINT(1) DEFAULT 0,
    is_encrypted TINYINT(1) DEFAULT 1 COMMENT 'Flag indicating if content is encrypted',
    encryption_key_id VARCHAR(100) NULL COMMENT 'Identifier for the encryption key used',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    INDEX idx_building_created (building_id, created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_content_hash (content_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Emergency messages table
CREATE TABLE IF NOT EXISTS emergency_messages (
    emergency_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    emergency_type ENUM('medical', 'fire', 'security', 'other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    location_hash VARCHAR(255) NOT NULL COMMENT 'SHA-256 hash of location for integrity verification',
    description TEXT NOT NULL,
    description_hash VARCHAR(255) NOT NULL COMMENT 'SHA-256 hash of description for integrity verification',
    is_verified TINYINT(1) DEFAULT 0,
    verified_at DATETIME NULL,
    verified_by INT NULL,
    is_encrypted TINYINT(1) DEFAULT 1 COMMENT 'Flag indicating if sensitive fields are encrypted',
    encryption_key_id VARCHAR(100) NULL COMMENT 'Identifier for the encryption key used',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_building_created (building_id, created_at),
    INDEX idx_is_verified (is_verified),
    INDEX idx_emergency_type (emergency_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pinned messages table
CREATE TABLE IF NOT EXISTS pinned_messages (
    pinned_message_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(255) NOT NULL COMMENT 'SHA-256 hash of content for integrity verification',
    is_encrypted TINYINT(1) DEFAULT 1 COMMENT 'Flag indicating if content is encrypted',
    encryption_key_id VARCHAR(100) NULL COMMENT 'Identifier for the encryption key used',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    INDEX idx_building_created (building_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Emergency verifications table (optional - tracks verification history)
CREATE TABLE IF NOT EXISTS emergency_verifications (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_id INT NOT NULL,
    verified_by INT NOT NULL,
    verification_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emergency_id) REFERENCES emergency_messages(emergency_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_emergency_verifier (emergency_id, verified_by),
    INDEX idx_verified_by (verified_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
