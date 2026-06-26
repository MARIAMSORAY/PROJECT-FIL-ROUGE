# Architecture technique — SOCket

## 1. Vue d'ensemble

```
                ┌────────────────────────┐
                │       Navigateur        │
                │  (frontend statique)    │
                └───────────┬──────────────┘
                            │ HTTPS (à activer en prod via reverse proxy)
                ┌───────────▼──────────────┐
                │   Backend API (Express)   │
                │  - Auth JWT               │
                │  - RBAC                   │
                │  - Audit log middleware    │
                └─────┬───────────────┬─────┘
                      │               │
         ┌────────────▼───┐   ┌───────▼─────────┐
         │   PostgreSQL    │   │     MongoDB       │
         │ users           │   │ audit_logs        │
         │ incidents       │   │ forensic_evidence │
         │ incident_comments│  │                    │
         └─────────────────┘   └────────────────────┘
```

Tous les composants sont conteneurisés (Docker) et orchestrés via
`docker-compose.yml` pour un déploiement reproductible.

## 2. Justification des choix techniques

| Choix | Justification |
|---|---|
| Node.js / Express | Écosystème mature, rapide à mettre en œuvre pour une API REST, large support des librairies de sécurité (helmet, jsonwebtoken). |
| PostgreSQL | Données structurées et relationnelles (incidents, utilisateurs, commentaires) avec contraintes d'intégrité (clés étrangères, CHECK). |
| MongoDB | Données semi-structurées à fort volume d'écriture (logs, preuves forensiques), schéma souple (chaque type d'évènement n'a pas les mêmes champs). |
| JWT | Authentification sans état, adaptée à une API stateless et à une éventuelle scalabilité horizontale. |
| Docker / docker-compose | Reproductibilité de l'environnement (dev → prod), isolation des services, facilité de déploiement pour le jury. |
| Helmet + rate-limiting | Réduction de la surface d'attaque applicative (en-têtes de sécurité, anti brute-force) — *security by design*. |

## 3. Modèle de données (résumé)

- `users(id, username, password_hash, role)`
- `incidents(id, title, description, severity, status, category, assigned_to, created_by, created_at, updated_at)`
- `incident_comments(id, incident_id, author_id, content, created_at)` — timeline/investigation
- Mongo `audit_logs` : `{ timestamp, method, path, statusCode, userId, username, role, ip }`
- Mongo `forensic_evidence` : `{ incidentId, description, hash, source, collectedBy, collectedAt }`

## 4. Flux d'authentification

1. L'analyste envoie `username`/`password` à `POST /api/auth/login`.
2. Le backend vérifie le hash bcrypt, génère un JWT signé (HS256, expiration 8h).
3. Le frontend stocke le token et l'envoie en en-tête `Authorization: Bearer ...` sur chaque appel.
4. Le middleware `requireAuth` valide le token, `requireRole` vérifie l'habilitation.

## 5. Pistes d'évolution (hors périmètre du prototype)

- Authentification multi-facteurs (MFA/TOTP).
- Reverse proxy TLS (Nginx/Traefik) devant le backend.
- Mise en place d'un WAF.
- Externalisation des logs vers une solution SIEM (ex. Elastic, Splunk) pour corrélation avancée.
