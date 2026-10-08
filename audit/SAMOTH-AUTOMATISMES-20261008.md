# Automatismes connectés de Samoth — 8 octobre 2026

## Périmètre et architecture

Travail isolé dans `feature/samoth-connected-automatismes`, depuis les huit `main`. Aucun remplacement de `main`, aucune modification des workflows Pages ou du serveur déployé.

- Companion : ressources, choix du bénéficiaire et jets natifs ; réservations durables et restitution en cas de refus.
- RPG Connect : transport existant, nouveaux événements `effect:request`, `object:batch-request`, `object:order-request`. Réponses via `message:gm`, état via `state:sync` et `conditions:set` : pas de migration du serveur.
- Encounter : CA effective, effets persistants, tours, arbitrage des réactions et dégâts. Les identifiants d’action et d’objet empêchent les doubles applications.

## Capacités

| Capacité | Comportement connecté |
| --- | --- |
| Hâte | Bénéficiaire ou deux bénéficiaires jumelés ; +2 CA, avantage DEX, vitesse doublée. Action distincte limitée à une attaque native d’arme, Foncer, Désengager, Cacher, Utiliser un objet. L’action normale et la réaction sont préservées. Foncer augmente le budget de mouvement. Fin de concentration ou de durée : léthargie jusqu’à la fin du prochain tour. |
| Bouclier | Fenêtre avant dégâts, une réaction et un emplacement disponible. +5 CA jusqu’au début du prochain tour, réévaluation du même jet, immunité à Projectile magique. Un jet incomplet ouvre une validation MJ. |
| Ailes protectrices | Même fenêtre avant dégâts, bénéficiaire déjà identifié, portée 1,5 m/vision confirmées si absentes. Une réaction et un usage, +4 CA contre cette attaque. Les défenses du bénéficiaire restent applicables si la touche est conservée. |
| Animation d’objets | Profil et identifiant individuel par objet, PV autoritaires, destruction sans résurrection lors d’un instantané local. Affectation des cibles par objet, décision collective MJ, critiques et défenses/PV temporaires via le moteur Encounter. Ordres connectés ; poursuivre le même ordre ne dépense pas à nouveau l’action bonus. Un tour collectif conserve les objets individuellement ciblables. |
| Invisibilité supérieure | Effet persistant sur les six Companions, avantage/désavantage contextualisés ; attaque ne retire pas l’effet. Perception de l’invisible confirmée sur l’instance de créature. Fin automatique avec durée/concentration. |

## Validation reproductible

Depuis Encounter :

```sh
npm test
node audit/samoth-automatismes-browser.mjs
```

Le test navigateur accepte `CHROMIUM_PATH` et `LD_LIBRARY_PATH` si Chromium n’est pas installé par Playwright. Il démarre un serveur WebSocket et un serveur HTTP locaux et ouvre les six Companions. Les animations de dés sont neutralisées dans ce banc de test uniquement ; leur code de production est conservé.

La suite couvre Hâte sur Brack, léthargie, autre bénéficiaire et attaque native après épuisement de l’action normale, Bouclier, Ailes sur un allié, objets multicibles, invisibilité maintenue après attaque et expiration, rechargement du bénéficiaire et d’Encounter, annulation depuis le journal et réservations de ressources. Les tests d’autorité couvrent aussi critiques, Projectile magique, jet incomplet, résistances/PV temporaires et replay sans second dégât.

## Déploiement coordonné et limites

Fusionner Encounter et les six Companions, puis recharger leurs pages. RPG-Connect contient la copie canonique du module partagé ; aucun redéploiement du serveur WebSocket n’est nécessaire.

- Encounter n’a pas de positions de carte : la portée/vision des Ailes et l’efficacité des sens contre l’invisible restent confirmées à la table. Une case par instance de créature permet d’indiquer qu’elle perçoit l’invisible.
- Foncer et Désengager ont un état et un budget d’économie ; les mouvements sur la carte restent effectués à la table. Cacher et utiliser un objet utilisent les contrôles/compétences existants ; ils ne déclenchent pas une décision spatiale automatique.
- L’interface d’Animation d’objets conserve un lot d’une même taille. Les tailles existantes et leurs caractéristiques restent inchangées.
- L’annulation conserve les règles du journal : dernier événement restaurable dans le même tour/round, refus si des données ont été modifiées depuis.
- Tests Chromium à 1180 × 820 ; test sur iPad physique avec le MJ encore recommandé avant la session.

## Résultats du 8 octobre 2026

- `npm test` : 205 réussites, 0 échec.
- `npm run test:companions` : 7 réussites, 0 échec.
- Banc navigateur connecté : 19 contrôles réussis, aucune erreur JavaScript.
- Résumé archivé dans Encounter : `audit/SAMOTH-VALIDATION-20261008.json`.
