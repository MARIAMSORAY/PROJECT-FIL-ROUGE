const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://mongo:27017';
const dbName = process.env.MONGO_DB || 'socket_logs';

let client;
let db;

/**
 * Connecte (une seule fois) au cluster Mongo utilisé pour stocker :
 * - les logs applicatifs / d'audit (collection "audit_logs")
 * - les artefacts d'investigation forensique (collection "forensic_evidence")
 * Choix NoSQL : volume important, écritures fréquentes, schéma variable
 * selon le type d'évènement -> Mongo est plus adapté qu'une table SQL rigide.
 */
async function connectMongo() {
  if (db) return db;
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(dbName);

  // Index utiles pour les recherches forensiques (par date, par utilisateur, par incident)
  await db.collection('audit_logs').createIndex({ timestamp: -1 });
  await db.collection('audit_logs').createIndex({ userId: 1 });
  await db.collection('forensic_evidence').createIndex({ incidentId: 1 });

  console.log('[mongo] connecté à', dbName);
  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB non initialisé : appeler connectMongo() au démarrage');
  return db;
}

module.exports = { connectMongo, getDb };
