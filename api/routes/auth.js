const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { studentEmail, username, password, buildingPassword, roomNumber, floorNumber } = req.body;

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

    // Verify building password and get building_id
    // TODO: Hash building password before comparing
    const [buildings] = await pool.execute(
      'SELECT building_id FROM buildings WHERE building_password = ?',
      [buildingPassword]
    );

    if (buildings.length === 0) {
      return res.status(400).json({ error: 'Invalid building password' });
    }

    const buildingId = buildings[0].building_id;

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
      await connection.execute(
        'INSERT INTO user_buildings (user_id, building_id) VALUES (?, ?)',
        [userId, buildingId]
      );

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
    const { studentEmail, password } = req.body;

    // Get user with password hash
    const [users] = await pool.execute(
      'SELECT user_id, username, password_hash FROM users WHERE student_email = ?',
      [studentEmail]
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

