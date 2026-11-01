# Assistant pour artistes — Cahier des charges MVP

## Contexte du projet

Application qui centralise pour les artistes (peinture, sculpture, performance) :
- La découverte d'événements (vernissages, expos, workshops, open calls)
- La mise en relation entre artistes (matching par intention)
- Une petite communauté locale (fil de discussion)

Différenciateurs vs les agrégateurs existants (ArtConnect, XHBT, CuratorSpace) :
- Suggestions de matching poussées, pas juste une liste passive
- Notification hebdomadaire personnalisée (par ville et discipline)
- Structure multi-villes dès le départ

## Villes de lancement

Paris et Athènes, en parallèle, dès le MVP (réseau de contacts disponible dans les deux villes pour tester en conditions réelles). Le champ "ville" doit être présent partout dans le modèle de données (utilisateurs, événements) pour permettre l'ajout facile d'autres villes plus tard (utiliser un champ `city` en base plutôt que des tables séparées par ville).

## Stack technique recommandée

- **Frontend** : Next.js (React), déployé sur Vercel
- **Backend / base de données** : Supabase (Postgres + authentification + stockage fichiers)
- **Email hebdomadaire** : Resend ou Mailgun
- **Scraping des sources structurées** : script Python (BeautifulSoup / Playwright) exécuté via cron job (GitHub Actions), ou Node.js équivalent
- **Extraction et traduction du contenu scrapé** : appel à l'API Claude pour structurer les événements bruts (titre, date, lieu, type, discipline) et traduire français ↔ grec
- **Galeries indépendantes (Instagram)** : processus manuel — toi et ta copine identifiez et soumettez ces événements via le formulaire de publication, pas de scraping automatisé (Instagram le bloque activement)

## Modèle de données (tables principales)

- `users` : id, nom, ville, discipline(s), type de profil (artiste pro / amateur / galerie / institution / curateur), bio, langue préférée, portfolio (public/privé), posts (public/privé)
- `events` : id, titre, description, type (vernissage / expo / workshop / open call / annonce), sous-type si annonce (œuvre / matériel / atelier), discipline, ville, quartier, date, lieu, statut (en attente / publié), soumis_par (user id), source (manuel / scraper)
- `saved_events` : user_id, event_id, statut (sauvegardé / je viens)
- `matching_tags` : user_id, tag (atelier partagé / collaborations / mentorat)
- `follows` : follower_id, followed_id
- `posts` : user_id, image, légende, date
- `comments` : post_id, user_id, texte, date
- `groups` : un seul groupe par ville au lancement (pas de segmentation par quartier)
- `group_messages` : group_id, user_id, texte, date

## Fonctionnalités MVP — par priorité

### Niveau 1 — cœur du produit (à construire en premier)
- Flux d'événements par ville, triés par date (pas limité à une semaine), filtrable par type/discipline/quartier, avec recherche par mot-clé
- Détail d'un événement (description, lieu, date)
- Sauvegarder / marquer "je viens"
- Écran "mes événements" (sauvegardés + je viens)
- Profil simple : bio, discipline, ville, type de profil
- Notification hebdomadaire par email (résumé personnalisé par ville/discipline)
- Soumission d'événement par les utilisateurs (formulaire + validation manuelle avant publication)

### Niveau 2 — matching et communauté
- Tags "je cherche" sur le profil
- Suggestions de matching (même ville + discipline + tag partagé)
- Contact direct (email ou message simple)
- Groupe communautaire (un seul par ville au lancement)
- Type "Annonce" (œuvre / matériel / atelier à partager) avec disclaimer transaction hors app

### Niveau 3 — à construire après validation du cœur
- Portfolio structuré (titre, technique, année) avec toggle public/privé
- Grille de posts façon Instagram, avec légendes et commentaires
- Système de suivi (follow) entre artistes
- Bibliothèque privée (espace perso non partagé)
- Carte/liste des boutiques de matériel artistique
- Vue calendrier
- Assistant IA logistique (aide à visualiser sa semaine — jamais de coaching sur la pratique créative)

## Modération — approche progressive

1. Filtres automatiques basiques (mots-clés interdits, doublons, limite de soumissions par jour)
2. Validation manuelle systématique pour les nouveaux utilisateurs
3. Statut "de confiance" après plusieurs soumissions validées → publication automatique
4. Bouton de signalement communautaire pour les cas problématiques
5. Sources institutionnelles officielles (musées, mairie) → publication automatique sans revue

## Prix

100% gratuit, sans limite de durée, pour l'instant. Pas d'infrastructure de paiement à construire au stade du MVP.

## Premiers pas concrets pour démarrer le développement

1. Initialiser le projet Next.js + connexion à un projet Supabase
2. Créer le schéma de base de données (tables ci-dessus)
3. Construire l'écran de flux avec des données statiques (sans backend) pour valider l'interface
4. Connecter le flux à la base de données Supabase
5. Ajouter l'authentification (inscription / connexion)
6. Construire le profil utilisateur et le formulaire de soumission d'événement
7. Mettre en place l'envoi de l'email hebdomadaire (déclenché manuellement au début, automatisé ensuite)
8. Ajouter le matching et le groupe communautaire
9. Lancer en version manuelle (alimentation du flux à la main) avec 5-10 utilisateurs test à Paris et à Athènes avant d'automatiser le scraping
