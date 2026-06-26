const { getDb } = require('../db/mongo');

/**
 * Journalise chaque requête HTTP authentifiée dans MongoDB.
 * Ces traces servent de base à :
 *  - la détection d'anomalies (ex: multiples 403 d'un même utilisateur)
 *  - l'investigation forensique en cas d'incident (qui a fait quoi, quand)
 * Conçu pour être "fire-and-forget" : une erreur de log ne doit jamais
 * bloquer la réponse à l'utilisateur.
 */
function auditLog(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const entry = {
      timestamp: new Date(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userId: req.user ? req.user.id : null,
      username: req.user ? req.user.username : null,
      role: req.user ? req.user.role : null,
    };

    try {
      const db = getDb();
      db.collection('audit_logs').insertOne(entry).catch((err) => {
        console.error('[audit] échec écriture log', err.message);
      });
    } catch (err) {
      // Mongo pas encore prêt au démarrage : on ignore silencieusement
    }
  });

  next();
}

module.exports = { auditLog };
