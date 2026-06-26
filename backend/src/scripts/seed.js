require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db/postgres');

const USERS = [
  { username: 'admin', password: 'Admin#2026!', role: 'admin' },
  { username: 'analyste1', password: 'Analyste#2026!', role: 'analyste' },
  { username: 'lecteur1', password: 'Lecteur#2026!', role: 'lecteur' },
];

async function seed() {
  console.log('Initialisation des comptes par défaut...');

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [u.username, hash, u.role]
    );
  }

  const adminId = (await pool.query("SELECT id FROM users WHERE username='admin'")).rows[0].id;
  const analysteId = (await pool.query("SELECT id FROM users WHERE username='analyste1'")).rows[0].id;

  const sample = [
    ['Tentative de phishing ciblée RH', 'Email frauduleux usurpant la DSI reçu par 12 collaborateurs.', 'haute', 'phishing'],
    ['Connexion suspecte VPN hors horaires', 'Connexion depuis une IP non habituelle à 3h du matin.', 'moyenne', 'acces'],
    ['Ransomware détecté sur poste comptabilité', 'EDR a bloqué un chiffrement de fichiers en cours.', 'critique', 'malware'],
    ['Scan de ports détecté sur le réseau interne', 'Scan Nmap repéré par l\'IDS sur le VLAN serveurs.', 'basse', 'reconnaissance'],
  ];

  for (const [title, description, severity, category] of sample) {
    await pool.query(
      `INSERT INTO incidents (title, description, severity, category, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, description, severity, category, adminId, analysteId]
    );
  }

  console.log('Seed terminé. Comptes créés :');
  USERS.forEach((u) => console.log(`  - ${u.username} / ${u.password} (${u.role})`));
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erreur de seed', err);
  process.exit(1);
});
