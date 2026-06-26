const express = require('express');
const { getDb } = require('../db/mongo');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);

// GET /api/logs?username=&from=&to=&limit=  -> recherche forensique (admin uniquement)
router.get('/', requireRole('admin'), async (req, res) => {
  const { username, from, to, limit } = req.query;
  const filter = {};

  if (username) filter.username = username;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  try {
    const db = getDb();
    const logs = await db
      .collection('audit_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit, 10) || 200, 1000))
      .toArray();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur (MongoDB)' });
  }
});

// POST /api/logs/evidence -> enregistrer une preuve d'investigation forensique
// liée à un incident (horodatage serveur = élément de chaîne de custody)
router.post('/evidence', requireRole('admin', 'analyste'), async (req, res) => {
  const { incidentId, description, hash, source } = req.body || {};

  if (!incidentId || !description) {
    return res.status(400).json({ error: 'incidentId et description requis' });
  }

  try {
    const db = getDb();
    const doc = {
      incidentId,
      description,
      hash: hash || null,
      source: source || null,
      collectedBy: req.user.username,
      collectedAt: new Date(),
    };
    const result = await db.collection('forensic_evidence').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur (MongoDB)' });
  }
});

module.exports = router;
