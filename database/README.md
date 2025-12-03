# Database Schema Documentation

## Overview
This database schema is designed for a Community Message Board system using JawsDB (MySQL compatible). The system uses separate tables for different user roles: Students, Resident Assistants (RAs), and Admins.

## Database Structure

### Core Tables

#### 1. `buildings`
Stores information about different buildings/residence halls, each with its own message board.
- `building_id`: Primary key
- `building_name`: Unique name of the building
- `building_password`: Password required to join the building's message board (should be hashed)
- `description`: Optional description of the building

#### 2. `users`
Base table storing common information for all user types (students, RAs, and admins).
- `user_id`: Primary key
- `username`: Unique username
- `student_email`: Unique student email (must end in .edu)
- `password_hash`: Hashed password (use bcrypt or similar)
- `last_login`: Timestamp of last login

#### 3. `students`
Stores student-specific information.
- `student_id`: Primary key
- `user_id`: Foreign key to users table
- `room_number`: Student's room number (optional)
- `floor_number`: Student's floor number (optional)

#### 4. `ras`
Stores Resident Assistant-specific information.
- `ra_id`: Primary key
- `user_id`: Foreign key to users table
- `building_id`: Foreign key to buildings table (which building they oversee)
- `phone_number`: RA's contact phone number (optional)
- `office_location`: RA's office location (optional)

#### 5. `admins`
Stores administrator-specific information.
- `admin_id`: Primary key
- `user_id`: Foreign key to users table
- `admin_level`: Enum ('super_admin', 'admin', 'moderator') - permission level
- `phone_number`: Admin's contact phone number (optional)

### Relationship Tables

#### 6. `user_buildings`
Junction table linking users to buildings they belong to.
- Links students to their residence hall buildings
- RAs are linked via the `ras` table's `building_id` field
- Admins can access all buildings (handled in application logic)

### Content Tables

#### 7. `messages`
Regular messages posted by users on building message boards.
- `message_id`: Primary key
- `user_id`: Foreign key to users (who posted)
- `building_id`: Foreign key to buildings
- `content`: Message text
- `is_anonymous`: Boolean flag for anonymous posts

#### 8. `emergency_messages`
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

#### 9. `pinned_messages`
Announcements from RAs and admins that appear at the top of message boards.
- `pinned_message_id`: Primary key
- `user_id`: Foreign key to users (RA or admin who posted)
- `building_id`: Foreign key to buildings
- `content`: Announcement text

#### 10. `emergency_verifications`
Tracks verification history for emergency messages (optional audit trail).
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
- Can post pinned messages (announcements) to their assigned building
- Can verify emergency messages in their assigned building
- Can see unverified emergencies in their assigned building
- Assigned to one building via `ras.building_id`

### Admins
- All RA permissions, plus:
- Can access all building message boards
- Can post pinned messages to any building
- Can verify emergency messages in any building
- Can see all messages and emergencies across all buildings
- Admin levels:
  - `super_admin`: Full system access
  - `admin`: Standard admin access
  - `moderator`: Limited admin access

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

5. **Role-Based Access**: Check user role by querying the appropriate table (students, ras, or admins) based on user_id.

## Common Queries

See `queries.sql` for ready-to-use SQL queries for:
- User authentication
- Role determination
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
