# RPG Connect V5 — audit préalable (29 octobre 2026)

## Sources canoniques

Pilot20 ne constitue pas le code des six applications historiques. Cette mission utilise exclusivement les dépôts `Kentaro`, `Brackmard`, `Samoth`, `Rufus`, `Nans`, `Zephyr`, `Encounter` et `RPG-Connect` de bryantoualy-del. Aucun fichier de Pilot20 ne doit changer.

## Réutilisation et écarts

| Surface | Existant vérifié | Adaptation nécessaire |
|---|---|---|
| UI | HTML/CSS propres à chaque personnage, moteurs natifs via `__CompanionBridge` et `CompanionAPI` | Conserver moteurs, styles, portraits ; raccourcis vers les boutons natifs |
| Barre de tour | `companion-turnbar.js/css` ; six configurations de sélecteurs | Contours contextuels uniquement |
| Groupe | `rpg-group.js`, modale, choix contraint de cibles alliées | Garder le choix pour les capacités ; consultation en onglet, alliés et ennemis triés |
| Initiative | Encounter : préparation, validation, `currentTurnSession`, `turnStartRevision`, `RPGTurnStart.apply` côté joueur | Réutiliser la révision de début de tour ; séparer consultation et réinitialisation |
| Local | `RPGResolution` V4, mode personnel `free`, détachement des opérations réseau | Un mode de session distinct ; le mode V4 bloque actuellement toute remontée d’état |
| Autorité | Encounter gère historiquement santé, corrections, réactions transactionnelles | Table Libre : joueur propriétaire de son état, Encounter propriétaire des ennemis |
| Réseau | Protocole v1, capacités, invitations, accusés, files, watermarks epoch/révision | Contrat V5 explicite ; filtrage au client ET au serveur |
| Restauration | Persistance locale Encounter et Companions, retransmission ; salles serveur en mémoire | Conserver les états locaux, ne pas rejouer les actions à la reconnexion |
| Journal personnel | Journal natif persistant + `rpg-activity.js` + `RPGJournalUI` | Séparer de l’activité collective et compléter états, réaction, concentration |
| Journal MJ | `mj-journal.js` et `mj-collective.js`, regroupement et annulation | Ne pas journaliser les miroirs d’état personnel |

## Capacités réelles à réutiliser

Brack : PyroMerlin, Riposte, Sentinelle, Second souffle et manœuvres. Samoth : moteur de sorts, Bouclier, Ailes protectrices, concentration. Rufus : attaques natives et Esquive instinctive. Zéphyr : moteur d’attaque, sorts et style Protection. Kentaro : Solinar/Sélhane, occultisme, spectre. Nans : Volto-Fendoir et capacités barbares. Aucun moteur ou personnage générique à créer.

## Limites de validation

La capture Kentaro et la référence exacte de vert mentionnées dans la demande ne sont pas accessibles dans cet environnement. La comparaison utilise les versions réelles avant modification, figées ci-dessous ; le vert retenu est #10b981. Les captures navigateur avant/après restent requises avant fusion. La validation porte sur des viewports tablette avec WebKit et Chromium, pas sur des appareils physiques.

## Révisions auditées

- RPG-Connect : `204f044860ef18ef6268494236a682fa201c5202`
- Encounter : `693cb70cb530bfe5c00d954d705ef270592c48b5`
- Kentaro : `5f3b3bb502f8a2577e7c044832ad8e9ba999bf00`
- Brackmard : `7dc3a089f25341e88c57620d711d7551214e7520`
- Samoth : `61bf079cdf70c18e7ffd387a940f4d64ba322574`
- Rufus : `96123e3edb5da36b5a4cafd89b9df124ffff50e7`
- Nans : `7cff816a99f531e037a487740305d78c48c6f275`
- Zephyr : `597b81b3be135895f5f82e572459057021959a36`

## Livraison et validation

Voir [RPG-CONNECT-V5-LIVRAISON.md](RPG-CONNECT-V5-LIVRAISON.md) et [RPG-CONNECT-V5-VALIDATION.json](RPG-CONNECT-V5-VALIDATION.json). Les versions publiées des dépendances utilisent les mêmes arbres Git que les sources testées. Les résultats de la revue des captures réelles sont consignés dans le rapport de livraison.
