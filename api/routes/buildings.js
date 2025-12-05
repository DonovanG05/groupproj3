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

// Create new building (Admin only)
router.post('/', async (req, res) => {
  try {
    const userRole = req.headers['user-role'];
    const { buildingName, description } = req.body;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create buildings' });
    }

    if (!buildingName) {
      return res.status(400).json({ error: 'Building name is required' });
    }

    // Check if building name already exists
    const [existing] = await pool.execute(
      'SELECT building_id FROM buildings WHERE building_name = ?',
      [buildingName]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Building name already exists' });
    }

    // Insert building without password (using empty string as placeholder since column is NOT NULL)
    const [result] = await pool.execute(
      'INSERT INTO buildings (building_name, building_password, description) VALUES (?, ?, ?)',
      [buildingName, '', description || null]
    );

    res.json({
      success: true,
      message: 'Building created successfully',
      buildingId: result.insertId,
      buildingName: buildingName
    });
  } catch (error) {
    console.error('Create building error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Building name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create building' });
    }
  }
});

// Get building for RA (or first building for admin)
router.get('/ra', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (userRole === 'RA') {
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
    } else if (userRole === 'admin') {
      // Admins can see the first building (or all buildings via /buildings endpoint)
      const [buildings] = await pool.execute(
        'SELECT building_id, building_name, description FROM buildings ORDER BY building_name LIMIT 1'
      );

      if (buildings.length === 0) {
        return res.status(404).json({ error: 'No buildings found' });
      }

      res.json(buildings[0]);
    } else {
      return res.status(403).json({ error: 'Only RAs and admins can access this endpoint' });
    }
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
    const userId = req.headers['user-id'];

    // Allow users to view stats for buildings they belong to
    if (userRole === 'RA') {
      // Check if RA is assigned to this building
      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ?',
        [parseInt(userId)]
      );
      
      if (ras.length === 0 || ras[0].building_id !== parseInt(buildingId)) {
        return res.status(403).json({ error: 'You can only view stats for your assigned building' });
      }
    } else if (userRole === 'student') {
      // Check if student belongs to this building
      const [userBuildings] = await pool.execute(
        'SELECT building_id FROM user_buildings WHERE user_id = ? AND building_id = ?',
        [parseInt(userId), parseInt(buildingId)]
      );
      
      if (userBuildings.length === 0) {
        return res.status(403).json({ error: 'You can only view stats for buildings you belong to' });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get building name
    const [buildings] = await pool.execute(
      'SELECT building_name FROM buildings WHERE building_id = ?',
      [buildingId]
    );

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
      building_name: buildings.length > 0 ? buildings[0].building_name : null,
      memberCount: memberCount[0].count,
      messageCount: messageCount[0].count
    });
  } catch (error) {
    console.error('Get building stats error:', error);
    res.status(500).json({ error: 'Failed to fetch building stats' });
  }
});

module.exports = router;



