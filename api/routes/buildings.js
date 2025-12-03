const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all buildings (Admin only)
router.get('/', async (req, res) => {
  try {
    const userRole = req.headers['user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all buildings' });
    }

    const [buildings] = await pool.execute(
      'SELECT building_id, building_name, description, created_at FROM buildings ORDER BY building_name'
    );

    res.json(buildings);
  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// Get building for RA
router.get('/ra', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (userRole !== 'RA') {
      return res.status(403).json({ error: 'Only RAs can access this endpoint' });
    }

    const [ras] = await pool.execute(
      `SELECT r.building_id, b.building_name, b.description 
       FROM ras r 
       INNER JOIN buildings b ON r.building_id = b.building_id 
       WHERE r.user_id = ?`,
      [userId]
    );

    if (ras.length === 0) {
      return res.status(404).json({ error: 'RA building not found' });
    }

    res.json(ras[0]);
  } catch (error) {
    console.error('Get RA building error:', error);
    res.status(500).json({ error: 'Failed to fetch RA building' });
  }
});

// Get building stats (member count, message count)
router.get('/:id/stats', async (req, res) => {
  try {
    const buildingId = req.params.id;
    const userRole = req.headers['user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view building stats' });
    }

    // Get member count
    const [memberCount] = await pool.execute(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_buildings WHERE building_id = ?',
      [buildingId]
    );

    // Get message count
    const [messageCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE building_id = ?',
      [buildingId]
    );

    res.json({
      memberCount: memberCount[0].count,
      messageCount: messageCount[0].count
    });
  } catch (error) {
    console.error('Get building stats error:', error);
    res.status(500).json({ error: 'Failed to fetch building stats' });
  }
});

module.exports = router;

