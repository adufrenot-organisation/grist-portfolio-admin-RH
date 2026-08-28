# Admin RH/PMO V2.4

Version production avec diagnostic séparé.

- Aucun bandeau technique sur les écrans métier.
- Onglet `Diagnostic` dans le menu gauche.
- État de Team, Team_ref, Motifs_RH et Parametres_Alertes.
- Nombre de lignes chargées.
- Journal des erreurs de la session avec heure et action.
- Boutons Actualiser et Effacer le journal.
- Un compteur discret apparaît à côté de Diagnostic uniquement lorsqu'une erreur a été journalisée.


## Bulles explicatives des seuils
L'écran `Seuils` affiche désormais un bouton `i` à côté de chaque règle.
Les bulles expliquent :
- ce que mesure l'indicateur ;
- les motifs pris en compte ;
- la formule ;
- le sens des seuils Orange/Rouge.
Les explications sont définies par `Code_Alerte` et ne modifient aucune donnée Grist.


## v2.5 — Présence v2
Intégration du heartbeat partagé `SESSIONS_UTILISATEURS` avec module `Admin RH` et contexte selon l'écran actif.


## v2.6 — Sécurité applicative du module Admin RH

Le module est maintenant protégé dès l'ouverture :

- Owner Grist du document : accès automatique.
- Sinon : `user.Email -> Team -> profil/role -> DROITS_MODULES`.
- Code module : `ADMIN_RH`.
- En cas de refus, aucune donnée métier n'est chargée ; une page verrouillée explique le motif.
- `access.js` v1.1.0 utilise `/access` pour identifier le rôle Owner, avec fallback `/usersForViewAs`.

Les ACL Grist restent la sécurité effective des tables.


## v2.7 — Page de blocage simplifiée
`access.js` v1.2.0 affiche désormais un refus générique sans information sur le profil, les règles internes ou la raison technique.
