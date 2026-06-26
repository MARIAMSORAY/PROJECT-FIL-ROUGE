/**
 * Contrôle d'accès basé sur les rôles (RBAC).
 * Usage : router.delete('/incidents/:id', requireAuth, requireRole('admin'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès refusé : rôle '${req.user.role}' insuffisant (requis : ${allowedRoles.join(', ')})`,
      });
    }
    return next();
  };
}

module.exports = { requireRole };
