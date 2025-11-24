# Database Schema Documentation

## Overview
This database schema is designed for a Community Message Board system using JawsDB (MySQL compatible). The system supports three user roles: Students, Resident Assistants (RAs), and Admins.

## Database Structure

### Tables

#### 1. `buildings`
Stores information about different buildings/residence halls, each with its own message board.
- `building_id`: Primary key
- `building_name`: Unique name of the building
- `building_password`: Password required to join the building's message board
- `description`: Optional description of the building

#### 2. `users`
Stores all user accounts (students, RAs, and admins).
- `user_id`: Primary key
- `username`: Unique username
- `student_email`: Unique student email (must end in .edu)
- `password_hash`: Hashed password (use bcrypt or similar)
- `role`: Enum ('student', 'RA', 'admin')
- `last_login`: Timestamp of last login

#### 3. `user_buildings`
Junction table linking users to buildings they belong to.
- Links users to their respective building message boards
- Students and RAs are linked to specific buildings
- Admins can access all buildings (handled in application logic)

#### 4. `messages`
Regular messages posted by users on building message boards.
- `message_id`: Primary key
- `user_id`: Foreign key to users
- `building_id`: Foreign key to buildings
- `content`: Message text
- `is_anonymous`: Boolean flag for anonymous posts

#### 5. `pinned_messages`
Announcements from RAs and admins that appear at the top of message boards.
- `pinned_message_id`: Primary key
- `user_id`: Foreign key to users (RA or admin)
- `building_id`: Foreign key to buildings
- `content`: Announcement text

#### 6. `emergency_messages`
Emergency reports from users.
- `emergency_id`: Primary key
- `user_id`: Foreign key to users (who reported)
- `building_id`: Foreign key to buildings
- `emergency_type`: Enum ('medical', 'fire', 'security', 'other')
- `location`: Location of the emergency
- `description`: Detailed description
- `is_verified`: Boolean flag for verification status
- `verified_by`: Foreign key to users (RA or admin who verified)
- `verified_at`: Timestamp of verification

#### 7. `emergency_verifications`
Tracks verification history for emergency messages.
- `verification_id`: Primary key
- `emergency_id`: Foreign key to emergency_messages
- `verified_by`: Foreign key to users (RA or admin)
- `verification_notes`: Optional notes from verifier

## User Roles & Permissions

### Students
- Can sign up with student email (.edu domain)
- Can join building message boards using building password
- Can post regular messages (with anonymous option)
- Can report emergencies
- Cannot post pinned messages
- Cannot verify emergencies

### Resident Assistants (RAs)
- All student permissions, plus:
- Can post pinned messages (announcements) to their building
- Can verify emergency messages in their building
- Can see unverified emergencies in their building

### Admins
- All RA permissions, plus:
- Can access all building message boards
- Can post pinned messages to any building
- Can verify emergency messages in any building
- Can see all messages and emergencies across all buildings

## Setup Instructions

1. **Connect to JawsDB**
   - Get your JawsDB connection string from your hosting provider
   - Connection string format: `mysql://username:password@host:port/database`

2. **Create Database**
   ```sql
   CREATE DATABASE your_database_name;
   USE your_database_name;
   ```

3. **Run Schema**
   ```bash
   mysql -h host -u username -p database_name < database/schema.sql
   ```
   Or import `schema.sql` through your database management tool.

4. **Seed Data (Optional)**
   ```bash
   mysql -h host -u username -p database_name < database/seed_data.sql
   ```
   Note: Update password hashes in seed_data.sql with actual bcrypt hashes.

## Security Notes

1. **Password Hashing**: Always hash passwords using bcrypt or similar before storing in `password_hash` field.

2. **Building Passwords**: Store building passwords as hashed values, not plain text.

3. **SQL Injection**: Use parameterized queries in your application code.

4. **Email Validation**: Enforce .edu domain validation in application code.

5. **Role-Based Access**: Implement role-based access control in your application logic.

## Common Queries

See `queries.sql` for ready-to-use SQL queries for:
- User authentication
- Message retrieval
- Emergency handling
- Admin operations
- Statistics and reports

## Next Steps

1. Set up your JawsDB connection in your application
2. Implement password hashing (bcrypt recommended)
3. Create API endpoints using the queries in `queries.sql`
4. Implement role-based access control middleware
5. Add proper error handling and validation

