const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { studentEmail, username, password, inviteCode, roomNumber, floorNumber } = req.body;

    // Validate .edu email
    if (!studentEmail.endsWith('.edu')) {
      return res.status(400).json({ error: 'Email must end with .edu' });
    }

    // Check if email or username already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM users WHERE student_email = ? OR username = ?',
      [studentEmail, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    // Validate invite code (required)
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Validate invite code
    const [codes] = await pool.execute(
      'SELECT invite_code_id, building_id, used_by, is_active, expires_at FROM invite_codes WHERE code = ?',
      [inviteCode]
    );

    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid invite code' });
    }

    const inviteCodeData = codes[0];

    // Check if already used
    if (inviteCodeData.used_by) {
      return res.status(400).json({ error: 'Invite code has already been used' });
    }

    // Check if inactive
    if (!inviteCodeData.is_active) {
      return res.status(400).json({ error: 'Invite code is no longer active' });
    }

    // Check if expired
    if (inviteCodeData.expires_at) {
      const expiresAt = new Date(inviteCodeData.expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite code has expired' });
      }
    }

    const buildingId = inviteCodeData.building_id;

    // Validate building exists
    if (!buildingId) {
      console.error('Invite code missing building_id:', inviteCode);
      return res.status(400).json({ error: 'Invite code is invalid (missing building assignment)' });
    }

    // Verify building exists in database
    const [buildings] = await pool.execute(
      'SELECT building_id, building_name FROM buildings WHERE building_id = ?',
      [buildingId]
    );

    if (buildings.length === 0) {
      console.error('Invite code references non-existent building:', buildingId);
      return res.status(400).json({ error: 'Invite code is invalid (building not found)' });
    }

    console.log('Signup: Assigning user to building', {
      buildingId: buildingId,
      buildingName: buildings[0].building_name,
      inviteCode: inviteCode
    });

    // Hash user password
    const passwordHash = await bcrypt.hash(password, 10);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, student_email, password_hash) VALUES (?, ?, ?)',
        [username, studentEmail, passwordHash]
      );

      const userId = userResult.insertId;

      // Insert student record
      await connection.execute(
        'INSERT INTO students (user_id, room_number, floor_number) VALUES (?, ?, ?)',
        [userId, roomNumber || null, floorNumber || null]
      );

      // Link student to building
      const [userBuildingResult] = await connection.execute(
        'INSERT INTO user_buildings (user_id, building_id) VALUES (?, ?)',
        [userId, buildingId]
      );

      console.log('Signup: Student linked to building', {
        userId: userId,
        buildingId: buildingId,
        userBuildingId: userBuildingResult.insertId
      });

      // Mark invite code as used if applicable
      if (inviteCode) {
        await connection.execute(
          'UPDATE invite_codes SET used_by = ?, used_at = NOW() WHERE code = ?',
          [userId, inviteCode]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Account created successfully',
        userId: userId,
        username: username,
        role: 'student',
        buildingId: buildingId
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user with password hash (can login with username or email)
    const [users] = await pool.execute(
      'SELECT user_id, username, password_hash FROM users WHERE username = ? OR student_email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Determine user role
    const [students] = await pool.execute('SELECT user_id FROM students WHERE user_id = ?', [user.user_id]);
    const [ras] = await pool.execute('SELECT user_id, building_id FROM ras WHERE user_id = ?', [user.user_id]);
    const [admins] = await pool.execute('SELECT user_id, admin_level FROM admins WHERE user_id = ?', [user.user_id]);

    let role = null;
    let buildingId = null;
    let adminLevel = null;

    if (admins.length > 0) {
      role = 'admin';
      adminLevel = admins[0].admin_level;
    } else if (ras.length > 0) {
      role = 'RA';
      buildingId = ras[0].building_id;
    } else if (students.length > 0) {
      role = 'student';
      // Get student's building
      const [userBuildings] = await pool.execute(
        'SELECT building_id FROM user_buildings WHERE user_id = ? LIMIT 1',
        [user.user_id]
      );
      if (userBuildings.length > 0) {
        buildingId = userBuildings[0].building_id;
      }
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    res.json({
      success: true,
      userId: user.user_id,
      username: user.username,
      role: role,
      buildingId: buildingId,
      adminLevel: adminLevel
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Client-side logout (clear localStorage)
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;


