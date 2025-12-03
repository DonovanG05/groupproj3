# Node.js API Setup Instructions

## Prerequisites
- Node.js 16+ installed
- npm or yarn

## Setup Steps

1. **Install Dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Configure Environment**
   - The `.env` file is already configured with your database connection
   - Update `PORT` if needed (default: 5000)
   - Update `CORS_ORIGINS` if your frontend runs on different ports

3. **Run the API**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
   The API will run on `http://localhost:5000`

4. **Test the API**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok","message":"API is running"}`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
  ```json
  {
    "studentEmail": "user@school.edu",
    "username": "username",
    "password": "password",
    "buildingPassword": "building_pass",
    "roomNumber": "205",
    "floorNumber": 2
  }
  ```

- `POST /api/auth/login` - User login
  ```json
  {
    "studentEmail": "user@school.edu",
    "password": "password"
  }
  ```

- `POST /api/auth/logout` - User logout

### Messages
- `GET /api/messages?buildingId={id}` - Get messages for a building
- `POST /api/messages` - Create new message
  ```json
  {
    "buildingId": 1,
    "content": "Message text",
    "isAnonymous": false,
    "userId": 1
  }
  ```

- `GET /api/messages/pinned?buildingId={id}` - Get pinned messages
- `POST /api/messages/pinned` - Create pinned message (RA/Admin only)
  ```json
  {
    "buildingId": 1,
    "content": "Pinned message",
    "userId": 1,
    "userRole": "RA"
  }
  ```

### Emergencies
- `GET /api/emergencies?buildingId={id}&unverifiedOnly=true` - Get emergencies
- `POST /api/emergencies` - Report emergency
  ```json
  {
    "buildingId": 1,
    "emergencyType": "medical",
    "location": "Room 205",
    "description": "Emergency description",
    "userId": 1
  }
  ```

- `POST /api/emergencies/{id}/verify` - Verify emergency (RA/Admin only)
  ```json
  {
    "verificationNotes": "Verified and handled",
    "userId": 2,
    "userRole": "RA"
  }
  ```

## Authentication Headers

For protected endpoints, include user info in headers or request body:
- `user-id`: User ID
- `user-role`: User role (student, RA, admin)

## Next Steps

1. Implement session management (JWT tokens or sessions)
2. Add encryption for message content
3. Add input validation middleware
4. Add rate limiting
5. Add error logging
