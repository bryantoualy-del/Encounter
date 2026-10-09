# Brack Mard — intégration combat, 9 octobre 2026

## Périmètre et versions de départ

Travail effectué depuis les derniers `main`, sans remplacer les autorités de
dégâts, soins, JdS, réactions, tours ou annulation existantes :

- Brackmard : `2e6dc69ff668a56ecaa0eced42f935f7e50430ec`.
- Encounter : `bb1b206b1d7fcb2dedce7ee6f3c6ad262a15d7f0`.
- RPG-Connect : `48d502b02ba9b61210891564d9073a65266f6339`.

Les versions Kentaro, Samoth, Zéphyr, Rufus et Nans sont épinglées dans
`audit/staging-manifest.json`. Aucun fichier de ces cinq Companions n'est modifié
par cette livraison. Le manifeste est actualisé pour inclure la dernière
intégration Nans et les nouveaux fichiers Brack dans les tests CI.

## Résultat mécanique

| Capacité | Résolution connectée | Arbitrage conservé |
| --- | --- | --- |
| Aura de PyroMerlin | Un déclenchement durable par début de tour hostile et cible ; 2d6 natifs ; autorité Encounter pour feu, défenses, PV temporaires et PV ; résultat effectif renvoyé | Contact au corps à corps confirmé par le MJ, car aucune géométrie fiable n'est disponible |
| Esquiver | Réservation d'une action native ; validation MJ ; état visible ; avantage DEX ; désavantage des assaillants visibles ; expiration au prochain début de tour Brack | Visibilité déclarée explicitement dans la fiche de l'assaillant ; incapacitation ou vitesse 0 suspend les bénéfices |
| Vigueur naine | Le soin existant et Esquiver sont réunis dans sa transaction ; une action et un dé de vie ; refus et annulation restaurent les réservations | Aucun deuxième événement Esquiver ou deuxième coût |
| Inflexible | Premier échec retenu localement ; choix durable utiliser/conserver ; relance native 3D ; nouveau résultat obligatoire ; un seul résultat définitif transmis | Mode de jet et bonus circonstanciels utilisent le dialogue JdS existant ; récupération native au repos long conservée |
| Cogneur lourd | Critique natif conservé ; déblocage sur élimination officielle par attaque d'arme de Brack pendant son tour ; non cumulable ; économie bonus préservée | Bouton « Cible à 0 PV » autonome uniquement ; aucun PV ennemi exact transmis |
| Croc-en-jambe | Bonus de dégâts conservé ; taille Grande maximum ; JdS FOR DD 17 ; À terre uniquement sur échec éligible | Taille absente : validation MJ avant le JdS ; taille trop grande : effet refusé, dégâts conservés |
| Attaque de poussée | Taille et JdS identiques ; conséquence explicite de 4,5 m après échec ; confirmation et journal persistants | Résolution sur la table, obstacles et déplacement confirmés par le MJ ; aucune coordonnée inventée |
| Riposte | Proposition sur attaque native explicitement de mêlée et ratée contre Brack ; ressource et réaction vérifiées ; procédure native existante après acceptation | Informations insuffisantes : aucun déclenchement supposé ; la validation de réaction MJ existante vérifie la table |
| Sentinelle | Proposition lorsqu'un ennemi à 1,5 m confirmé attaque une autre cible ; réaction existante ; déclenchement manuel conservé | Portée confirmée par le MJ ; exclusion d'une autre cible porteuse de Sentinelle si ce fait est renseigné |
| Opportunité | Procédure existante ; choix des manœuvres applicable conservé ; Vitesse 0 sur touche ; expiration à la fin du tour concerné | Déclenchement manuel et autorisation MJ existants |

Les attaques et dégâts contondants/feu de PyroMerlin, Attaque précise, Attaque
menaçante, Diversion, Instruction, Souffle de la forge multicible, Second souffle,
Fougue, CA 19, résistances feu/poison, avantage natif contre le poison et ressources
restent dans leurs moteurs existants. Observation de l'ennemi reste hors combat.

## Protocole et fiabilité

Le serveur RPG Connect n'a pas besoin d'une nouvelle commande ou version de
protocole. Les familles existantes sont réutilisées :

- `effect:request` : nouveaux `kind` `brack-dodge` et `brack-aura`.
- `message:gm` : nouveaux sous-payloads `brackAuraRequest` et `brackBonus` ;
  réponse existante `effectResult`.
- `heal:request` / `healthResult` : Vigueur naine, avec soin et défense dans la
  même action du journal.
- `player-save:request/result/ack` : décision Inflexible avant le résultat final ;
  métadonnées `indomitable.used` et `indomitable.firstRoll`.
- `save:request/result` : manœuvres et taille validée.
- `reaction:request/claim/grant/resolve/closed` : mêmes attaques et coûts natifs.
- `STATE_SYNC.brack` : défense, autorisation Cogneur lourd et aura en attente.
- `undo:prepare/commit/finalize` : annulations atomiques existantes, y compris le
  déblocage de l'attaque bonus sur élimination.

Le déclenchement d'aura utilise un UUID réseau court, conservé avec son empreinte
combat/début de tour/cible. Les reçus Encounter et le jet Companion sont stockés
avant les reprises réseau. Une action annulée conserve sa trace d'idempotence.
Plusieurs ennemis d'un même round sont indépendants ; aucune consommation
d'action, bonus, réaction ou ressource pour l'aura.

L'annulation conserve les limites certifiées du protocole existant : même tour,
dernière transaction restaurable, aucune modification ultérieure incompatible.
Les nouveaux états et ressources ne suppriment pas ces protections.

## Validation

- `npm test` : **280 tests**, tous réussis.
- `npm run test:companions` : **7 tests**, tous réussis, couvrant les six
  Companions et le client WebSocket partagé.
- `npm run test:icons` : **4 tests**, tous réussis.
- `npm run test:brack:browser` : **29 vérifications**, toutes réussies ; aucun
  message d'erreur JavaScript.
- `npm run test:e2e` : **116 vérifications**, toutes réussies ; les six Companions,
  jets 3D, multicible, résistances, reconnexion, annulation, cinq rounds, états,
  concentration, repos, dialogues et fin de combat sont vérifiés. La fixture
  inclut les validations MJ Nans récentes et une taille connue pour sa cible.

Le test Brack utilise le vrai serveur WebSocket local et les interfaces natives :
Esquiver et Vigueur avec annulation ; aura sur deux ennemis ; reprise d'une aura
autorisée hors ligne ; annulation de ses dégâts ; Inflexible accepter/refuser et
rechargement pendant le choix ; annulation de la relance et de ses conséquences ;
critique et élimination officielle ; reprise et annulation du déblocage bonus ;
bouton manuel bloqué ; opportunité avec manœuvre ; expiration Vitesse 0 ; Riposte
avec rechargement ; proposition Sentinelle sans consommation avant acceptation ;
Poussée native et confirmation 4,5 m.

Les tests unitaires complètent ces vérifications : résistance/immunité feu et PV
temporaires ; visibilité, incapacitation, vitesse 0 et annulation avantage/
désavantage ; exclusion des éliminations d'autres auteurs ou passives ; cible
trop grande et taille inconnue ; idempotence des reçus.

Les jets 3D initiaux d'initiative et Vigueur sont réellement affichés dans le
navigateur. Les scénarios déterministes suivants raccourcissent l'animation tout
en utilisant les calculs natifs. Les dimensions iPad paysage 1180 × 820 et
portrait 820 × 1180 sont contrôlées par Chromium avec captures visuelles. Ce n'est
pas une validation matérielle Safari/iPadOS, ni un test sur le serveur de jeu en
production. Les coupures testées sont fermeture/rechargement du navigateur et
déconnexion/reconnexion WebSocket, pas tous les types de partitions réseau.

La CI conserve ses suites existantes et ajoute le scénario Brack et ses preuves.
Le cache Encounter est versionné pour charger les modules modifiés.

## Déploiement

Les vérifications GitHub Actions et des branches sont effectuées après les
commits. Une mise à jour sur `main` ne constitue pas à elle seule une preuve de
publication GitHub Pages. Le connecteur Render n'avait aucun workspace confirmé ;
son déploiement reste non vérifié dans cette session. Aucun réglage de service,
secret ou infrastructure Render n'est modifié.
