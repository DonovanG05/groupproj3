const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');

// Helper function to hash content
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Get emergencies
router.get('/', async (req, res) => {
  try {
    const buildingId = req.query.buildingId;
    const unverifiedOnly = req.query.unverifiedOnly === 'true';
    const userRole = req.headers['user-role'];
    const userId = req.headers['user-id'];

    let query = `
      SELECT 
        em.emergency_id,
        em.emergency_type,
        em.location,
        em.description,
        em.is_verified,
        em.verified_at,
        em.created_at,
        u.username AS reported_by,
        verifier.username AS verified_by_username,
        b.building_name
      FROM emergency_messages em
      INNER JOIN users u ON em.user_id = u.user_id
      INNER JOIN buildings b ON em.building_id = b.building_id
      LEFT JOIN users verifier ON em.verified_by = verifier.user_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by building
    if (buildingId) {
      query += ' AND em.building_id = ?';
      params.push(buildingId);
    } else if (userRole === 'RA') {
      // RAs can only see their building
      const [ras] = await pool.execute('SELECT building_id FROM ras WHERE user_id = ?', [userId]);
      if (ras.length > 0) {
        query += ' AND em.building_id = ?';
        params.push(ras[0].building_id);
      } else {
        return res.json([]);
      }
    }
    // Admins can see all (no filter)

    // Filter unverified only
    if (unverifiedOnly) {
      query += ' AND em.is_verified = 0';
    }

    query += ' ORDER BY em.created_at DESC';

    const [emergencies] = await pool.execute(query, params);
    res.json(emergencies);
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ error: 'Failed to fetch emergencies' });
  }
});

// Report emergency
router.post('/', async (req, res) => {
  try {
    const { buildingId, emergencyType, location, description } = req.body;
    const userId = req.body.userId || req.headers['user-id'];

    if (!buildingId || !emergencyType || !location || !description || !userId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Ensure buildingId is an integer
    const buildingIdInt = parseInt(buildingId, 10);
    if (isNaN(buildingIdInt) || buildingIdInt < 1) {
      return res.status(400).json({ error: 'Invalid building ID' });
    }

    // Validate emergency type
    if (!['medical', 'fire', 'security', 'other'].includes(emergencyType)) {
      return res.status(400).json({ error: 'Invalid emergency type' });
    }

    // Validate building exists
    const [buildings] = await pool.execute(
      'SELECT building_id FROM buildings WHERE building_id = ?',
      [buildingIdInt]
    );

    if (buildings.length === 0) {
      return res.status(400).json({ error: 'Invalid building ID' });
    }

    // Hash location and description
    const locationHash = hashContent(location);
    const descriptionHash = hashContent(description);

    // TODO: Encrypt location and description
    const [result] = await pool.execute(
      `INSERT INTO emergency_messages 
       (user_id, building_id, emergency_type, location, location_hash, description, description_hash, is_encrypted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, buildingIdInt, emergencyType, location, locationHash, description, descriptionHash, 1]
    );

    console.log('Emergency reported:', {
      emergencyId: result.insertId,
      buildingId: buildingIdInt,
      emergencyType: emergencyType,
      userId: userId,
      location: location
    });

    res.json({
      success: true,
      emergencyId: result.insertId,
      message: 'Emergency reported successfully'
    });
  } catch (error) {
    console.error('Report emergency error:', error);
    res.status(500).json({ error: 'Failed to report emergency' });
  }
});

// Verify emergency (RA/Admin only)
router.post('/:id/verify', async (req, res) => {
  try {
    const emergencyId = req.params.id;
    const { verificationNotes } = req.body;
    const userId = req.body.userId || req.headers['user-id'];
    const userRole = req.body.userRole || req.headers['user-role'];

    if (!['RA', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only RAs and admins can verify emergencies' });
    }

    // Check if RA has access to this emergency's building
    if (userRole === 'RA') {
      const [ras] = await pool.execute('SELECT building_id FROM ras WHERE user_id = ?', [userId]);
      if (ras.length > 0) {
        const [emergencies] = await pool.execute(
          'SELECT building_id FROM emergency_messages WHERE emergency_id = ?',
          [emergencyId]
        );
        if (emergencies.length === 0) {
          return res.status(404).json({ error: 'Emergency not found' });
        }
        if (emergencies[0].building_id !== ras[0].building_id) {
          return res.status(403).json({ error: 'You can only verify emergencies in your building' });
        }
      }
    }

    // Get emergency details before updating (including building_id)
    const [emergencies] = await pool.execute(
      `SELECT 
        em.emergency_id,
        em.user_id,
        em.building_id,
        em.emergency_type,
        em.location,
        em.description,
        em.is_verified,
        em.created_at
       FROM emergency_messages em
       WHERE em.emergency_id = ?`,
      [emergencyId]
    );

    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    const emergency = emergencies[0];

    // Ensure building_id exists
    if (!emergency.building_id) {
      console.error('Emergency missing building_id:', emergencyId);
      return res.status(500).json({ error: 'Emergency is missing building information' });
    }

    // Update emergency
    await pool.execute(
      'UPDATE emergency_messages SET is_verified = 1, verified_at = NOW(), verified_by = ? WHERE emergency_id = ?',
      [userId, emergencyId]
    );

    // Record verification
    await pool.execute(
      'INSERT INTO emergency_verifications (emergency_id, verified_by, verification_notes) VALUES (?, ?, ?)',
      [emergencyId, userId, verificationNotes || null]
    );

    // Create pinned message from verified emergency
    const emergencyTypeLabels = {
      medical: 'Medical Emergency',
      fire: 'Fire Emergency',
      security: 'Security Emergency',
      other: 'Emergency'
    };
    
    const emergencyLabel = emergencyTypeLabels[emergency.emergency_type] || 'Emergency';
    const pinnedContent = `🚨 ${emergencyLabel} - ${emergency.location}\n\n${emergency.description}`;
    const contentHash = hashContent(pinnedContent);

    // Log for debugging
    console.log('Creating pinned message for emergency:', {
      emergencyId: emergencyId,
      buildingId: emergency.building_id,
      emergencyType: emergency.emergency_type,
      location: emergency.location
    });

    const [pinnedResult] = await pool.execute(
      `INSERT INTO pinned_messages 
       (user_id, building_id, content, content_hash, is_encrypted, emergency_id, emergency_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, emergency.building_id, pinnedContent, contentHash, 1, emergencyId, emergency.emergency_type]
    );

    console.log('Pinned message created:', {
      pinnedMessageId: pinnedResult.insertId,
      buildingId: emergency.building_id
    });

    res.json({
      success: true,
      message: 'Emergency verified successfully and pinned to chat'
    });
  } catch (error) {
    console.error('Verify emergency error:', error);
    res.status(500).json({ error: 'Failed to verify emergency' });
  }
});

module.exports = router;



