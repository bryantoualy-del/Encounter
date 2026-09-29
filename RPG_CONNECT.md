# RPG Connect v1 — ENCOUNTER × Compagnie Créole

Le cockpit ENCOUNTER reste autonome. Le serveur WebSocket se lance séparément ; GitHub Pages héberge uniquement les pages statiques.

## Lancement

```sh
cd rpg-connect
npm ci
RPG_CONNECT_GM_KEY="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))")" \
RPG_CONNECT_ORIGINS="https://biggie-mj.github.io,https://bryantoualy-del.github.io" npm start
```

En local, `ws://localhost:3000` fonctionne. En production, héberger `rpg-connect/` sur un service Node acceptant les WebSockets et exposer une adresse **wss://**. Configurer une clé MJ aléatoire, les origines GitHub Pages exactes et HTTPS sur le proxy. Ne jamais placer la clé MJ dans Git, une URL ou une capture d'écran.

Dans ENCOUNTER : ouvrir RPG Connect, saisir l'adresse, la clé et créer une salle. Associer chacun des six personnages à une instance de PJ ; générer puis transmettre individuellement l'invitation et le code de salle. Chaque joueur saisit l'adresse, la salle et son invitation dans son compagnon. La clé MJ n'est jamais transmise aux joueurs.

## Protocole

Message JSON `{v:1,type,...}`. Après `hello`, le joueur envoie un état normalisé et les événements émis par `CompanionAPI`. Le serveur les relaie au MJ en gardant le dernier état par personnage. Le MJ envoie `{type:'command',characterId,event:{id,type,characterId,payload}}`. Le serveur route la commande, la garde en attente jusqu'à l'accusé de réception et refuse les commandes venant des joueurs. Les IDs d'événements sont dédupliqués dans la salle. Un client reconnecté renvoie son état et ses événements en mémoire ; le serveur renvoie les commandes non acquittées.

Commandes v1 : dégâts, soins, PV, PV temporaires, ressources, décision Touché/Raté, `turn:next`, message ciblé, demande de réaction et attribution de la main. La décision d'attaque référence `attackId`. Les mutations passent par `CompanionAPI` ; l'interface et les règles locales restent opérationnelles hors connexion. Le Dragon de Samoth partage la connexion et porte un `actor` distinct dans les événements.

Le bouton Dégâts/Soins du cockpit route la commande au compagnon associé pendant une session connectée. L'état retourné par le compagnon met à jour le participant ENCOUNTER ; le cockpit ne recalcule pas ses règles. Une commande destinée à un joueur temporairement déconnecté attend sa reconnexion. Les autres participants continuent d'utiliser les commandes locales du cockpit. « Donner la main » transmet une notification ; « Tour suivant » commande explicitement le tour du compagnon. Le bouton de passage de tour d'ENCOUNTER ne déclenche pas simultanément cette commande.

## Vérification

À la racine du dépôt, `npm test` vérifie le relais et l’adaptateur MJ de façon autonome. `npm run test:companions` lance en plus les tests d’intégration avec les dépôts compagnons lorsqu’ils sont disponibles comme dépôts frères.

## Limites de cette version

- Les salles, invitations, commandes en attente et IDs vus sont conservés **en mémoire du serveur**. Un redémarrage serveur oblige le MJ à recréer la salle et les invitations ; les sauvegardes locales des compagnons et d'ENCOUNTER restent intactes.
- Les joueurs doivent connaître leur invitation personnelle. Les jetons sont conservés dans la session du navigateur pour permettre une recharge ; protéger l'appareil et ne pas partager le jeton.
- Le MJ et le joueur ne doivent pas ajuster en parallèle les mêmes PV ou le même tour pendant une interruption. À la reconnexion, le compagnon est la source de vérité pour ses PV. Le MJ peut attribuer la main ou commander un nouveau tour ; le bouton Tour suivant du compagnon reste autonome. Aucun changement de mécanique du Dragon n'est introduit.
- Un hébergement WebSocket et sa clé d'environnement sont nécessaires pour jouer entre appareils ; ce dépôt ne fournit pas d'URL de serveur ni de secret de production.


## Prépa Fight & initiative

Le lancement connecté suit désormais un sas explicite avant le combat :

1. Le MJ lie chaque Companion à son participant ENCOUNTER.
2. **Prépa Fight** envoie une commande `initiative:request` à chaque Companion lié. Une commande destinée à un joueur hors ligne reste en file d'attente.
3. Le Companion affiche une carte dédiée et lance l'initiative avec son profil local. Le joueur peut aussi saisir un d20 manuel.
4. Le Companion émet `initiative:rolled` avec `requestId`, dés, bonus, mode et total.
5. ENCOUNTER affiche le résultat comme **proposé**. Le MJ peut le corriger puis le **valider**.
6. **FIGHT** n'est activé que lorsque toutes les initiatives des Companions liés sont validées.
7. Au démarrage, ENCOUNTER trie l'initiative, passe en mode Combat et envoie `turn:grant` au premier Companion lié si le premier combattant est un PJ connecté.

Profils actuellement configurés : Samoth +1, Kentaro +2, Brack Mard +1, Rufus +3, Nans +2 avec avantage, Zéphyr -1.

### Événements

- MJ → Companion : `initiative:request`
- Companion → MJ : `initiative:rolled`
- MJ → Companion au premier tour : `turn:grant`

Le résultat d'initiative n'est jamais appliqué silencieusement : il reste soumis à validation MJ.
