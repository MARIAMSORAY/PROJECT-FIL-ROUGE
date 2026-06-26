const express = require('express');
const pool = require('../db/postgres');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

const SEVERITIES = ['critique', 'haute', 'moyenne', 'basse'];
const STATUSES = ['nouveau', 'en_cours', 'en_attente', 'resolu', 'ferme'];

router.use(requireAuth);

// GET /api/incidents?status=&severity=  -> liste (tous les rôles)
router.get('/', async (req, res) => {
  const { status, severity } = req.query;
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (severity) {
    values.push(severity);
    conditions.push(`severity = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT i.*, u.username AS assigned_username
       FROM incidents i
       LEFT JOIN users u ON u.id = i.assigned_to
       ${where}
       ORDER BY
         CASE severity WHEN 'critique' THEN 0 WHEN 'haute' THEN 1 WHEN 'moyenne' THEN 2 ELSE 3 END,
         created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/incidents/:id -> détail + commentaires (timeline)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const incident = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
    if (incident.rows.length === 0) {
      return res.status(404).json({ error: 'Incident introuvable' });
    }
    const comments = await pool.query(
      `SELECT c.*, u.username AS author_username
       FROM incident_comments c
       LEFT JOIN users u ON u.id = c.author_id
       WHERE c.incident_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json({ ...incident.rows[0], comments: comments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/incidents -> création (analyste, admin)
router.post('/', requireRole('admin', 'analyste'), async (req, res) => {
  const { title, description, severity, category } = req.body || {};

  if (!title || !severity || !SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: 'title et severity (valide) requis' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO incidents (title, description, severity, category, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description || null, severity, category || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/incidents/:id -> mise à jour statut / assignation (analyste, admin)
router.put('/:id', requireRole('admin', 'analyste'), async (req, res) => {
  const { id } = req.params;
  const { status, assigned_to, severity } = req.body || {};

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'status invalide' });
  }
  if (severity && !SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: 'severity invalide' });
  }

  try {
    const result = await pool.query(
      `UPDATE incidents SET
         status = COALESCE($1, status),
         assigned_to = COALESCE($2, assigned_to),
         severity = COALESCE($3, severity),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status || null, assigned_to || null, severity || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/incidents/:id/comments -> ajout d'une entrée de timeline
router.post('/:id/comments', requireRole('admin', 'analyste'), async (req, res) => {
  const { id } = req.params;
  const { content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content requis' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO incident_comments (incident_id, author_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, req.user.id, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/incidents/:id -> suppression (admin uniquement)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident introuvable' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
