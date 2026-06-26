# SOCket — Plateforme centralisée de gestion d'incidents SOC

Projet réalisé dans le cadre de l'UF Cybersécurité — Bachelor 3 (Ynov Campus).
Prototype fonctionnel répondant au sujet **"SOCket"** : remplacer les
processus manuels (emails, tableurs, ticketing générique) d'un SOC par une
plateforme unique, de la détection d'un incident à sa résolution.

## 1. Fonctionnalités

- Authentification (JWT) et contrôle d'accès par rôle (`admin`, `analyste`, `lecteur`).
- Tableau de bord type kanban des incidents (par statut, filtrable par sévérité).
- Création / qualification / résolution d'incidents avec timeline d'investigation.
- Journalisation d'audit complète (MongoDB) pour traçabilité forensique.
- Enregistrement de preuves forensiques liées à un incident (chaîne de custody).
- Infrastructure conteneurisée (Docker / docker-compose) avec base SQL
  (PostgreSQL) et NoSQL (MongoDB).
- Pipeline CI avec analyse de dépendances, SAST et scan d'image Docker.

## 2. Structure du dépôt

```
socket-platform/
├── backend/              # API Node.js / Express
│   ├── src/
│   │   ├── server.js
│   │   ├── db/           # connexions PostgreSQL & MongoDB
│   │   ├── middleware/   # auth JWT, RBAC, audit log
│   │   ├── routes/       # auth, incidents, logs, users
│   │   └── scripts/      # seed (comptes + incidents de démo)
│   ├── sql/schema.sql    # schéma + exemple DCL
│   └── Dockerfile
├── frontend/             # Dashboard statique (HTML/CSS/JS, sans framework)
├── docs/                 # PSSI, analyse de risques, architecture, PCA/PRA,
│                         # procédure forensique, checklist pentest
├── .github/workflows/    # CI (npm audit, SAST, scan image)
└── docker-compose.yml
```

## 3. Lancer le projet

Prérequis : Docker + Docker Compose.

```bash
git clone <votre-depot>
cd socket-platform
docker compose up -d --build
```

Initialiser les comptes et incidents de démonstration :

```bash
docker compose exec backend npm run seed
```

Accéder à la plateforme : http://localhost:3000 (redirection vers la page
de connexion).

### Comptes de démonstration

| Compte | Mot de passe | Rôle |
|---|---|---|
| admin | Admin#2026! | admin |
| analyste1 | Analyste#2026! | analyste |
| lecteur1 | Lecteur#2026! | lecteur |

> ⚠️ Ces identifiants sont fournis uniquement pour la démonstration du
> prototype. À changer impérativement avant tout usage réel.

## 4. Documentation

- [`docs/PSSI.md`](docs/PSSI.md) — Politique de sécurité du projet
- [`docs/analyse-risques.md`](docs/analyse-risques.md) — Analyse de risques (EBIOS RM simplifié)
- [`docs/architecture.md`](docs/architecture.md) — Architecture technique et choix justifiés
- [`docs/PCA-PRA.md`](docs/PCA-PRA.md) — Plan de continuité / reprise d'activité
- [`docs/forensics-procedure.md`](docs/forensics-procedure.md) — Méthodologie d'investigation
- [`docs/pentest-checklist.md`](docs/pentest-checklist.md) — Checklist d'audit / test d'intrusion

## 5. Sécurité — points clés (security by design)

- Mots de passe hachés (bcrypt), JWT signé avec expiration courte.
- RBAC appliqué côté API (middleware) **et** documenté côté base (DCL Postgres).
- Requêtes SQL paramétrées (anti-injection).
- En-têtes de sécurité HTTP (Helmet), rate-limiting global et sur le login.
- Journal d'audit immuable côté applicatif (ajout uniquement) pour la forensique.

## 6. Limites connues du prototype (à corriger avant production réelle)

- Pas de MFA.
- Pas de TLS natif (à placer derrière un reverse proxy en production).
- Authentification MongoDB désactivée en environnement de démonstration.

Ces limites sont assumées et documentées dans l'analyse de risques comme
risques résiduels à arbitrer avec le RSSI.
