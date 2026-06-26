const { Pool } = require('pg');

// Pool de connexions PostgreSQL (paramètres via variables d'environnement,
// jamais de credentials en dur dans le code).
const pool = new Pool({
  host: process.env.PG_HOST || 'postgres',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'socket_user',
  password: process.env.PG_PASSWORD || 'changeme',
  database: process.env.PG_DATABASE || 'socket_db',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[postgres] erreur de pool inattendue', err);
});

module.exports = pool;
