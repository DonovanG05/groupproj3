-- Migration: Add emergency support to pinned_messages table
-- This allows verified emergencies to be automatically pinned as messages
-- Run this on existing databases to add emergency functionality

-- Add emergency_id column to pinned_messages
ALTER TABLE pinned_messages
ADD COLUMN emergency_id INT NULL COMMENT 'Reference to emergency_messages if this is an emergency pinned message';

-- Add emergency_type column to pinned_messages
ALTER TABLE pinned_messages
ADD COLUMN emergency_type ENUM('medical', 'fire', 'security', 'other') NULL COMMENT 'Type of emergency if this is an emergency pinned message';

-- Add foreign key constraint for emergency_id
ALTER TABLE pinned_messages
ADD CONSTRAINT fk_pinned_emergency
FOREIGN KEY (emergency_id) REFERENCES emergency_messages(emergency_id) ON DELETE CASCADE;

-- Add index for emergency_id for better query performance
ALTER TABLE pinned_messages
ADD INDEX idx_emergency_id (emergency_id);

