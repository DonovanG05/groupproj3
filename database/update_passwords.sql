-- Update password hashes for all users
-- Password for all: 'password123'
-- This is a real bcrypt hash for 'password123'

UPDATE users SET password_hash = '$2b$10$vJkp.X2UnVJuN8NNleeuA.nJ8SnrCoDYC3VQIbVuP6iDK9hNM0yrG' 
WHERE username IN ('admin', 'ra_main', 'student1');

