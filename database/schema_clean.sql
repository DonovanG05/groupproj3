-- Community Message Board Database Schema
-- For JawsDB (MySQL compatible)
-- Run this file to create all tables

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS emergency_verifications;
DROP TABLE IF EXISTS emergency_messages;
DROP TABLE IF EXISTS pinned_messages;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS user_buildings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS buildings;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create buildings table
CREATE TABLE buildings (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    building_password VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_building_name (building_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'RA', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    UNIQUE KEY unique_username (username),
    UNIQUE KEY unique_student_email (student_email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create user_buildings table
CREATE TABLE user_buildings (
    user_building_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_building (user_id, building_id),
    INDEX idx_building_id (building_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create messages table
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    INDEX idx_building_created (building_id, created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create pinned_messages table
CREATE TABLE pinned_messages (
    pinned_message_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    INDEX idx_building_created (building_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create emergency_messages table
CREATE TABLE emergency_messages (
    emergency_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_id INT NOT NULL,
    emergency_type ENUM('medical', 'fire', 'security', 'other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_building_created (building_id, created_at),
    INDEX idx_is_verified (is_verified),
    INDEX idx_emergency_type (emergency_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create emergency_verifications table
CREATE TABLE emergency_verifications (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_id INT NOT NULL,
    verified_by INT NOT NULL,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emergency_id) REFERENCES emergency_messages(emergency_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_emergency_verifier (emergency_id, verified_by),
    INDEX idx_verified_by (verified_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

