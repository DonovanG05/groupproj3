-- Schema Update Script
-- Add security fields (hashing and encryption) to existing tables
-- Run this if you already have tables created and want to add the new security features
-- MySQL 5.7+ / MariaDB 10.2+ compatible
-- 
-- NOTE: Run each section separately. If a column already exists, skip that ALTER statement.
-- You can check if a column exists with: SHOW COLUMNS FROM table_name LIKE 'column_name';

-- ============================================
-- UPDATE MESSAGES TABLE
-- ============================================

-- Add content_hash column for integrity verification
-- Skip if column already exists
ALTER TABLE messages 
ADD COLUMN content_hash VARCHAR(255) NOT NULL DEFAULT '' 
COMMENT 'SHA-256 hash of content for integrity verification';

-- Add is_encrypted flag
-- Skip if column already exists
ALTER TABLE messages 
ADD COLUMN is_encrypted TINYINT(1) DEFAULT 1 
COMMENT 'Flag indicating if content is encrypted';

-- Add encryption_key_id
-- Skip if column already exists
ALTER TABLE messages 
ADD COLUMN encryption_key_id VARCHAR(100) NULL 
COMMENT 'Identifier for the encryption key used';

-- Add index for content_hash (only if it doesn't exist)
-- Skip if index already exists
ALTER TABLE messages 
ADD INDEX idx_content_hash (content_hash);

-- ============================================
-- UPDATE EMERGENCY_MESSAGES TABLE
-- ============================================

-- Add location_hash column
-- Skip if column already exists
ALTER TABLE emergency_messages 
ADD COLUMN location_hash VARCHAR(255) NOT NULL DEFAULT '' 
COMMENT 'SHA-256 hash of location for integrity verification';

-- Add description_hash column
-- Skip if column already exists
ALTER TABLE emergency_messages 
ADD COLUMN description_hash VARCHAR(255) NOT NULL DEFAULT '' 
COMMENT 'SHA-256 hash of description for integrity verification';

-- Add is_encrypted flag
-- Skip if column already exists
ALTER TABLE emergency_messages 
ADD COLUMN is_encrypted TINYINT(1) DEFAULT 1 
COMMENT 'Flag indicating if sensitive fields are encrypted';

-- Add encryption_key_id
-- Skip if column already exists
ALTER TABLE emergency_messages 
ADD COLUMN encryption_key_id VARCHAR(100) NULL 
COMMENT 'Identifier for the encryption key used';

-- ============================================
-- UPDATE PINNED_MESSAGES TABLE
-- ============================================

-- Add content_hash column
-- Skip if column already exists
ALTER TABLE pinned_messages 
ADD COLUMN content_hash VARCHAR(255) NOT NULL DEFAULT '' 
COMMENT 'SHA-256 hash of content for integrity verification';

-- Add is_encrypted flag
-- Skip if column already exists
ALTER TABLE pinned_messages 
ADD COLUMN is_encrypted TINYINT(1) DEFAULT 1 
COMMENT 'Flag indicating if content is encrypted';

-- Add encryption_key_id
-- Skip if column already exists
ALTER TABLE pinned_messages 
ADD COLUMN encryption_key_id VARCHAR(100) NULL 
COMMENT 'Identifier for the encryption key used';

-- ============================================
-- NOTES
-- ============================================
-- After running this update:
-- 1. Update existing records to populate hash fields (run hash calculation on existing content)
-- 2. Update your application code to encrypt/hash new messages before inserting
-- 3. The DEFAULT '' for hash fields is temporary - you should populate them with actual hashes
-- 4. Consider making content_hash NOT NULL after populating existing data

