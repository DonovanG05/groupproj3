const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');

// Helper function to hash content (SHA-256)
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Get messages for a building
router.get('/', async (req, res) => {
  try {
    const buildingId = req.query.buildingId;

    if (!buildingId) {
      return res.status(400).json({ error: 'buildingId is required' });
    }

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

    if (!buildingId || !content || userId === undefined) {
      return res.status(400).json({ error: 'buildingId, content, and userId are required' });
    }

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

// Get pinned messages
router.get('/pinned', async (req, res) => {
  try {
    const buildingId = req.query.buildingId;

    if (!buildingId) {
      return res.status(400).json({ error: 'buildingId is required' });
    }

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



