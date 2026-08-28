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
