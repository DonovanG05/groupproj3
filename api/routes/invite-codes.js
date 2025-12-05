const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');

// Generate a unique invite code
function generateInviteCode() {
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0, O, I, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all invite codes for RA's building or all buildings for admins
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];
    const buildingId = req.query.buildingId; // Optional: filter by building for admins

    if (!userId || !userRole) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    let targetBuildingId = null;

    if (userRole === 'admin') {
      // Admins can view codes for any building (or all if no buildingId specified)
      targetBuildingId = buildingId ? parseInt(buildingId) : null;
    } else if (userRole === 'RA') {
      // Get RA's building - parse userId as integer
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ?',
        [userIdInt]
      );

      if (ras.length === 0) {
        return res.status(404).json({ error: 'RA building not found. Please ensure you are assigned to a building.' });
      }

      targetBuildingId = ras[0].building_id;
    } else {
      return res.status(403).json({ error: 'Only RAs and admins can view invite codes' });
    }

    // Get all invite codes for this building (or all for admins if no building specified)
    let query = `
      SELECT 
        ic.invite_code_id,
        ic.code,
        ic.building_id,
        ic.created_by,
        ic.used_by,
        ic.used_at,
        ic.expires_at,
        ic.is_active,
        ic.created_at,
        u.username AS created_by_username,
        used_user.username AS used_by_username,
        b.building_name
      FROM invite_codes ic
      INNER JOIN users u ON ic.created_by = u.user_id
      INNER JOIN buildings b ON ic.building_id = b.building_id
      LEFT JOIN users used_user ON ic.used_by = used_user.user_id
      WHERE 1=1
    `;
    const params = [];

    if (targetBuildingId) {
      query += ' AND ic.building_id = ?';
      params.push(targetBuildingId);
    }

    query += ' ORDER BY ic.created_at DESC';

    const [codes] = await pool.execute(query, params);

    res.json(codes);
  } catch (error) {
    console.error('Get invite codes error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Failed to fetch invite codes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate new invite code (RA or Admin)
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];
    const { expiresInDays, buildingId: requestedBuildingId } = req.body; // Optional: number of days until expiration and building ID

    if (!userId || !userRole) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    if (userRole !== 'RA' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only RAs and admins can generate invite codes' });
    }

    let buildingId;

    if (userRole === 'admin') {
      // Admins can specify any building
      if (!requestedBuildingId) {
        return res.status(400).json({ error: 'Building ID is required for admins' });
      }
      
      // Verify building exists
      const [buildings] = await pool.execute(
        'SELECT building_id FROM buildings WHERE building_id = ?',
        [requestedBuildingId]
      );

      if (buildings.length === 0) {
        return res.status(404).json({ error: 'Building not found' });
      }

      buildingId = requestedBuildingId;
    } else {
      // RAs can ONLY generate for their own building - ignore any buildingId they send
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ?',
        [userIdInt]
      );

      if (ras.length === 0) {
        return res.status(404).json({ error: 'RA building not found. Please ensure you are assigned to a building.' });
      }

      buildingId = ras[0].building_id;
      
      // Security: RAs cannot generate codes for other buildings
      // If they try to specify a different building, reject the request
      if (requestedBuildingId && parseInt(requestedBuildingId) !== buildingId) {
        return res.status(403).json({ 
          error: 'You can only generate invite codes for your assigned building' 
        });
      }
    }

    // Generate unique code (retry if duplicate)
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateInviteCode();
      const [existing] = await pool.execute(
        'SELECT invite_code_id FROM invite_codes WHERE code = ?',
        [code]
      );
      if (existing.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique code' });
    }

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiresInDays);
      expiresAt = expirationDate.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Insert invite code
    const [result] = await pool.execute(
      `INSERT INTO invite_codes (code, building_id, created_by, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [code, buildingId, userId, expiresAt, 1]
    );

    res.json({
      success: true,
      inviteCodeId: result.insertId,
      code: code,
      buildingId: buildingId,
      expiresAt: expiresAt,
      message: 'Invite code generated successfully'
    });
  } catch (error) {
    console.error('Generate invite code error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Failed to generate invite code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deactivate invite code (RA or Admin)
router.post('/:id/deactivate', async (req, res) => {
  try {
    const inviteCodeId = req.params.id;
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (userRole !== 'RA' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only RAs and admins can deactivate invite codes' });
    }

    // Check if code exists
    const [codes] = await pool.execute(
      'SELECT invite_code_id, building_id FROM invite_codes WHERE invite_code_id = ?',
      [inviteCodeId]
    );

    if (codes.length === 0) {
      return res.status(404).json({ error: 'Invite code not found' });
    }

    // RAs can only deactivate codes for their building
    if (userRole === 'RA') {
      const userIdInt = parseInt(userId);
      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ?',
        [userIdInt]
      );

      if (ras.length === 0) {
        return res.status(404).json({ error: 'RA building not found' });
      }

      const buildingId = ras[0].building_id;

      if (codes[0].building_id !== buildingId) {
        return res.status(403).json({ error: 'You can only deactivate invite codes for your assigned building' });
      }
    }
    // Admins can deactivate any code (no additional check needed)

    // Deactivate code
    await pool.execute(
      'UPDATE invite_codes SET is_active = 0 WHERE invite_code_id = ?',
      [inviteCodeId]
    );

    res.json({
      success: true,
      message: 'Invite code deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate invite code error:', error);
    res.status(500).json({ error: 'Failed to deactivate invite code' });
  }
});

// Validate invite code (for signup)
router.get('/validate/:code', async (req, res) => {
  try {
    const code = req.params.code;

    const [codes] = await pool.execute(
      `SELECT 
        ic.invite_code_id,
        ic.code,
        ic.building_id,
        ic.is_active,
        ic.expires_at,
        ic.used_by,
        b.building_name
      FROM invite_codes ic
      INNER JOIN buildings b ON ic.building_id = b.building_id
      WHERE ic.code = ?`,
      [code]
    );

    if (codes.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const inviteCode = codes[0];

    // Check if already used
    if (inviteCode.used_by) {
      return res.status(400).json({ error: 'Invite code has already been used' });
    }

    // Check if inactive
    if (!inviteCode.is_active) {
      return res.status(400).json({ error: 'Invite code is no longer active' });
    }

    // Check if expired
    if (inviteCode.expires_at) {
      const expiresAt = new Date(inviteCode.expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite code has expired' });
      }
    }

    res.json({
      valid: true,
      buildingId: inviteCode.building_id,
      buildingName: inviteCode.building_name
    });
  } catch (error) {
    console.error('Validate invite code error:', error);
    res.status(500).json({ error: 'Failed to validate invite code' });
  }
});

// Use invite code (called during signup)
router.post('/use/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const [codes] = await pool.execute(
      'SELECT invite_code_id, building_id, used_by, is_active, expires_at FROM invite_codes WHERE code = ?',
      [code]
    );

    if (codes.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const inviteCode = codes[0];

    // Check if already used
    if (inviteCode.used_by) {
      return res.status(400).json({ error: 'Invite code has already been used' });
    }

    // Check if inactive
    if (!inviteCode.is_active) {
      return res.status(400).json({ error: 'Invite code is no longer active' });
    }

    // Check if expired
    if (inviteCode.expires_at) {
      const expiresAt = new Date(inviteCode.expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite code has expired' });
      }
    }

    // Mark code as used
    await pool.execute(
      'UPDATE invite_codes SET used_by = ?, used_at = NOW() WHERE invite_code_id = ?',
      [userId, inviteCode.invite_code_id]
    );

    res.json({
      success: true,
      buildingId: inviteCode.building_id,
      message: 'Invite code used successfully'
    });
  } catch (error) {
    console.error('Use invite code error:', error);
    res.status(500).json({ error: 'Failed to use invite code' });
  }
});

module.exports = router;

