const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Create RA account (Admin only)
router.post('/create-ra', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];
    const { username, studentEmail, password, buildingId, phoneNumber, officeLocation } = req.body;

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create RA accounts' });
    }

    // Validate required fields
    if (!username || !studentEmail || !password || !buildingId) {
      return res.status(400).json({ error: 'Username, email, password, and building ID are required' });
    }

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

    // Verify building exists
    const [buildings] = await pool.execute(
      'SELECT building_id FROM buildings WHERE building_id = ?',
      [buildingId]
    );

    if (buildings.length === 0) {
      return res.status(400).json({ error: 'Invalid building ID' });
    }

    // Check if building already has an RA
    const [existingRAs] = await pool.execute(
      'SELECT ra_id FROM ras WHERE building_id = ?',
      [buildingId]
    );

    if (existingRAs.length > 0) {
      return res.status(400).json({ error: 'This building already has an RA assigned' });
    }

    // Hash password
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

      const newUserId = userResult.insertId;

      // Insert RA record
      await connection.execute(
        'INSERT INTO ras (user_id, building_id, phone_number, office_location) VALUES (?, ?, ?, ?)',
        [newUserId, buildingId, phoneNumber || null, officeLocation || null]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'RA account created successfully',
        userId: newUserId,
        username: username,
        buildingId: buildingId
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create RA error:', error);
    res.status(500).json({ error: 'Failed to create RA account' });
  }
});

// Get all RAs (Admin only)
router.get('/ras', async (req, res) => {
  try {
    const userRole = req.headers['user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all RAs' });
    }

    const [ras] = await pool.execute(
      `SELECT 
        r.ra_id,
        r.user_id,
        r.building_id,
        r.phone_number,
        r.office_location,
        r.created_at,
        u.username,
        u.student_email,
        b.building_name
      FROM ras r
      INNER JOIN users u ON r.user_id = u.user_id
      INNER JOIN buildings b ON r.building_id = b.building_id
      ORDER BY b.building_name, u.username`
    );

    res.json(ras);
  } catch (error) {
    console.error('Get RAs error:', error);
    res.status(500).json({ error: 'Failed to fetch RAs' });
  }
});

module.exports = router;

