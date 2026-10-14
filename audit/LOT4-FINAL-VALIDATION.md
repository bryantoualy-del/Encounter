# RPG Connect V4 — Lot 4 : validation technique du 14 octobre 2026

Cette reprise conserve les branches `feature/v4-lot4-rules-20261014` et les travaux préparatoires. Elle ne réécrit pas les Lots 1 à 3. Les sept `main` ont été relus avant publication ; aucun changement concurrent n'a été constaté par rapport aux sources auditées. Le rapport `LOT4-REPRISE-BLOCAGE-20261014.md` décrit une interruption antérieure de Work, désormais résolue.

## Fonctionnalités et corrections

| Fonctionnalité | Travaux conservés | Corrections et comportement validé |
|---|---|---|
| Journal commun | Retrait du libellé « Essais locaux » sur les sept applications | Le statut repose sur la fin effective du tour, et non sur l'origine locale. Les événements et leur ordre restent conservés. Tests des deux statuts. |
| Bénédiction et Aura | Préparation existante des JdS, informations de couverture MJ | Véritable d4 distinct et détaillé ; Aura confirmée Oui/Non dans la même préparation, y compris Zéphyr. Son +4 incorporé au profil natif est extrait avant de l'ajouter une fois. Encounter vérifie les dés, le modificateur de base et le total. Les réponses sauvegardées avant l'animation sont retransmises sans nouveau jet. Même séparation pour la concentration. |
| Mode Libre | Session et transport restent disponibles | Bénédiction sélectionnable pour les essais de JdS et d'attaque ; bouton +4 Aura uniquement pour les JdS, désactivé après chaque jet. Aucune trame d'attaque, dégâts ou effets liée à ces essais ne part vers Encounter. Boutons natifs conservés ; pas de panneau permanent. |
| Modes d'attaque | Calculs propres aux compagnons et dé physique | Modes explicites pour Nans et Zéphyr ; combinaisons avantage/désavantage conservées, notamment Attaque téméraire. Dés, mode et d4 figurent dans les résultats. Kentaro combine les sources avant l'annulation, au lieu de réintroduire une source annulée. |
| Dragon de Samoth | Sélecteur indépendant et économie du dragon | Modes indépendants de Samoth ; deux Déchirements, critique, dé physique, refus d'une saisie invalide, conditions, souffle/JdS/demi-dégâts, reconnexion et disparition à la rupture de concentration. Essai libre isolé d'Encounter. |
| Hexblade | Durée en rounds des travaux préparatoires | Dix rounds, limites incluses, aucune expiration à 60 secondes réelles. Critique naturel 19 et maîtrise +4. Le chemin des dégâts MJ déclenche désormais aussi le soin unique de 14 PV à l'élimination. Maléfice reste distinct. |
| Armure des maléfices | Module existant conservé | Refus sans consommation ; d6 physique ou virtuel ; 1–3 laisse passer, 4–6 annule ; réaction consommée uniquement à l'acceptation. Résolution avant dégâts et stabilité de la retransmission. |
| PyroMerlin | Résolution passive Encounter, bouton manuel Brack conservé | Contrôle placé dans le véritable renderer `table.js`, pour chaque ennemi, y compris les membres d'un groupe. 2d6 feu au début de son tour, RIV/PV temporaires natifs, Brack déconnecté, absence de popup récurrente. Le reçu et le journal empêchent le doublon, même après annulation MJ. Une annulation passive ne réclame plus de restauration des ressources du joueur déconnecté. Anciennes demandes d'aura ignorées lors de la récupération. |
| Hâte | Implémentation Lot 3 V2 conservée | Action conditionnelle indépendante limitée à une attaque d'arme ou aux autres choix autorisés. CA/vitesse/JdS, concentration, expiration et léthargie restent dans les autorités existantes. Régression navigateur des six compagnons. |
| Arme spirituelle | Carte de sort existante | Invocation et première attaque avec la même action bonus ; frappes suivantes en bonus ; dix rounds ; sans concentration. +8, force, +4, critiques et augmentation d'un d8 aux niveaux pairs d'emplacement. Cible, résultat et dégâts vérifiés par Encounter. Outbox/transaction persistées. Frappe guidée consommée une fois. Version autonome locale avec tours et expiration. Deux poings dans la carte et attachés à Zéphyr côté MJ, sans initiative indépendante. |
| FX et tactile | Direction artistique et composants existants | Impulsions finies de soin/buff/debuff, valeur des PV réellement restaurés, durées dans Groupe ; invocation/frappe/disparition des poings et flash PyroMerlin. Pas d'overlay qui capte les clics. Navigation inférieure mobile exclue du décalage réservé au ruban existant. |
| Livraison | Sites statiques indépendants | Versions des assets actualisées, cache service-worker Encounter renouvelé. Manifest et icônes de Kentaro utilisent des chemins relatifs, utilisables à la racine Cloudflare ou sous un sous-chemin. |

## Tests réellement exécutés

Les tests utilisent Chromium réel, sept pages séparées et un serveur WebSocket local. La source serveur est celle du ZIP V4 Lot 3 déjà livré, sans modification ; l'ancien dépôt GitHub RPG Connect n'a pas été pris pour référence.

- `npm test` : 347 réussites, aucun échec.
- `npm run test:companions` : 7 réussites, aucun échec.
- `npm run test:journal` : 12 réussites, aucun échec. Le dernier test a détecté puis couvert le statut erroné des événements locaux.
- `npm run test:icons` : 4 réussites, aucun échec.
- `audit/lot4-e2e.cjs` : quatre combinaisons locales et cinq combinaisons connectées pour chaque compagnon ; refus d'Aura malgré couverture ; d4 séparé ; préparation tactile ; reconnexion pendant l'animation ; concentration et retransmission.
- `audit/lot4-local-attacks-e2e.cjs` : six attaques natives sous Bénédiction en Libre sans envoi ; modes Nans/Zéphyr et Téméraire Nans ; Arme spirituelle autonome, critique, Frappe guidée, seconde action bonus, absence de nouvel emplacement et expiration.
- `audit/lot4-hex-armor-e2e.cjs` : attente supérieure à 60 secondes effectivement exécutée ; reconnexion ; refus ; d6 physiques 2/5 et virtuels 1/6 ; réaction ; retransmission ; critique 19 ; maîtrise ; soin unique ; expiration à dix rounds.
- `audit/lot4-dragon-pyro-e2e.cjs` : annulation avantage/désavantage par les conditions, dé physique et saisie invalide, critique, souffle avec moitié sur réussite, essai libre et concentration ; annulation MJ de PyroMerlin, PV temporaires et idempotence ; vulnérabilité feu et retrait du contact.
- `audit/lot4-combat-e2e.cjs` : groupe d'ennemis, résistance/immunité/temp/offline Brack ; Arme spirituelle initiale et suivante, reconnexion, expiration ; deux Déchirements et économie indépendante ; trois combats complets avec six compagnons, trois rounds chacun, ennemis variés, dégâts, éliminations et rechargements MJ/Nans.
- `audit/lot4-ui-fx-e2e.cjs` : soin demandé 10/restauré 4, +4 PV affiché puis retiré ; Bénédiction et durée ; fixture d'emplacement N4 (non disponible au niveau actuel de Zéphyr), critique 4d8+4=36 et concentration Bénédiction conservée ; deux poings côté MJ ; ergonomie.
- `audit/haste-menu-e2e.cjs` : six compagnons, les cinq usages autorisés, une seule consommation, reconnexion, autres armes, dégâts zéro, Hâte avant attaques ordinaires, expiration/léthargie, tactile et journal.

Les fichiers de résultats des suites navigateur sont conservés dans `audit/lot4-validation/`. Ils décrivent des étapes, pas un compteur exhaustif de chaque assertion. Les jets déterministes sont des fixtures de recette ; les moteurs de résolution, pages, flux WebSocket, accusés et rechargements sont réels. Les états de niveau N4 et certaines limites de durée sont positionnés par fixture ; l'attente Hexblade supérieure à une minute est réelle.

Pour réexécuter les suites, placer les sept dépôts comme répertoires frères et la véritable source serveur dans le répertoire `server` frère du dossier qui contient ces dépôts. Installer les dépendances d'Encounter, puis définir `RPG_TEST_CHROMIUM` si Chromium n'est pas celui de Playwright. `RPG_LOT3_PORT` permet de choisir le port HTTP de recette. Aucun identifiant de production n'est requis.

## Limites et déploiement

Les formats iPad Air 5 paysage (1180 × 820 CSS) et iPhone (390 × 844 CSS), ainsi que le portrait dans la régression Hâte, ont été testés **en émulation Chromium tactile**. Aucun appareil physique ni Safari iOS n'était accessible. L'environnement utilise le rendu de dés de secours avec GPU désactivé ; le rendu WebGL accéléré sur matériel iOS n'est pas certifié par cette recette.

Aucun échec bloquant connu ne doit être présent dans les versions fusionnées. Le rapport de livraison externe contient les SHA finaux, les liens des PR et les contrôles des ZIP. Les ZIP sont des applications complètes avec `index.html` à la racine. La production Cloudflare n'a pas été modifiée. **Le serveur RPG Connect et son protocole n'ont pas été modifiés ; aucun ZIP ni redéploiement serveur n'est nécessaire.**
