# Analyse de risques — SOCket (méthode EBIOS RM simplifiée)

## Atelier 1 — Cadrage et biens essentiels

| Bien essentiel | Description | Bien support associé |
|---|---|---|
| Données d'incidents | Détails, sévérité, preuves liées aux incidents de sécurité | API + PostgreSQL |
| Journal d'audit / preuves forensiques | Traçabilité des actions, chaîne de custody | MongoDB |
| Comptes utilisateurs | Identités et habilitations des analystes/admins | PostgreSQL (table users) + JWT |
| Disponibilité du service | Capacité à traiter un incident en temps réel | Conteneurs Docker, infra hôte |

## Atelier 2 — Sources de risque

- Attaquant externe opportuniste (scan, credential stuffing).
- Attaquant externe ciblé (concurrent, groupe cybercriminel visant le secteur industriel).
- Menace interne (analyste malveillant ou négligent, abus de privilèges).
- Erreur humaine (mauvaise configuration, suppression accidentelle).

## Atelier 3/4 — Scénarios stratégiques et opérationnels

| Scénario | Vraisemblance (1-4) | Gravité (1-4) | Niveau de risque | Mesures de traitement |
|---|---|---|---|---|
| Vol d'identifiants analyste → accès non autorisé aux incidents | 3 | 3 | Élevé | MFA (évolution recommandée), rate-limiting login, rotation JWT courte, RBAC strict |
| Injection SQL sur l'API incidents | 2 | 4 | Élevé | Requêtes paramétrées (pg), validation des entrées, WAF en prod |
| Altération des journaux d'audit pour masquer une intrusion | 2 | 4 | Élevé | Logs en écriture-seule applicative, réplication MongoDB, export périodique vers stockage immuable |
| Déni de service sur l'API (DoS applicatif) | 3 | 2 | Modéré | Rate-limiting global, conteneurs avec limites de ressources, supervision |
| Exposition de la base PostgreSQL/Mongo sur Internet par erreur de configuration | 2 | 4 | Élevé | Ports non exposés en prod, réseau Docker interne, durcissement firewall |
| Insider : analyste consultant/exportant des incidents hors périmètre | 2 | 3 | Modéré | RBAC, journalisation des consultations, revue périodique des accès |
| Compromission de la chaîne CI/CD (dépendance malveillante) | 2 | 3 | Modéré | `npm audit`, SAST (semgrep), scan d'image (Trivy) avant déploiement |

*Échelle : 1 = faible, 4 = critique. Niveau de risque = combinaison vraisemblance × gravité, validé avec le RSSI.*

## Atelier 5 — Plan de traitement retenu

1. Mettre en œuvre l'authentification forte (MFA) avant mise en production réelle.
2. Externaliser/répliquer les logs MongoDB vers un stockage en écriture unique (WORM) pour garantir leur valeur probatoire.
3. Restreindre l'exposition réseau des bases de données au seul réseau Docker interne.
4. Intégrer les scans de sécurité (SAST/SCA/scan image) comme « gate » bloquant en CI avant tout déploiement en production.
5. Revue trimestrielle des comptes et rôles (principe du moindre privilège).

## Risques résiduels acceptés (à valider par le RSSI)

- Absence de MFA dans la version prototype (acceptée pour la durée du projet pédagogique, à corriger avant toute mise en production réelle).
- Pas de chiffrement applicatif supplémentaire des données au repos (repose sur le chiffrement disque de l'infrastructure hôte).
