# Encounter V1.3 — avancement

## Lot 1/4 : résultats de jets et capacités ennemies

Branche : `feat/encounter-v13-lot1-results-20261109` (base `main`, commit initial `e0a25174`).

### Audit de reprise
- PR ouvertes avant travaux : #5, #13, #15 (aucune modifiée).
- Chaîne de rendu : `app.js` définit `showActionPopup` à plusieurs reprises ; `table.js` la remplace et impose une fermeture automatique après cinq secondes. `index.html` expose `#actionPopup`. Moteur de dés 3D distinct : `assistant-dice-engine.js`.
- Mode Préparation, ratio Initiative/Cible et zoom préservés ; aucune modification du moteur de dés ni des mutations PV.
- Scripts de test existants : `npm test`, `npm run test:mj`, `npm run test:lot4`.

### Changements
- Nouveau module de présentation `encounter-v13-results.js` chargé après tous les scripts existants.
- Résultat centré, en haut, dimensionné pour paysage ; chiffres agrandis ; fermeture volontaire dédiée ; file FIFO des résultats successifs.
- Les dégâts annoncés ne sont pas assimilés à des PV réellement retirés. La carte rappelle la nécessité de vérifier l'application sans modifier l'autorité santé.
- Style séparé `encounter-v13-results.css`. Aucun changement de règles, dés, Mode Libre, Mode Préparation ou synchronisation.

### Vérification et limites
- Inspection statique de la hiérarchie des scripts et des anciens temporisateurs.
- **Tests et compilation non exécutés** : le connecteur GitHub permet la lecture/écriture de fichiers mais pas l'exécution du projet ; le clonage réseau depuis l'environnement d'exécution a échoué (résolution DNS).
- **Recette navigateur Samsung S7 FE paysage non réalisée**. Vérifier manuellement jets simples, avantage/désavantage, critique, sauvegarde, soins, dégâts mixtes, états, résultats successifs, fermeture, non-débordement, Mode Libre et Préparation avant fusion.
- Lot 2 non commencé. Aucune fusion ni aucun déploiement.
