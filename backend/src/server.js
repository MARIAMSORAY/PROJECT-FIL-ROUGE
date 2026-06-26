require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectMongo } = require('./db/mongo');
const { auditLog } = require('./middleware/auditLog');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const logRoutes = require('./routes/logs');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Sécurité HTTP de base (security by design) ---------------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Limite globale anti-DoS applicative
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Journal d'audit (forensique) sur toutes les requêtes API
app.use('/api', auditLog);

// --- Routes API -------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Frontend statique (dashboard) -----------------------------------------
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- Gestion d'erreurs générique --------------------------------------------
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

async function start() {
  try {
    await connectMongo();
  } catch (err) {
    console.error('[mongo] connexion impossible au démarrage, nouvelle tentative au premier appel', err.message);
  }
  app.listen(PORT, () => {
    console.log(`SOCket API démarrée sur le port ${PORT}`);
  });
}

start();
