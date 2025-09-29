# AppBTP Backend API

Backend API pour l'application AppBTP - Déployé sur Vercel

## 🚀 Fonctionnalités

- **Authentification JWT** avec inscription et connexion
- **Gestion des effectifs** par chantier
- **Notes et constatations** 
- **Base de données MongoDB Atlas**
- **CORS configuré** pour les webapp Vercel

## 📱 Endpoints API

### Authentification
- `POST /register` - Inscription utilisateur
- `POST /login` - Connexion utilisateur
- `POST /logout` - Déconnexion
- `GET /user` - Récupérer les infos utilisateur

### Données
- `GET /cities` - Liste des villes
- `GET /chantiers` - Liste des chantiers
- `POST /effectif` - Créer un effectif
- `GET /effectif` - Liste des effectifs
- `POST /notes` - Créer une note
- `GET /notes` - Liste des notes

## 🛠️ Technologies

- **Node.js** + **Express.js**
- **MongoDB Atlas** pour la base de données
- **JWT** pour l'authentification
- **bcryptjs** pour le hashage des mots de passe
- **Vercel** pour l'hébergement serverless

## 🔧 Configuration

### Variables d'environnement
- `MONGODB_URI` - URL de connexion MongoDB
- `JWT_SECRET` - Secret pour les tokens JWT
- `NODE_ENV` - Environnement (production/development)

## 🌐 Déploiement

Configuré pour Vercel avec :
- `vercel.json` pour la configuration serverless
- CORS configuré pour les domaines autorisés
- Export module.exports pour les fonctions Vercel

## 🔐 Sécurité

- Tokens JWT sécurisés
- Mots de passe hashés avec bcrypt
- CORS restreint aux domaines autorisés
- Variables d'environnement pour les secrets