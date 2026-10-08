# Nans — audit et intégration du 8 octobre 2026

## Périmètre et sources

Audit des huit `main`, puis corrections ciblées. Aucun moteur Volto ni FX réécrit. Les sources consultées sont les fiches natives, les profils, les adaptateurs, les autorités Encounter et les tests existants. Le transport existant accepte déjà les événements et les acquitte : aucune seconde autorité de PV ou de conditions n'a été ajoutée.

| Dépôt | SHA de main audité avant modification |
|---|---|
| Nans | 548c6e13b9270145f6c4005b8291b00c7dc0661d |
| Encounter | 55b97fd36b11db4722cd46739d6d1586ce183df7 |
| RPG-Connect | 6bc804b63ca1c62ed68169415b4fbd68fda154ae |
| Kentaro | db7e72201a1138cde2722059cb51f9cf34f3b4ff |
| Samoth | ba4fd7fda93a152c66e59e60d4578737c91783d0 |
| Brackmard | 2e6dc69ff668a56ecaa0eced42f935f7e50430ec |
| Zephyr | 909e90f3dda08a0a291cb42a92398523300c183c |
| Rufus | c0481435c46da0b8e3e9580a4cb65f8501a89616 |

## Inventaire fonctionnel

« Navigateur » signifie un parcours exécuté avec Chromium et le vrai serveur WebSocket local, et non une lecture statique. Les fixtures contrôlent certains dés, PV et positions ; cela ne constitue pas un essai du déploiement public ni une validation des distances sur une carte réelle.

| Capacité / flux | État initial | Correction ou conservation | Preuve |
|---|---|---|---|
| CA Épée/Bouclier → Hache | Connectée 18/16, affichage Hache 15 | Affichage 16, transmission native conservée | Navigateur, aller/retour et undo |
| Charger et passer en Hache | Fonctionnel | Une seule action bonus, FX conservés | Navigateur + moteur natif |
| Charges jaune/rouge, transfert, surcharge magique, impact, foudre | Fonctionnel local, dégâts connectés | Moteur et animations conservés | Régression native |
| Rage : résistance C/P/T | Déclarée et calculée dans Encounter | Conservée ; état persistant borné | Navigateur : 11 → 5 |
| Rage : bonus offensif | +8 fixe, incluant explicitement +3 de Rage | Sous-total existant +5, +3 uniquement en Rage | Régression native |
| Rage : Force | Jet d'empoignade local avec avantage | Tests sociaux et contrôles appliquent avantage, annulation avec épuisement | Navigateur + unités |
| Rage aveugle | Non mécanique | Immunité charme/peur, suspension des effets antérieurs, restauration à la fin | Navigateur + unités |
| Rage : durée/interruption/reconnexion | Locale | Jeton par activation ; 10 rounds ; interruption pour incapacitation ou absence d'activité ; synchronisation | Navigateur + unités |
| Frénésie | Entrée, attaque bonus différée, épuisement locaux | Conservés ; épuisement mécanique partagé, règles 2014 | Moteur natif + unités |
| Attaque téméraire | Avantage local | État partagé ; avantage ennemi jusqu'au prochain début du tour de Nans | Navigateur pour état/reconnexion ; unités pour échéance |
| Impact chargé : renversement | Texte local | Après touche MJ : choix de zone, DEX 13 par cible, À terre, aucun dégât supplémentaire | Navigateur multicible + undo |
| Cogneur lourd : critique | Fonctionnel local | Conservé | Moteur natif |
| Cogneur lourd : élimination | Confirmation locale requise | Notification de l'élimination authoritative, disponibilité sans coût ajouté | Navigateur |
| Anneau : bonus +1d6 et seuil 62 PV | Fonctionnel local | Conservés | Moteur natif |
| Anneau : 1d4 force | PV locaux | Dégâts Encounter, PV temporaires, reçu idempotent | Navigateur + doublons |
| Écorce : 20 PV temporaires | Connectée | Conservée | Navigateur |
| Écorce : résistance / riposte | Locale / informative | Résistance conditionnelle aux attaques physiques non magiques ; riposte 1d6 au contact, une fois par attaque | Navigateur + unités |
| Écorce : fin | PV temporaires partiellement gérés | Source spécifique, extinction à épuisement/remplacement/expiration | Unités + autorité de santé existante |
| Parade de vent | Réaction locale, CA non appliquée | Fenêtre partagée avant dégâts, +2 uniquement pour cette attaque, recalcul ou arbitrage MJ | Navigateur acceptation/refus/rechargement |
| Silence de la cape | Local | Conservé ; statut dans custom, avantage de Discrétion local, aucun sort Silence ajouté | Audit + adaptateur |
| Cri de ralliement | Connecté | Conservation des six alliés, des PV temporaires, libération de peur et consommation de l'avantage d'arme | Tests existants exécutés |
| Fracas | JdS/dégâts connectés ; poussée textuelle | Déplacement 3 m à confirmer, statut mécanique et journal | Unités + navigateur |
| Hurlement | JdS/Effrayé connectés ; fuite textuelle | Réaction de cible requise, déplacement confirmé ou impossible, pas de double consommation | Unités + navigateur |
| Tentation | Déjà connectée automatiquement après dégâts du Cor | Flux conservé ; DD 13/15, SAG +0 du profil, un déclenchement par action multicible | Navigateur Dormant/Éveillé, refus/céder, reprise, undo |
| Ancêtres | Local | Effet 10 rounds, sans concentration, charges locales, zone MJ, JdS/dégâts partagés, reçus et expiration | Navigateur avec caractéristiques de test explicites + unités |
| Empoigner / Bousculer | Jet local | Cible partagée, une attaque consommée, test opposé MJ, Agrippé/À terre/déplacement | Navigateur succès/refus ; unités égalité |
| Présence intimidante | JdS/peur connectés | Portée et visibilité validées ; maintien par action sans nouveau JdS ; fin manuelle si visibilité/portée rompue | Navigateur + durée native |
| Sens du danger | Non conditionnellement intégré | Confirmation d'effet visible dans le JdS DEX, indisponible aveugle/assourdi/incapacité | Navigateur des profils ; flux de sauvegarde existant |
| Opportunité / Instruction | Flux existants | Conservation du moteur natif et de l'économie de réaction commune avec la cape | Tests de réaction + navigateur du destinataire |
| Transport / initiatives / soins / concentration / multicible | Déjà connecté | Conservé | Suite globale et tests Companions |

## Contradictions et décisions

- La CA native 15 contredisait la fonction connectée 16 : la valeur définitive demandée 16 est appliquée.
- La fiche déclarait le +3 de Rage inclus dans le +8 fixe. On soustrait uniquement ce +3 hors Rage, en conservant le sous-total d'arme +5 et les autres modificateurs. Aucun changement arbitraire de caractéristique magique.
- Le texte de la Frénésie correspond à la version 2014 : épuisement à la fin, attaque bonus dès le tour suivant. Les pénalités d'épuisement suivent cette version, pas celles de 2024.
- Le profil de sauvegarde SAG de Nans et le texte de Tentation indiquent +0, malgré une caractéristique SAG à −1 : le modificateur de sauvegarde déclaré +0 est conservé.
- Le dossier disponible ne précise ni DD, ni dés, ni rayon des ancêtres. Aucun nombre canonique n'est inventé : le MJ doit recopier ces valeurs avant la première activation ; elles sont ensuite mémorisées. Les valeurs 12/3d8/4,5 m utilisées dans les tests sont uniquement des fixtures.
- Le Cri ne précise pas la durée de son immunité à la peur. L'état partagé déjà existant reste à durée indéfinie et peut être dissipé par le MJ. Aucun délai supposé n'a été ajouté.

## Vérification et limites

Résultats exécutés : **265/265** tests Encounter (dont **17** nouveaux tests Nans), **7/7** tests Companions, **43/43** contrôles navigateur Nans/Encounter, **14/14** contrôles navigateur Tentation/Cor, et les **6 groupes** du moteur natif Volto. Zéro erreur JavaScript dans ces parcours navigateur. La CA a également été vérifiée par deux attaques ennemies natives de total 17 (touche à 16, échec à 18). Annulation des ancêtres avec zone sélectionnée et réactivation après annulation vérifiées.

Commandes : `npm test`, `npm run test:companions`, `npm run test:nans`, `npm run test:nans:browser` depuis Encounter ; `node tests/volto-regression.cjs` depuis Nans ; `node audit/session-horn-browser.mjs` depuis Encounter. Pour le navigateur, placer les huit dépôts côte à côte et disposer de Chromium/Playwright.

Les résultats exécutés sont conservés dans `nans-results/validation.json` et `nans-results/horn-validation.json`. La suite générale couvre notamment doublons, accusés, sauvegardes, réactions, concentration, multicible et undo ; la suite Companions vérifie les ponts des six personnages. Le test navigateur des cinq autres Companions vérifie leur démarrage et leurs interfaces, sans prétendre rejouer chacun de leurs pouvoirs. Le scénario Instruction vérifie le destinataire Nans via une fenêtre émise par Encounter ; le coût de Brack reste couvert par les tests existants, pas par un parcours complet de son interface dans ce scénario.

Les distances, obstacles, tailles, visibilité et déplacements restent validés par le MJ en l'absence de coordonnées. Pour un jet ennemi non structuré, la Parade offre une déclaration manuelle avec confirmation magique/non magique, puis un arbitrage de touche avant dégâts. Une attaque non caractérisée comme magique/non magique ne bénéficie pas automatiquement de la résistance d'Écorce : le contexte d'attaque doit être précisé. L'intégration des ancêtres reste dépendante des caractéristiques canoniques manquantes ; le flux technique testé ne certifie pas ces règles absentes.

Les ressources appartiennent au Companion ; Encounter restaure les consommations à travers le protocole d'undo existant. Les effets persistants et les conséquences de dégâts sont enregistrés dans Encounter et synchronisés en STATE_SYNC. Les nouveaux messages de Nans ne transmettent aucun PV réel ennemi.
