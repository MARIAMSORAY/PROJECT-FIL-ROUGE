const express = require('express');
const pool = require('../db/postgres');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);

// GET /api/users -> liste des analystes/admins pour assignation des incidents
router.get('/', requireRole('admin', 'analyste'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, created_at FROM users ORDER BY username'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
