-- =========================================================
-- SOCket - Schéma SQL (PostgreSQL)
-- Exécuté automatiquement au premier démarrage du conteneur
-- postgres (docker-entrypoint-initdb.d)
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'analyste', 'lecteur')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    severity     VARCHAR(20) NOT NULL CHECK (severity IN ('critique', 'haute', 'moyenne', 'basse')),
    status       VARCHAR(20) NOT NULL DEFAULT 'nouveau'
                 CHECK (status IN ('nouveau', 'en_cours', 'en_attente', 'resolu', 'ferme')),
    category     VARCHAR(50),
    assigned_to  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_comments (
    id           SERIAL PRIMARY KEY,
    incident_id  INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content      TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status   ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_comments_incident   ON incident_comments(incident_id);

-- =========================================================
-- DCL (Data Control Language) - exemple de contrôle d'accès
-- A exécuter par un DBA en production avec des rôles dédiés
-- (laissé en commentaire pour ne pas casser l'init du conteneur
--  qui se connecte déjà avec un rôle applicatif restreint).
-- =========================================================
-- CREATE ROLE socket_app_rw  LOGIN PASSWORD 'changeme';
-- CREATE ROLE socket_app_ro  LOGIN PASSWORD 'changeme';
--
-- GRANT SELECT, INSERT, UPDATE ON incidents, incident_comments TO socket_app_rw;
-- GRANT SELECT ON users TO socket_app_rw;                 -- pas de DELETE sur users
-- GRANT SELECT ON incidents, incident_comments, users TO socket_app_ro; -- lecteur = SELECT only
-- REVOKE ALL ON users FROM PUBLIC;
