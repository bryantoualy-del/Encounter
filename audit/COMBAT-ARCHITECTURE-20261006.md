# Finalisation combat — audit et suivi

## Base auditée
Les huit dépôts ont été clonés depuis GitHub/main dans une nouvelle branche feature/combat-architecture-20261006. Aucun travail précédent n'a été modifié.

## Flux constatés avant modification
- Chaque Companion expose __CompanionBridge et CompanionAPI. getState publie PV, temp/source, CA, concentration, économie, ressources, défenses et invocations. MutationObserver émet state:changed ; rpg-connect-client transmet state/event au serveur.
- Le bus effectif est Encounter/rpg-connect-server.js. Le dépôt RPG-Connect contient le registre et les ressources d'icônes, pas ce serveur. Le serveur garde pendingEvents, pending commands, receipts et déduplication en mémoire ; une panne serveur perd la salle (limitation existante).
- Encounter/rpg-connect-mj.js reçoit state/roster, bindState reflète concentration et économie ; les PV gérés sont protégés contre les snapshots locaux périmés. stateSyncPayload diffuse uniquement un catalogue hostile sans PV exacts.
- applyDamageDirect applique R/I/V puis PV temp/PV, envoie hp:damage avec before/after et publie l'autorité santé. applyDamageConsequences réexécute la commande locale puis restaure le snapshot authoritative.
- Kentaro utilise CON +3 avec avantage dans les contrôles locaux, mais Math.random sans pénalité distante. Samoth utilise CON +6. Zéphyr affiche CON +6 (aura comprise) et suit conc, sans contrôle après dégâts complet. Rufus possède aussi de la concentration (Vision, Invisibilité, Motif hypnotique), CON +0 : ne pas l'oublier.
- Kentaro : Voile, Maléfice, Invisibilité, Bannissement et autres boutons data-conc. Samoth : Hâte, Invisibilité supérieure, Rayonnement, Dragon, Objets, Souffle du dragon ; bâton Brouillard/Mur. Zéphyr : boutons data-conc et châtiments. Nans/Brack n'exposent aucune concentration active native.
- Seul Samoth possède Contresort dans le code audité : emplacement N3+, automatique si niveau suffisant, sinon Charisme +7 contre 10+niveau. Aucun ajout prévu ailleurs.
- Le moteur dice-engine.js est commun (Three.js, overlay #ccDiceOverlay). CompanionSocialDice montre un ou deux d20 déjà tirés ; pas de nouveau moteur.
- Réactions : Kentaro reactionUsed ; Samoth eco.reaction ; Zéphyr eco.r ; Brack used.reaction ; Rufus economy.reaction (true=disponible) ; Nans bridge natif. Leur restauration est locale via nextTurn, actuellement appelé lors de turn:close : point à vérifier avant moteur réaction.
- Rufus : boutons spectral/hexen, attack context reaction, sneakOwn/sneakReaction séparés. Brack : brackReaction(opportunity/sentinel/riposte), réaction et sup ; target:condition Vitesse 0 envoyé sur touche.
- Agathys local Kentaro capture déjà temp avant impact, mais produit un texte de retour sans dégâts automatiques Encounter. Zéphyr peut aussi avoir Agathys : source temporaire et originalAmount présents.
- Dragon et spectre utilisent déjà RPGSummonAuthority et RPGSummons ; réconciliation/tombstones existants à conserver.

## B — hardening
Empoisonné désavantage tests/attaques ; Agrippé/Entravé et effets Vitesse 0 réduisent vitesse affichée ; échecs FOR/DEX automatique et désavantage DEX native ; Effrayé dépend de visibilité connue ; À terre/critiques reçus nécessitent distance explicite. Mécanique centrale utilisée par jets Encounter et bus. Icônes réutilisées dans les listes et popup.
Validation : 95/95 tests Encounter, dont 3 tests conditions. Les tranches suivantes ne sont pas encore validées à ce stade.

## C — concentration
Demandes Encounter par instance après R/I/V, sans confondre dégâts et perte de PV normaux. Demandes dans état combat, reprise via state sync ; résultats Companion persistants, replays jusqu'à ACK logique. Popup obligatoire, moteur Three.js natif, avantage CON +3 Kentaro, CON +6 Samoth/Zéphyr, CON +0 Rufus ; pénalité synaptique incluse. Cleanup bridge local et invocations réconciliées. Identifiant d'incarnation pour protéger une nouvelle concentration homonyme. Les conséquences santé locales sont conservées, leurs anciens contrôles de concentration sont inhibés uniquement pour les dégâts authoritative. Incapacitation et 0 PV rompent sans dé. Le serveur annonce companion-concentration-v1 sans rendre les clients antérieurs incompatibles ; les nouveaux clients exigent cette capability.
Validation initiale : 10 tests concentration, 95 non-régression, 7 clients/bridges. Chromium : six Companions connectés, six initiatives validées, fight lancé, popup et animation native Kentaro, Samoth, Zéphyr, Rufus ; aucun pageerror. Artefacts dans audit/results/concentration-summary.json. Les trois combats complets finaux ne sont pas encore réalisés.

## D — réactions génériques
Moteur transactionnel distinct des règles de personnage : request/options/claim/grant/resolve/closed, état persisté Encounter et Companion. Un seul claim gagne ; les autres Companions conservent leurs ressources. Reconnexion ne renouvelle pas la réaction. L'économie locale est conservée à turn:close et renouvelée à un nouveau turn:grant identifié. Aucun second compteur.
Validation : 113 tests automatisés ; 8 nouveaux tests moteur/client. Chromium avec Rufus et Brack : fenêtre optionnelle native, attribution à un seul Companion, conservation de la réaction du second, reconnexion sans restaurer une réaction consommée. Les capacités natives restent à raccorder en E/F.

## E — opportunités
Rufus et Brack conservent leurs boutons et moteurs natifs. Capture online uniquement : cible adverse requise, intention, options, claim, grant puis bouton natif. Offline autonome conservé. Attaque et dégâts empruntent les transactions existantes. Contextes de réaction attachés au jet ; pas de déplacement numérique ni contrôle de distance inventé. Les grants simultanés du même acteur sont verrouillés.
Rufus : Sournoise optionnelle sur touche MJ, conditions natives conservées, bucket du tour propre et bucket réaction ; réinitialisation du bucket réaction au changement réel de tour participant. Brack : réaction native, mode réseau, Sentinelle sourceTurnEnd lié au participant actif à l'instant du grant.
Validation Chromium : deux Companions, préparation via Bibliothèque/Loup sanguinaire, Sournoise propre puis opportunité pendant tour adverse sans mouvement Encounter, nouvelle Sournoise, réaction utilisée ; Brack opportunité sur touche, vitesse 0 puis expiration correcte à la fin de ce tour. Artefact opportunity-summary.json, captures iPad. Les premiers essais échouaient car la fixture n'avait plus de condition Sournoise après fin du tour, puis parce que le test n'ouvrait pas le sous-onglet Contrôle ; corrections du scénario. Un vrai manque corrigé : le flux MJ natif Rufus n'offrait pas la Sournoise.

## F — Contresort
Samoth seul : propositions par emplacement natif disponible, règle locale CHA+7, DD10+niveau, automatique si emplacement suffisant. Résultat et coûts persistés avant animation pour récupération sans double dépense. Encounter suspend useAbility avant ciblage/effets, consomme l'action interrompue ou reprend le moteur natif sur échec/passe. Métadonnées isSpell/spellLevel conservées ; capacités de Bibliothèque sans ces données exigent une déclaration MJ explicite « Lancer comme sort ». ParentActionId prévu, pas encore de contre-Contresort automatisé.
Validation : 119 tests verts. Chromium : succès automatique, échec déterministe avec dés 3D, aucun effet préalable, reconnexion pendant fenêtre. correction du harnais unitaire qui ne définissait pas le moteur natif useAbility.

## G — effets automatiques
Transactions trigger:request/result/ack persistées de part et d'autre, réémission et état de reprise. Snapshot santé avant application de l'impact ; contexte mêlée/distance uniquement explicite ou description d'attaque non ambiguë. Bridge natif Kentaro/Zéphyr calcule Agathys selon source des PV temp et montant original, même si derniers PV temp détruits. Aucun coût de réaction. Encounter vérifie IDs et cible attaquante puis applique R/I/V par son moteur normal. Effets dérivés ne se font pas passer pour une attaque et n'engendrent pas de fausse récursion.
Validation : 127 tests ; Chromium A-G incluant trois cas froid R/I/V, concentration simultanée, réaction inchangée. Correction fixture défenses normalisées. Correction supplémentaire F : sections UI singulières action/reaction vers tableaux actions/reactions ; scénario Contresort rerun avec section UI réelle, vert.

## H — profils
Résumé ajouté à la fiche déjà sélectionnable : vignette native du Companion ou icône de créature existante, type/propriétaire, CA, PV/max/temp, vie, tour actif, réaction connue, concentration, états avec registre central et durée/source. Groupe repliable dans dock existant des six Companions ; alliés y publient leur santé autorisée, états, concentration, réaction. Aucune santé absolue ennemie dans les profils publics ; jauge MJ reste optionnelle.
Validation : 129 tests + 7 clients/bridges. Chromium desktop/tablette, six Companions, groupe et profil visibles, viewport sans débordement horizontal. Captures inspectées ; absence initiale de vignette PJ corrigée par publication de l'emblème natif dans CompanionAPI, second scénario vert.

## I — stabilisation et validation finale

Correctifs de stabilisation :
- Une concentration en cours d'animation ne transmet plus de résultat partiel. Le jet est enregistré avant animation ; le résultat final, le cleanup et l'ACK restent idempotents, y compris si une incapacitation arrive pendant l'animation.
- Une réaction d'attaque attend réellement son jet natif : suppression de la fermeture prématurée à 250 ms pour ces descripteurs. Après refresh compatible avec le stockage natif, la transaction reprend l'écoute du résultat sans nouvelle consommation. Rufus sauvegarde aussi la corrélation du jet avant refresh.
- À 0 PV ou sous incapacitation, pas de grant de réaction ni d'attaque distante. Encounter refuse de changer de tour ou de terminer le combat tant qu'une résolution critique reste en attente.
- Les retours d'anciens combats sont acquittés sans modifier le nouveau combat. Les journaux incluent maintenant jets, modificateurs, pénalités, emplacement et résultat.
- Pétrifié : échecs FOR/DEX, avantage aux attaques reçues, résistances et immunité poison via le moteur existant.
- Le moteur 3D existant accepte un verdict fourni par la règle locale : concentration maintenue/perdue ou Contresort réussi/échoué. Un 20 naturel n'est pas une réussite automatique d'un JS de concentration ; un 1 n'est pas un échec automatique. Aucun second moteur de dés.
- Les rappels manuels de Riposte/protection d'allié ne demandent plus à tort une sortie de portée.

Tests automatisés : `npm test` : **136/136** ; `npm run test:companions` : **7/7** ; `npm run test:icons` : **4/4**. Les tests clients utilisent les six vrais documents et bridges natifs ; ils vérifient également le cleanup réel de Convocation d'esprit draconique et Animation d'objets. Les suites santé, multicible, invocations, protocole et reconnexion restent vertes.

### Trois combats complets Chromium

Six Companions dans chaque combat, vrais contrôles d'interface, Bibliothèque native, initiative de chacun, demandes de fin de tour avec validation MJ, attaques des deux côtés et éliminations. Fixtures isolées : PV ajustés pour permettre les scénarios et jets déterministes pour les branches critiques ; aucune salle de production utilisée. La résolution et l'animation restent natives.

| Combat | Créatures Bibliothèque | Rounds | Résultat |
|---|---|---:|---|
| 1 — concentration/états | Gobelin, Orc, Ogre | 4 | Kentaro avantage et réussite, −1d6 puis échec et disparition du Voile ; Samoth CON+6/DD11 ; Zéphyr CON+6 ; victoire et clôture propre |
| 2 — Agathys/opportunités | Loup sanguinaire, Ombre, Squelette | 3 | Lancement natif Agathys, distance sans retour, mêlée et dernière absorption avec résistance froid ; Rufus Sournoise propre puis nouvelle Sournoise sur tour adverse ; cible obligatoire ; Brack Sentinelle ; seconde réaction refusée ; victoire et clôture propre |
| 3 — boss/Contresort/reprise | Fausse hydre — Démo, Sectateur, Vétéran | 5 | Refresh Samoth et Encounter pendant concentration ; un résultat ; Contresort après reconnexion annule le sort ; Contresort raté avec 3D reprend le sort ; opportunité ratée après reconnexion et refresh ; fenêtres légendaires/repaire et phases conservées ; victoire et clôture propre |

Les trois validations ont été conservées depuis trois exécutions successives du scénario. Chaque combat complet est vert, sans exception JavaScript. Les deux premières exécutions globales se sont arrêtées dans le combat suivant : délai du rendu logiciel lors d'une initiative, puis fenêtre légendaire native non traitée par le harnais. Corrections du harnais : focus sur le lanceur, délai logiciel adapté, tap réel sans récursion de handler, interaction MJ avec les fenêtres légendaires et reconnaissance des tours de repaire. Aucun contournement de la résolution native.

Retests Chromium ciblés : Agathys A–G, froid résistant/immunisé/vulnérable, concentration simultanée ; Contresort automatique/jet raté/reconnexion ; opportunité native Rufus et Brack, expiration de Sentinelle au bon tour. Les captures du dé ont été inspectées. Profils et groupe déjà vérifiés en desktop 1440×900 et tablette paysage 1180×820, avec les six Companions et absence de débordement horizontal. Le dock existant est conservé.

Dernier retest : déconnexion/reconnexion WebSocket de Brack entre le jet d'opportunité natif et la décision Touché du MJ ; une seule réaction consommée, Sentinelle appliquée puis expirée au bon tour. Les verdicts concentration/Contresort ont également été vérifiés dans le vrai rendu Three.js. Total final : **147 tests automatisés verts** (136 + 7 + 4).

### Limites explicites, sans fausse automatisation

- Portée, visibilité, sortie de portée et Désengagement sont validés à la table lorsqu'ils ne sont pas connus. Pas de grille ni moteur de déplacement ajouté. La règle Sentinelle concernant Désengagement reste affichée dans Brack.
- Une capacité de Bibliothèque sans métadonnées de sort nécessite la déclaration MJ du niveau. Aucun sort n'est deviné à partir de son nom. Contresort est proposé uniquement par Samoth.
- Le moteur générique accepte les descripteurs futurs ; toutes les autres réactions locales ne sont pas automatiquement détectées par Encounter. Brack conserve aussi Riposte et protection d'allié via intention manuelle.
- Le contre-Contresort n'est pas automatisé : parentActionId est prévu, mais pas de nouvelle pile RAW complète.
- Le refresh d'une attaque native de Brack déjà lancée reste limité par ses callbacks natifs non sérialisés ; la reconnexion WebSocket conserve ces callbacks. Ne pas confondre ce cas avec la reprise validée des fenêtres ou de la concentration, ni avec le refresh de Rufus validé dans le combat 3.
- Une reconnexion/refresh client n'est pas un redémarrage serveur : les salles du bus restent en mémoire, conformément à l'existant. La persistence des salles après panne du processus serveur n'a pas été ajoutée.
- Les Companions restent autonomes hors ligne. Une connexion perdue pendant un combat autoritatif n'autorise pas l'écrasement silencieux des PV Encounter ni le lancement réseau d'une opportunité ; les demandes fiables attendent la reprise.

## J — livraison

Publication réalisée le **7 octobre 2026** sur les branches `main` d'Encounter et des six Companions, après les 147 tests automatisés et les trois combats complets documentés ci-dessus. Les huit branches distantes ont été relues et vérifiées après publication. RPG-Connect reste inchangé : ses icônes sont réutilisées et le serveur modifié appartient à Encounter.

Les tranches sont publiées dans leur ordre initial via l'API GitHub authentifiée. Chaque arbre Git créé a été comparé au SHA de l'arbre du commit local validé : contenu identique. Les mises à jour de main sont des fast-forwards avec contrôle de la tête attendue, sans force, reset ni suppression. Les commits distants ont de nouveaux SHA car l'API recrée leurs métadonnées ; les messages, l'ordre des tranches et les branches de travail originales sont conservés. La correspondance complète figure dans `architecture-delivery-20261007.json`.

| Dépôt | Tête main du code validé |
|---|---|
| Encounter | `920c320a523c012573825ebcf7badc535b09e04b` |
| Kentaro | `28e153187100569ab3696504a43b56826233c961` |
| Brackmard | `50f0fa7bc3cc4a07e1b1668a501d65d95a00ad7f` |
| Zephyr | `6d5ec6ac2f2a51aef0649546e6e77f6d1a77216a` |
| Rufus | `9c69675b6f74f51de9c84407401e43138cd2cfd2` |
| Samoth | `3bf06387c46c6276a3031c375bec99c426e6b239` |
| Nans | `00cf8c24f6a0f4cdeac5e5ef2f6a89ad012318a8` |
| RPG-Connect (inchangé) | `c117b408816a0f52a08449d6fa5554d94794c0b4` |

Le commit de documentation de livraison suit la tête de code Encounter indiquée ici. La publication GitHub ne constitue pas une vérification du déploiement Render en production.
