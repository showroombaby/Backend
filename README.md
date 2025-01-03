# Baby API

API backend pour l'application Baby, développée avec NestJS.

## 🚀 Technologies

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Socket.IO
- Redis
- Swagger/OpenAPI

## 📋 Prérequis

- Node.js (v16+)
- PostgreSQL
- Redis
- npm ou yarn

## 🛠️ Installation

1. Cloner le repository :

```bash
git clone [URL_DU_REPO]
cd backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Configurer les variables d'environnement :

```bash
cp .env.example .env
```

4. Configurer la base de données :

```bash
npm run migration:run
```

## 🏃‍♂️ Démarrage

### Développement

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## 📚 Documentation

- Documentation API : http://localhost:3000/api
- Documentation technique : /docs

## 🧪 Tests

### Tests unitaires

```bash
npm run test
```

### Tests d'intégration

```bash
npm run test:e2e
```

## 🏗️ Architecture

```
src/
├── common/              # Utilitaires, filtres, guards, etc.
├── config/             # Configuration de l'application
├── modules/            # Modules de l'application
│   ├── auth/          # Authentification
│   ├── users/         # Gestion des utilisateurs
│   ├── products/      # Gestion des annonces
│   ├── messaging/     # Messagerie temps réel
│   ├── notifications/ # Notifications
│   └── ...
└── main.ts            # Point d'entrée de l'application
```

## 📦 Modules Principaux

### AuthModule

- Authentification JWT
- Register/Login
- Vérification email
- Reset password

### UsersModule

- CRUD utilisateurs
- Gestion des profils
- Préférences utilisateur

### ProductsModule

- CRUD annonces
- Upload d'images
- Recherche et filtrage
- Géolocalisation

### MessagingModule

- Chat en temps réel
- WebSocket avec Socket.IO
- Archivage des messages

### NotificationsModule

- Notifications temps réel
- Notifications push iOS
- Gestion des préférences

## 🔒 Sécurité

- JWT pour l'authentification
- Helmet pour les headers HTTP
- CORS configuré
- Validation des données (class-validator)
- Protection contre les injections SQL

## 🎯 Performance

- Cache Redis
- Compression des réponses
- Optimisation des images
- Pagination
- Indexation PostgreSQL

## 🔄 CI/CD

- Tests automatisés
- Linting
- Build et déploiement automatiques

## 📈 Monitoring

- Métriques Prometheus
- Logging avec Winston
- Monitoring des performances
- Alertes

## 🔧 Configuration

### Variables d'environnement

```env
# Application
PORT=3000
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=baby

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=password

# Stockage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Apple Push Notifications
APPLE_PUSH_KEY=path/to/key
APPLE_PUSH_KEY_ID=key-id
APPLE_TEAM_ID=team-id
APPLE_BUNDLE_ID=com.example.app
```

## 📝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
