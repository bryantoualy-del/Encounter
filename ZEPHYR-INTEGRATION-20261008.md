# Zéphyr — intégration Encounter (8 octobre 2026)

## Audit et frontières d’autorité

Base : Encounter `864efc4` (automatismes Samoth déjà fusionnés), Zéphyr `1ce1cbb`, RPG-Connect `c4dc2f4`. Les flux de sauvegardes, réactions, soins, concentration, effets temporaires et correction atomique existants sont réutilisés ; aucun second serveur de résolution.

Le défaut de Châtiment ajouté après une première résolution était réel : l’inférence des dégâts pouvait finaliser l’attaque avant le choix. Les attaques de mêlée de Zéphyr utilisent maintenant une transaction explicite et persistée. Une seule application Encounter est indexée par `attackId`, avec restitution du résultat aux retransmissions. Les composantes gardent leur type et les châtiments de sort restent cumulables.

Zéphyr réserve et restaure ses ressources ; Encounter valide les touches, cibles, effets, défenses et PV ; RPG Connect transporte, acquitte et rejoue. Les miroirs réseau et files d’envoi ne sont pas des ressources annulables. La réconciliation des dégâts effectifs est enregistrée dans l’action d’origine.

## Mécaniques connectées

| Pouvoir | Résolution |
| --- | --- |
| Châtiment divin | Proposition après touche MJ, avant dégâts ; N1–N3, critique, fiélons/morts-vivants, opportunités, PASSER, récupération après rechargement ; transaction typée unique |
| Protection / bravoure | Couverture explicitement confirmée par le MJ ; +4 aux JdS alliés, immunité réelle Effrayé ; pas de second +4 pour Zéphyr ; retrait en cas d’incapacité |
| Conquête | Vitesse effective 0 et 5 psychiques au début du tour ; uniquement peur provenant de Zéphyr ; R/I/V et déduplication du déclenchement |
| Bénédiction | Plusieurs bénéficiaires, un d4 aux attaques/JdS ; durée et concentration ; bonus de JdS/concentration dans les Companions et d’attaque dans Encounter |
| Bouclier de la foi | +2 CA temporaire sur le bénéficiaire, retiré avec la concentration ; CA de base préservée |
| Marque du chasseur | Cible verrouillée, d6 ajouté à la transaction d’arme, critique ; transfert par action bonus après élimination de la cible |
| Arme spirituelle | Effet sans participant supplémentaire ; attaque initiale puis attaque bonus, validation et dégâts force par Encounter |
| Aura de vitalité | Soin connecté 2d6, sélection alliée, durée/concentration ; soin autonome conservé |
| Style Protection | Confirmation MJ portée/bouclier/vision, proposition inter-Companions avant d20, réaction et désavantage du jet concerné |
| BINAH — résistances | Défenses dynamiques existantes préservées ; résistance permanente feu ajoutée à l’union des résistances |
| BINAH — Mue | Réaction avant dégâts éligibles, immunité du type entrant, expiration liée à l’attaquant et non au tour de Zéphyr |
| BINAH — déviation | Flux existant CON DD15 / prochaine attaque conservé, ressources et réaction natives inchangées |
| BINAH — mur | Validation MJ de zone/bénéficiaires ; réserve partagée de 40 par élément dans Encounter ; absorption, journal et correction |
| Décret / présence | JdS existants conservés ; ordre durable, À terre pour Agenouille-toi ; peur avec origine Zéphyr, sauvegarde de présence en fin de tour |
| Châtiments de sort | Dégâts initiaux dans la transaction ; calcinant : CON/d6 feu au début, action pour éteindre ; tonitruant : FOR/À terre ; courroucé : SAG/peur puis test SAG désavantagé par action ; révélateur : neutralise invisibilité ; aveuglant : CON initial et fin de tour |

## Décisions manuelles du MJ et limites

- La portée n’est jamais déduite de coordonnées fictives. Le bouton « Auras de Zéphyr » du détail Encounter confirme la couverture à 3 m pour ce combat. Une nouvelle rencontre exige une nouvelle confirmation.
- Sans classification du monstre, Encounter propose une case MJ « fiélon / mort-vivant ». Le joueur connecté ne décide pas seul du bonus. En autonome, la case native est conservée.
- La zone 3 × 3 m du mur et les personnages réellement protégés restent une décision MJ. Le modèle actuel représente une réserve commune par type, pas une réserve supplémentaire par bénéficiaire. La fiche ne précise pas sa durée : le MJ choisit explicitement les rounds dans la confirmation de zone (champ proposé à dix, à adapter selon la fiche).
- Repoussement de 3 m et conséquences narratives de Cède / Confesse / Tais-toi sont journalisés ; Encounter ne possède pas de déplacement spatial ni de modèle des composantes verbales. Le MJ applique ces contraintes à la table.
- Pour les sauvegardes répétées d’un PNJ sans modificateur connu, le MJ fournit ce modificateur. Annuler cette saisie signale une résolution manuelle requise, sans inventer un résultat.
- Les durées de dix rounds des sorts sont suivies par le moteur d’effets existant. Marque du chasseur utilise 600 rounds (niveau disponible de la fiche, pas extrapolation des slots supérieurs).
- Les confirmations/refus d’effets sont affichés comme tels : une intention en attente n’est pas présentée comme déjà appliquée.

## Tests reproductibles

`npm test`, `npm run test:companions`, `npm run test:zephyr` dans Encounter.

`CHROMIUM_PATH=/chemin/chromium npm run test:zephyr:browser` utilise les huit dépôts frères et un serveur WebSocket local isolé. Il teste les vrais clients et Encounter, sans combat de production. Les jets sont déterministes pour vérifier les calculs ; ce test ne constitue pas une validation de distribution aléatoire.

Les captures iPhone 390 × 844 et iPad paysage 1180 × 820 sont produites dans `audit/group-results` (non versionnées). Ce sont des tests Chromium aux dimensions mobiles, pas des tests Safari matériel.

Les suites natives protègent initiative, multicible, JdS, réactions, soins, concentration, invocations, restauration et journal. Les tests dédiés couvrent les conditions d’auras, bonus sans double comptage, rupture de concentration, CA temporaire, marque/transfert, mur partagé, révélation et sauvegardes répétées des châtiments.
