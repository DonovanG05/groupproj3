const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');

// Debug: Log when routes file is loaded
console.log('Messages routes loaded - DELETE /pinned/:id should be available');

// Helper function to hash content (SHA-256)
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Get messages for a building
router.get('/', async (req, res) => {
  try {
    const buildingId = req.query.buildingId;
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (!buildingId) {
      return res.status(400).json({ error: 'buildingId is required' });
    }

    // For students, verify they have access to this building
    if (userRole === 'student' && userId) {
      const [userBuildings] = await pool.execute(
        'SELECT building_id FROM user_buildings WHERE user_id = ? AND building_id = ?',
        [userId, buildingId]
      );

      if (userBuildings.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this building' });
      }
    }

    // For RAs, verify they manage this building
    if (userRole === 'RA' && userId) {
      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ? AND building_id = ?',
        [userId, buildingId]
      );

      if (ras.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this building' });
      }
    }

    // Admins can access any building (no check needed)

    const [messages] = await pool.execute(
      `SELECT 
        m.message_id,
        m.content,
        m.is_anonymous,
        m.created_at,
        CASE 
          WHEN m.is_anonymous THEN 'Anonymous'
          ELSE u.username
        END AS author,
        u.user_id,
        CASE 
          WHEN s.user_id IS NOT NULL THEN 'student'
          WHEN r.user_id IS NOT NULL THEN 'RA'
          WHEN a.user_id IS NOT NULL THEN 'admin'
          ELSE NULL
        END AS author_role
      FROM messages m
      INNER JOIN users u ON m.user_id = u.user_id
      LEFT JOIN students s ON u.user_id = s.user_id
      LEFT JOIN ras r ON u.user_id = r.user_id
      LEFT JOIN admins a ON u.user_id = a.user_id
      WHERE m.building_id = ?
      ORDER BY m.created_at DESC`,
      [buildingId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create new message
router.post('/', async (req, res) => {
  try {
    const { buildingId, content, isAnonymous } = req.body;
    const userId = req.body.userId || req.headers['user-id']; // Get from body or header
    const userRole = req.headers['user-role'];

    if (!buildingId || !content || userId === undefined) {
      return res.status(400).json({ error: 'buildingId, content, and userId are required' });
    }

    // For students, verify they have access to this building
    if (userRole === 'student') {
      const [userBuildings] = await pool.execute(
        'SELECT building_id FROM user_buildings WHERE user_id = ? AND building_id = ?',
        [userId, buildingId]
      );

      if (userBuildings.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this building' });
      }
    }

    // For RAs, verify they manage this building
    if (userRole === 'RA') {
      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ? AND building_id = ?',
        [userId, buildingId]
      );

      if (ras.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this building' });
      }
    }

    // Admins can post to any building (no check needed)

    // Hash content for integrity verification
    const contentHash = hashContent(content);

    // TODO: Encrypt content before storing
    // const encryptedContent = encrypt(content);

    const [result] = await pool.execute(
      'INSERT INTO messages (user_id, building_id, content, content_hash, is_anonymous, is_encrypted) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, buildingId, content, contentHash, isAnonymous ? 1 : 0, 1]
    );

    res.json({
      success: true,
      messageId: result.insertId,
      message: 'Message created successfully'
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Delete pinned message (RA/Admin only)
// IMPORTANT: This route must be defined BEFORE GET /pinned to ensure proper route matching
// Express matches routes in order, and /pinned/:id could conflict with /pinned if not ordered correctly
router.delete('/pinned/:id', async (req, res) => {
  console.log('DELETE /pinned/:id route hit', { id: req.params.id, userId: req.headers['user-id'], userRole: req.headers['user-role'] });
  try {
    const pinnedMessageId = req.params.id;
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (!['RA', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only RAs and admins can delete pinned messages' });
    }

    if (!pinnedMessageId) {
      return res.status(400).json({ error: 'Pinned message ID is required' });
    }

    // Get the pinned message to check building access
    const [pinnedMessages] = await pool.execute(
      'SELECT building_id, user_id FROM pinned_messages WHERE pinned_message_id = ?',
      [pinnedMessageId]
    );

    if (pinnedMessages.length === 0) {
      return res.status(404).json({ error: 'Pinned message not found' });
    }

    const pinnedMessage = pinnedMessages[0];

    // For RAs, verify they manage this building
    if (userRole === 'RA') {
      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ? AND building_id = ?',
        [userId, pinnedMessage.building_id]
      );

      if (ras.length === 0) {
        return res.status(403).json({ error: 'You can only unpin messages from your assigned building' });
      }
    }

    // Admins can delete any pinned message

    // Delete the pinned message
    await pool.execute(
      'DELETE FROM pinned_messages WHERE pinned_message_id = ?',
      [pinnedMessageId]
    );

    res.json({
      success: true,
      message: 'Pinned message deleted successfully'
    });
  } catch (error) {
    console.error('Delete pinned message error:', error);
    res.status(500).json({ error: 'Failed to delete pinned message' });
  }
});

// Get pinned messages
router.get('/pinned', async (req, res) => {
  try {
    const buildingId = req.query.buildingId;
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (!buildingId) {
      return res.status(400).json({ error: 'buildingId is required' });
    }

    // For students, verify they have access to this building
    if (userRole === 'student' && userId) {
      const [userBuildings] = await pool.execute(
        'SELECT building_id FROM user_buildings WHERE user_id = ? AND building_id = ?',
        [userId, buildingId]
      );

      if (userBuildings.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this building' });
      }
    }

    // For RAs, verify they manage this building
    if (userRole === 'RA' && userId) {
      const [ras] = await pool.execute(
        'SELECT building_id FROM ras WHERE user_id = ? AND building_id = ?',
        [userId, buildingId]
      );

      if (ras.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this building' });
      }
    }

    // Admins can access any building (no check needed)

    const [messages] = await pool.execute(
      `SELECT 
        pm.pinned_message_id,
        pm.content,
        pm.created_at,
        pm.emergency_id,
        pm.emergency_type,
        u.username AS author,
        u.user_id,
        CASE 
          WHEN r.user_id IS NOT NULL THEN 'RA'
          WHEN a.user_id IS NOT NULL THEN 'admin'
          ELSE NULL
        END AS author_role
      FROM pinned_messages pm
      INNER JOIN users u ON pm.user_id = u.user_id
      LEFT JOIN ras r ON u.user_id = r.user_id
      LEFT JOIN admins a ON u.user_id = a.user_id
      WHERE pm.building_id = ?
      ORDER BY pm.created_at DESC`,
      [buildingId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
});

// Create pinned message (RA/Admin only)
router.post('/pinned', async (req, res) => {
  try {
    const { buildingId, content } = req.body;
    const userId = req.body.userId || req.headers['user-id'];
    const userRole = req.body.userRole || req.headers['user-role'];

    if (!['RA', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only RAs and admins can create pinned messages' });
    }

    if (!buildingId || !content || !userId) {
      return res.status(400).json({ error: 'buildingId, content, and userId are required' });
    }

    // Hash content
    const contentHash = hashContent(content);

    // TODO: Encrypt content
    const [result] = await pool.execute(
      'INSERT INTO pinned_messages (user_id, building_id, content, content_hash, is_encrypted) VALUES (?, ?, ?, ?, ?)',
      [userId, buildingId, content, contentHash, 1]
    );

    res.json({
      success: true,
      pinnedMessageId: result.insertId,
      message: 'Pinned message created successfully'
    });
  } catch (error) {
    console.error('Create pinned message error:', error);
    res.status(500).json({ error: 'Failed to create pinned message' });
  }
});

module.exports = router;



