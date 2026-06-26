# Politique de Sécurité des Systèmes d'Information (PSSI) — Projet SOCket

## 1. Objet et périmètre

Cette PSSI couvre la plateforme **SOCket**, outil centralisé de gestion des
incidents de sécurité (détection → qualification → résolution → capitalisation)
destiné aux équipes SOC/CSIRT du groupe industriel client.

Périmètre technique : application web (frontend + API), base relationnelle
(PostgreSQL), base de journalisation (MongoDB), infrastructure conteneurisée
(Docker), pipeline CI/CD.

## 2. Objectifs de sécurité (DICP)

- **Disponibilité** : la plateforme doit rester accessible aux analystes 24/7
  (objectif indicatif : 99% hors maintenance planifiée).
- **Intégrité** : aucun incident ni preuve forensique ne doit pouvoir être
  altéré sans traçabilité.
- **Confidentialité** : les informations d'incidents (souvent sensibles)
  ne sont accessibles qu'aux rôles habilités.
- **Preuve / Traçabilité** : toute action sur un incident doit pouvoir être
  reconstituée a posteriori (journal d'audit MongoDB).

## 3. Gouvernance et rôles

| Rôle | Responsabilité |
|---|---|
| RSSI (client) | Valide la PSSI, arbitre les risques résiduels |
| Administrateur SOCket | Gère les comptes, les accès, la configuration de sécurité |
| Analyste SOC | Qualifie, traite et documente les incidents |
| Lecteur | Consultation seule (reporting, audit externe) |

## 4. Règles de sécurité applicables

### 4.1 Gestion des accès
- Authentification obligatoire (JWT, expiration 8h).
- Modèle RBAC à 3 rôles (`admin`, `analyste`, `lecteur`), principe du moindre
  privilège appliqué au niveau applicatif **et** base de données (DCL Postgres).
- Limitation du débit de connexion (anti brute-force) sur `/api/auth/login`.

### 4.2 Mots de passe
- Hachage `bcrypt` (coût 12), aucun mot de passe stocké en clair.
- Recommandation : 12 caractères minimum, renouvellement en cas de compromission.

### 4.3 Protection applicative
- En-têtes de sécurité HTTP (Helmet : CSP, HSTS, X-Frame-Options...).
- Validation des entrées et requêtes SQL paramétrées (protection injection SQL).
- CORS restreint en production à l'origine du frontend officiel.

### 4.4 Journalisation et preuve
- Toute requête authentifiée est journalisée (utilisateur, action, horodatage, IP).
- Les preuves forensiques liées à un incident sont horodatées et non modifiables
  a posteriori par l'interface (ajout uniquement).

### 4.5 Sauvegarde et continuité
- Voir document `PCA-PRA.md`.

## 5. Sanctions et non-conformité

Tout usage non conforme (partage de compte, contournement des contrôles
d'accès, désactivation des logs) est traité selon la politique RH/disciplinaire
du client et peut entraîner la révocation immédiate des accès.

## 6. Révision

Cette PSSI est revue à chaque évolution majeure de la plateforme et a minima
une fois par an.
