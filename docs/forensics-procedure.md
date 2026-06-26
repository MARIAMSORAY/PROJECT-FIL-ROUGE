# Procédure d'investigation forensique — SOCket

## 1. Méthodologie (4 phases)

### 1.1 Identification
- À partir d'une alerte ou d'un incident créé sur la plateforme, l'analyste
  qualifie le périmètre potentiellement touché (comptes, incidents, période).

### 1.2 Collecte
- Extraction des journaux pertinents via `GET /api/logs` (filtrable par
  utilisateur et plage de dates) — réservé au rôle `admin`.
- Toute preuve externe (capture réseau, dump mémoire, fichier suspect) est
  enregistrée via `POST /api/logs/evidence`, avec :
  - une **description** de la preuve,
  - un **hash** (SHA-256 recommandé) garantissant l'intégrité,
  - la **source** (ex. EDR, pare-feu, export manuel).

### 1.3 Préservation (chaîne de custody)
- Chaque preuve enregistrée est horodatée côté serveur (`collectedAt`) et
  associée à l'analyste qui l'a collectée (`collectedBy`) — non modifiable
  depuis l'interface (ajout uniquement, pas d'édition ni de suppression).
- Le hash permet de vérifier ultérieurement qu'un fichier de preuve n'a pas
  été altéré entre la collecte et l'analyse.

### 1.4 Analyse et restitution
- Croisement des `audit_logs` (qui a fait quoi sur la plateforme) avec les
  preuves externes (`forensic_evidence`) pour reconstituer la chronologie
  de l'incident.
- Les conclusions sont documentées dans la timeline de l'incident
  (`incident_comments`), consultable lors de l'oral final.

## 2. Exemple de scénario d'investigation (à dérouler en démo)

1. Un incident "Ransomware détecté sur poste comptabilité" est créé.
2. L'analyste interroge `/api/logs?username=...` pour vérifier si le compte
   associé a eu une activité suspecte (connexions hors horaires, échecs
   d'authentification répétés).
3. Il enregistre les preuves collectées (ex. hash du binaire malveillant,
   export EDR) via `/api/logs/evidence`.
4. Il documente sa démarche et ses conclusions dans la timeline de l'incident.
5. Il fait évoluer le statut de l'incident (`en_cours` → `resolu`).

## 3. Bonnes pratiques

- Ne jamais travailler sur les preuves originales : toujours dupliquer
  (le hash permet de vérifier qu'une copie est fidèle à l'original).
- Documenter systématiquement l'heure, l'auteur et la méthode de collecte.
- Limiter l'accès aux journaux d'audit au strict rôle `admin` (RBAC) pour
  éviter toute altération ou fuite d'information sensible.
