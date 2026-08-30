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


## V2.8 — reprise depuis la dernière version utilisateur
Cette version repart du ZIP Admin RH fourni (v2.7) et conserve ses fonctions de diagnostic, contrôle d'accès, présence et infobulles.

Ajouts :
- bouton `Appliquer les seuils recommandés` ;
- profil recommandé : ABS_IND 5/10 j, ABS_EQ 20/30 %, CAP_MIN 70/50 %, PRES_PHY 50/35 %, ABS_CONS 5/10 j, TL_SIM 50/65 %, FO_SIM 20/35 % ;
- PRES_PHY migré vers `%` de l'effectif actif ;
- unité modifiable par ligne ;
- version `Administration RH · V2.8` visible dans la barre latérale.


## V2.9 — seuil annuel d'absence
- ajout du paramètre `ABS_ANNUEL` dans les seuils RH ;
- recommandation : Orange 50 jours, Rouge 55 jours, sens MAX ;
- bouton `Créer / vérifier ABS_ANNUEL` pour ajouter automatiquement la ligne dans `Parametres_Alertes` si elle n'existe pas ;
- `Appliquer les seuils recommandés` crée également le paramètre manquant avant d'appliquer le profil ;
- aide détaillée sur le calcul annuel réalisé 🔒 + prévu 🔓.
