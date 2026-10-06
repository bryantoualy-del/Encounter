# Soins, PV temporaires, Aide et réanimation — staging du 6 octobre 2026

## 1. Audit initial

Les huit dépôts ont été inspectés avant modification : Encounter, RPG-Connect et les six Companions. Bases main : Encounter a82e295, RPG-Connect c117b40, Kentaro 1c810ca, Brackmard 180f0cd, Zephyr 846f9bc, Rufus bc3e48d, Samoth cfe043c, Nans 43bba4d. Le serveur utilisé est **Encounter/rpg-connect-server.js** ; RPG-Connect contient les assets et conventions. Le bus existant et son ACK applicatif, ses enveloppes, sa file et son STATE_SYNC sont réutilisés.

Les pouvoirs natifs, ressources et resets ont servi de référence. Le grimoire fourni, page 5, complète précisément la Marque d’Asmodeus ; aucune règle officielle n’a remplacé les pouvoirs maison. Les mécaniques de slots, usages gratuits, dés de vie, réserves et économie restent locales au personnage.

## 2. Causes identifiées et corrections

- Les soins/dégâts des joueurs connectés étaient délégués aux Companions. Un destinataire fermé pouvait conserver des dégâts en attente : un soin utilisait alors des PV périmés. Encounter applique désormais immédiatement les mutations ; les commandes existantes continuent d’exécuter les conséquences natives chez le joueur sans réappliquer les PV.
- La reconnexion réimportait des PV locaux périmés ; les entités Companions étaient également supprimées au rechargement. Les participants gérés, leurs PV et effets persistent. Les snapshots ne remplacent plus la santé autoritaire.
- Le sélecteur hostile excluait les alliés à 0 PV. Le dialogue multicible existant reçoit un contexte allié séparé, sans modifier la sélection hostile.
- La normalisation supprimait les métadonnées supplémentaires. Source/temp, Aide, Marque, mort, Ancre et récupération Rufus sont explicitement sérialisées.
- Samoth et Brack avaient des clamps locaux fixes ; les en-têtes de plusieurs personnages affichaient aussi le max de base. Les calculs et affichages concernés utilisent maintenant les PV max synchronisés.
- Rufus récupérait lors d’un reset local/fermeture de tour. Seul le début de son véritable tour Encounter déclenche désormais Jugement, avec preuve persistée d’usage.
- L’avantage du Cor doit viser une attaque d’arme unique ; il est distinct des autres effets de prochain jet, consommé une fois, et conservé après une attaque de sort.
- La Flèche sacrificielle laissait un attenteur de dégâts d’attaque ouvert. Une clôture explicite à zéro ferme le flux d’attaque sans inventer des dégâts ennemis.
- Les capacités cliquées hors connexion pouvaient dépenser une ressource en mode local après avoir rejoint une table autoritaire. Les contrôles concernés bloquent cette consommation ; les intentions déjà réservées restent rejouables.
- Le rafraîchissement de santé appelait « PV fixés », écrasant le ruban mécanique et pouvant appliquer un clamp natif fixe. Un hook de rendu silencieux préserve les résultats et les PV max synchronisés.
- Une entité supprimée/recréée avec le même stableId pouvait avoir une révision plus basse et être ignorée : une époque persistée de santé distingue les nouvelles entités et rejette les anciennes synchronisations.

## 3. Architecture retenue

Companion : disponibilité, ressources, dés, économie et sélection. Encounter : camps/roster, admission, vrais PV/PV max/PV temporaires, états, résolution finale, mort et validation MJ. Bus : transport inchangé. Le soigneur et le bénéficiaire ne doivent pas partager de Companion. PNJ et invocation alliée suivent le même moteur que les PJ.

Une action réserve ses ressources une seule fois et sauvegarde l’intention localement avant émission. Les retries gardent actionId, famille, dés et cibles ; seule l’enveloppe change. Le ledger Encounter conserve résultat et empreinte de la demande. Une duplication identique renvoie le résultat précédent ; réutiliser l’identifiant avec un contenu différent est refusé. Une cible supprimée, morte pour un soin ordinaire, ou passée ennemie entraîne un refus avant toute mutation.

Les ressources refusées sont restituées seulement si leur valeur correspond encore à la réservation ; on ne restaure pas un ancien snapshot complet. Une action déjà réservée peut être reprise après reconnexion/rechargement. Les commandes de dégâts transmettent avant/après privés pour préserver les conséquences natives (concentration, Agathys, Écorce) sans doubler les PV.

## 4. Capacités intégrées

| Personnage | Capacités et comportement |
|---|---|
| Brack | Second souffle 1d10+10/bonus ; Vigueur naine 1d10+4/action/1 dé de vie ; HEAL personnel plafonné |
| Zéphyr | Imposition : quantité demandée consommée une fois, soin réel plafonné, soi/PJ/PNJ/invocation, morts-vivants/artificiels refusés |
| Zéphyr | Flèche normale : attaque native, dégâts et soin personnel autoritaire ; sacrificielle : attaque distincte puis coût personnel et soin allié atomiques |
| Zéphyr | Aura de vitalité : lancement action/slot 3/concentration, 10 tours maximum, bonus 2d6 répétable avec changement de cible |
| Zéphyr | Aide : 3 alliés mixtes, slot 2 +5 ou slot 3 +10, actuels et max, 8 h, retrait MJ ou expiration ; dégâts intermédiaires conservés |
| Zéphyr | Revivifier : événement explicite de retour à 1 PV, mort depuis moins de 1 minute et validation MJ des conditions/diamant |
| Zéphyr | Ancre : préparation de la prochaine attaque reçue, sélection manuelle des alliés à 9 m ; dégâts divisés par 2 puis soin 14 atomique |
| Zéphyr | Agathys : 5 PV temp par niveau de slot, source/montant original/expiration 1 h conservés |
| Zéphyr | Marque : seulement Imposition sur autrui ; perte max = floor(PV réellement restaurés/2), réduction cumulée limitée à 42 sur base normale 84, restauration au repos long après prière |
| Samoth | Soins 1d8+3 +1d8/slot supplémentaire, slot ou usage gratuit natif ; jumelage sur 2 cibles distinctes ; dés de vie et fiole/points de sorcellerie conservés |
| Nans | Cri : bonus/1 charge, vrai jet 2d6+4, jusqu’à 6 alliés mixtes ; PV temp, libération/immunité Effrayé, avantage prochaine attaque d’arme consommé une fois |
| Nans | Écorce : 20 PV temp personnels, source et logique native de disparition, expiration 10 rounds |
| Kentaro | Soif : 4 PV temp et usage natif ; Agathys : valeur native 25 et slot/action ; Lazarus : réaction/100 PV temp/ressource native |
| Rufus | Jugement différé : à 0 vivant admissible, début de son prochain tour réel, retour explicite à 1 PV et consommation unique même hors connexion |

Cela couvre les 20 capacités principales de la demande. Les PV temporaires ne s’additionnent jamais : le pool supérieur est conservé par défaut avec sa source ; un remplacement personnel explicite respecte les confirmations natives. Recevoir 12 du Cor avec 20 Écorce garde 20 Écorce. Les effets secondaires du Cor s’appliquent néanmoins.

Aide : 30/40 devient 35/45 ; après dégâts à 12/45, retrait donne 12/40. Une Aide déjà active est refusée jusqu’au retrait MJ : aucune accumulation ou remplacement silencieux.

## 5. Points manuels et limites de règles

- Potions mineures/majeures : quantités non définies mécaniquement ; restent manuelles, sans refonte d’inventaire. Anneau en bois : 1d6/heure sous validation MJ, manuel.
- Agathys : la source, le montant de froid original et le déclenchement au dernier PV temp sont conservés/journalisés. Le MJ applique les représailles aux PV de l’attaquant ; aucune attribution automatique d’attaquant n’est inventée.
- Lazarus : les effets secondaires natifs sont conservés ; l’inactivité d’un tour demeure contrôlée manuellement selon la fiche.
- Cor : la durée de l’immunité Effrayé n’est pas définie ; condition présente avec retrait manuel MJ, sans durée inventée.
- Ancre : sans positionnement fiable, les alliés à 9 m et l’attaque protégée sont choisis manuellement. L’interface prépare la prochaine attaque reçue ; elle ne choisit pas rétroactivement une attaque passée.
- Revivifier : le coût matériel et les exclusions sont attestés par le MJ. Pas de système économique de diamant ajouté. Mort/0 PV/inconscient sont distingués dans l’éditeur MJ.
- Le plancher Marque utilise la base normale 84 documentée, indépendamment du bonus Aide. Une future évolution permanente des PV max de Zéphyr nécessitera d’adapter cette base.

## 6. Protocole et confidentialité

Familles séparées : `heal:request`, `tempHp:request`, `maxHp:request`, `revive:request`. Charge utile : `actionId`, `combatId`, `source`, `amount`, `targetIds`, puis selon famille `effectId`, `operation`, `durationMs`, `recoveryKind`, `metadata`. L’acteur est dérivé du characterId et de son binding Encounter.

Résultat privé au soigneur : `message:gm.healthResult` avec cible/nom, quantité demandée, réellement appliquée, pool gardé et feedback mécanique utile. Les avant/après complets restent dans le ledger MJ. Santé personnelle dans STATE_SYNC : epoch/current/max/temp/tempSource/tempMetadata/judgmentSpent/revision. Le catalogue allié donne stableId, nom, camp/type, statut et Companion éventuel, **sans PV exacts**.

## 7. Fichiers par dépôt

La tranche cumule la première livraison HEAL et la présente extension :

- Encounter : app.js, index.html, service-worker.js, rpg-connect-mj.js, rpg-health-authority.js, package.json ; tests santé/MJ/protocole/multicible ; scripts audit/healing-e2e.mjs, health-families-e2e.mjs, health-complex-e2e.mjs, healing-compat-e2e.mjs, healing-hitdice-e2e.mjs ; présent rapport et healing-validation.json.
- Six Companions : rpg-health.js, companion-api.js, rpg-connect-client.js, rpg-multi-target-ui.js et index.html pour chargement et pouvoirs concernés.
- Samoth : companion.js pour Soins/jumelage/dés de vie et max dynamique.
- Rufus : companion-v3.js pour retrait de l’autorésurrection locale et cycle d’usage.
- RPG-Connect : aucun fichier modifié ; serveur/bus existants réutilisés sans refonte.

## 8. Tests automatisés et navigateur

Passe finale : **86 tests moteur/protocole/client, 7 tests transport/Companions et 4 tests icônes réussis (97/97)**. **193/193 contrôles Chromium réussis** : global 114, trois combats 26, familles 33, Cor/flèches/Ancre 15, dés de vie 1, compatibilité 4. Aucun échec ni exception JavaScript. Les résultats exacts de la passe finale sont dans healing-validation.json. Tous les scripts sont reproductibles depuis audit/ ; les tests navigateur utilisent Chromium réel, les six interfaces et le vrai serveur WebSocket, avec salles et stockage isolés. Captures, traces et échanges sont produits par les scripts.

Trois combats depuis la Bibliothèque :

1. Loup sanguinaire + Gobelin : six Companions, Garde de Sharn, Capitaine allié et Invocation alliée ; initiatives validées, Second souffle overflow/double clic, Vigueur, Imposition soi/PJ/PNJ, Soins gratuits, cible full, fin de tour/rounds.
2. Ogre + Gobelin : mêmes types d’alliés ; jumelage Companion+PNJ et deux PNJ, destinataire déconnecté, dégâts puis soin avant reconnexion, conservation de la santé autoritaire.
3. Orc + Squelette : plusieurs rounds réels, Aura/change de bénéficiaire/action bonus, soigneur déconnecté avant ACK, reload Encounter et conservation PNJ ; les suites complémentaires ajoutent Aide, temp mixtes, attaques/Cor, flèches, Ancre, mort/Revivifier et Jugement offline/reconnexion.

Chaque composition inclut deux ennemis et les six Companions ; les scénarios restent sous environ dix rounds. Les suites complémentaires simulent les cas complexes avec les mêmes véritables interfaces, pas seulement les fonctions pures. Les jets forcés/HP de fixture servent à provoquer hit/miss, overflow, décès et bornes ; les boutons, dialogues et transport restent les vrais composants.

## 9. Reconnexion, multicible et non-régression

Vérifications : source coupée avant ACK puis reprise sans second soin/temp ni seconde charge ; destinataire fermé, effets appliqués dans Encounter, puis STATE_SYNC ; PNJ soigné et Encounter rechargé ; groupe connecté/déconnecté/PNJ ; Aide/temp/source/récupération persistés ; ressources réservées une fois ; double enveloppe/actionId.

La suite globale vérifie initiatives et validation, attaque hit/miss, dégâts effectifs/RIV, JdS des six Companions, états, multicible hostile à résultats indépendants, élimination, undo, fin de tour MJ, rounds et reconnexions. Les tests santé couvrent cibles mixtes 2/3/6, morte/inconsciente, supprimée/changement de camp, full/overflow, remplacement/source et expiration.

Une passe intermédiaire avait échoué sur trois couleurs de rubans ; la cause « PV fixés » a été corrigée et les 114 contrôles ont été rejoués avec succès. Une exécution parallèle antérieure avait rencontré un timeout de clic d’initiative ; toutes les suites finales sont exécutées en série et passent.

Aucune régression connue dans la couverture exécutée à la fin. Cette confirmation est limitée aux scénarios consignés : pas de qualification matérielle sur iPad réel, pas de campagne de dix rounds pour chaque pouvoir individuellement.

## 10. Persistance et livraison

Encounter conserve PV, ledgers et effets dans son stockage navigateur. La file du bus est en mémoire : un redémarrage serveur n’a pas de persistence durable garantie ; aucun nouveau stockage externe n’est ajouté. L’expiration wall-clock est vérifiée à la reprise et par timer quand Encounter est ouvert.

Les sept dépôts modifiés utilisent `feature/healing-authority-20261006` et leurs PR draft existantes : Encounter #7, Kentaro #4, Brackmard #3, Zephyr #3, Rufus #12, Samoth #4, Nans #3. RPG-Connect est inchangé. Aucun merge, déploiement ou changement de main. Les SHA finaux sont consignés avec la livraison ; les références staging sont mises à jour seulement après les tests.

Commits Companions de cette extension (Encounter : commit contenant ce rapport dans la PR #7) :

| Dépôt | Commit staging |
|---|---|
| Kentaro | `6d87286bba09a782d4b3b5233f4d20aeb596e8d7` |
| Brackmard | `24382c57ee6ab2b8095467f79e1297daf1cdf942` |
| Zephyr | `12e12a4af3cca9304daadf76994ec478b05bea8a` |
| Rufus | `dc175cc55ad2dfc68f337ae747c0df13cb9bc206` |
| Samoth | `06172fc3c51675b0ddeaddc9a7ad0d368c913307` |
| Nans | `7253fdb06d1c376887ce5361cb87fa05a95678ef` |
