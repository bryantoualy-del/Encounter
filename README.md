# ENCOUNTER V4.1 — Table de jeu

Version V4.1 de la console, conçue pour suivre le combat tout en gardant son attention sur la table réelle. Elle ajoute notamment les icônes automatiques des 14 types de créatures D&D 5e et leurs variantes BOSS.

## Utilisation rapide

1. **Préparer** : ajoute les personnages/adversaires depuis la bibliothèque, règle leurs initiatives et utilise **Modifier** pour ajuster une instance. Les modèles de la bibliothèque restent modifiables séparément.
2. **Combat** : le tour en cours porte un liseré doré et « À JOUER ». La cible sélectionnée est encadrée en bleu. Toucher une ligne sélectionne la cible ; cela ne change pas l’ordre des tours.
3. **PV** : sélectionne la cible, choisis Dégâts ou Soins, saisis le montant puis applique. Les boutons 1/5/10 sur grand écran remplissent le montant sans l’appliquer. Entrée valide une saisie. Le montant est effacé après application.
4. **Multi-cibles** : active le mode, touche les combattants concernés, puis applique une seule fois. Les groupes possèdent un bouton « Tout cibler » dans ce mode. Annuler restaure toute l’opération.
5. **Fiche** : touche ↗. Sur téléphone, la fiche s’ouvre au-dessus de la table ; « Retour aux combattants » la ferme. La barre de PV reste accessible. Sur iPad, la fiche reste à droite.
6. **Tour suivant** : avance dans l’initiative et sélectionne le nouveau combattant. Toucher le nom « À JOUER » recentre simplement la sélection sur le tour courant.
7. **Annuler** : toujours disponible en haut après une modification. Ctrl/Cmd+Z fonctionne hors des champs de saisie et des fenêtres modales.
8. **•••** : bibliothèque, rencontres sauvegardées, journal, verrouillage de structure, import/export et backups.

## Installer sur GitHub Pages

Décompresse cette archive puis remplace les fichiers de la console à la racine du dépôt existant. **Tous les fichiers livrés, y compris les 28 PNG de créatures, sont volontairement à la racine : aucun sous-dossier n’est nécessaire.**

Remplace aussi `service-worker.js`, `table.css`, `table.js` et ajoute `creature-icons.js`. Les fichiers `creature-standard-*.png` et `creature-boss-*.png` doivent tous rester à côté de `index.html`.

Après la mise en ligne, recharge une fois le site puis ferme/réouvre les anciennes fenêtres ou la PWA afin de vider l’ancien cache. La nouvelle version est identifiable par « V4.1 » dans le titre de la page.

## Reprendre ses données

La clé de sauvegarde locale reste `encounter-console-v1`. Sur la même adresse et dans le même navigateur, la V4 reprend les données existantes. Si tu changes d’adresse, de navigateur ou d’appareil, exporte d’abord tes données en JSON depuis l’ancienne console puis utilise **••• → Importer JSON → Choisir un fichier JSON**.

Les données restent locales au navigateur : pas de synchronisation entre appareils. Les backups sont également locaux. La V4 conserve le contenu des bibliothèques fournies dans le ZIP, les rencontres et les fonctions de combat de la V3. Elle ne revalide pas les caractéristiques D&D de chaque profil.

## Vérification réalisée

La V4.1 a été contrôlée dans Chromium en deux formats représentatifs (1366×1024 et 390×844) avec 28 créatures de test couvrant les 14 types en version standard et BOSS. Les contrôles automatisés vérifient la présence d’une seule icône par carte/ligne, l’absence de débordement et de chevauchement avec le nom, le changement immédiat standard → BOSS, le verrouillage des boss permanents et l’absence d’erreur JavaScript pendant les rerendus.

Un second scénario de régression vérifie l’ajout d’un Gobelin depuis la bibliothèque, le statut BOSS d’instance, dégâts, soins, annulation, états, groupes et le comportement silencieux d’un type personnalisé sans icône. Les 28 PNG ont également été vérifiés en 384×384 avec transparence et marge de sécurité. Tous les JSON, les références de `index.html`, les ressources du cache PWA et les identifiants HTML ont été contrôlés.

Ces tests ne remplacent pas un test tactile réel sous Safari/iPadOS. Voir **REVUE-V4.1.md** pour le rapport détaillé et **ANALYSE-ERGONOMIE.md** pour le diagnostic de conception.

## Attribution

Le contenu SRD 5.1 reste sous CC-BY-4.0. Voir **LICENSE-SRD.txt**. Les illustrations et profils propres à la console d’origine restent inchangés.


## RPG Connect — Prépa Fight

Quand RPG Connect est connecté et qu'au moins un Companion est lié à un participant ENCOUNTER, le bouton **Lancer la rencontre** ouvre désormais le flux réseau de préparation :

1. **Prépa Fight** envoie une demande d'initiative à chaque Companion lié.
2. Le joueur lance son initiative depuis son Companion ; le résultat remonte au cockpit MJ.
3. Le MJ peut conserver le résultat reçu ou saisir une initiative manuellement, puis doit la **valider**.
4. **FIGHT** reste verrouillé tant que toutes les initiatives des Companions liés ne sont pas validées.
5. Au lancement, les initiatives sont appliquées à ENCOUNTER, l'ordre est recalculé et le premier Companion reçoit la main.

Le fonctionnement local historique reste inchangé lorsque RPG Connect est déconnecté ou qu'aucun Companion n'est lié.
