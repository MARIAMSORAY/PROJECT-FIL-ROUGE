# Plan de Continuité et de Reprise d'Activité (PCA/PRA) — SOCket

## 1. Objectifs

| Indicateur | Cible |
|---|---|
| RTO (Recovery Time Objective) | 4 heures |
| RPO (Recovery Point Objective) | 1 heure (fréquence des sauvegardes) |

## 2. Scénarios de sinistre couverts

1. Panne du conteneur/hôte applicatif (backend).
2. Corruption ou perte de la base PostgreSQL.
3. Corruption ou perte de la base MongoDB (logs/preuves).
4. Indisponibilité totale de l'infrastructure (sinistre majeur).

## 3. Stratégie de sauvegarde

- **PostgreSQL** : `pg_dump` quotidien automatisé + sauvegarde du volume Docker
  (`pgdata`). Conservation 30 jours, copie sur stockage externe/offsite.
- **MongoDB** : `mongodump` quotidien sur les collections `audit_logs` et
  `forensic_evidence`. Les preuves forensiques bénéficient d'une conservation
  étendue (durée légale applicable, ex. 1 an) du fait de leur valeur probatoire.
- **Code et configuration** : versionnés dans le dépôt Git (source de vérité),
  pas de sauvegarde manuelle nécessaire.

## 4. Procédures de reprise

### 4.1 Panne du backend applicatif
1. `docker compose up -d backend` (ou recréation du conteneur si l'image est saine).
2. Vérification de santé : `GET /api/health`.
3. Si l'image est corrompue : rebuild depuis le dépôt Git (`docker compose build backend`).

### 4.2 Restauration PostgreSQL
```bash
docker compose stop backend
docker exec -i socket_postgres psql -U socket_user -d socket_db < backup.sql
docker compose start backend
```

### 4.3 Restauration MongoDB
```bash
docker exec -i socket_mongo mongorestore --drop --archive < backup.archive
```

### 4.4 Sinistre majeur (perte totale de l'infrastructure)
1. Provisionner un nouvel hôte (ou environnement cloud de secours).
2. Cloner le dépôt Git.
3. Restaurer les dernières sauvegardes PostgreSQL/MongoDB depuis le stockage offsite.
4. `docker compose up -d`.
5. Contrôle d'intégrité fonctionnel (jeu de tests de fumée / smoke tests).

## 5. Tests du plan

Un exercice de restauration (sur environnement de test, données anonymisées)
doit être réalisé au minimum une fois par semestre pour valider que le RTO/RPO
cible est tenable.

## 6. Communication de crise

En cas d'indisponibilité prolongée, le RSSI et les équipes SOC sont notifiés
immédiatement ; une procédure manuelle de secours (tableur partagé sécurisé)
peut être activée temporairement pour ne pas interrompre la gestion des incidents.
