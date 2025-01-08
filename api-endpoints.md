# API Endpoints Documentation

## 🔐 Authentification

### Inscription

```http
POST /auth/register
Content-Type: application/json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "street": "string",
    "zipCode": "string",
    "city": "string",
    "additionalInfo": "string"
  }
}
```

### Connexion

```http
POST /auth/login
Content-Type: application/json
{
  "email": "string",
  "password": "string"
}
```

## 👤 Utilisateurs

### Récupérer son profil

```http
GET /users/profile
Authorization: Bearer {token}
```

### Mettre à jour son profil

```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json
{
  "firstName": "string",
  "lastName": "string",
  "address": {
    "street": "string",
    "zipCode": "string",
    "city": "string",
    "additionalInfo": "string"
  }
}
```

## 📦 Messagerie

### Envoyer un message

```http
POST /messages
Authorization: Bearer {token}
Content-Type: application/json
{
  "content": "string",
  "recipientId": "uuid",
  "productId": "uuid" (optionnel)
}
```

### Récupérer les conversations

```http
GET /messages/conversations
Authorization: Bearer {token}
```

### Récupérer une conversation

```http
GET /messages/conversation/{userId}
Authorization: Bearer {token}
```

### Marquer un message comme lu

```http
POST /messages/{messageId}/read
Authorization: Bearer {token}
```

### Archiver une conversation

```http
POST /messages/conversation/{userId}/archive
Authorization: Bearer {token}
```

### Désarchiver une conversation

```http
POST /messages/conversation/{userId}/unarchive
Authorization: Bearer {token}
```

## 📦 Produits

### Créer un produit

```http
POST /products
Authorization: Bearer {token}
Content-Type: application/json
{
  "title": "string",
  "description": "string",
  "price": number,
  "condition": "new" | "like_new" | "good" | "fair" | "poor",
  "categoryId": "uuid"
}
```

### Récupérer la liste des produits

```http
GET /products
Authorization: Bearer {token}
```

### Rechercher des produits

```http
GET /products?search=keyword
Authorization: Bearer {token}
```

### Récupérer un produit spécifique

```http
GET /products/{id}
Authorization: Bearer {token}
```

### Mettre à jour un produit

```http
PUT /products/{id}
Authorization: Bearer {token}
Content-Type: application/json
{
  "title": "string",
  "description": "string",
  "price": number,
  "condition": "new" | "like_new" | "good" | "fair" | "poor"
}
```

### Supprimer un produit

```http
DELETE /products/{id}
Authorization: Bearer {token}
```

## 📁 Catégories

### Liste des catégories

```http
GET /categories
Authorization: Bearer {token}
```

### Détails d'une catégorie

```http
GET /categories/{id}
Authorization: Bearer {token}
```

## 🔍 Filtres Sauvegardés

### Créer un filtre

```http
POST /saved-filters
Authorization: Bearer {token}
Content-Type: application/json
{
  "name": "string",
  "filters": {
    "categoryId": "uuid",
    "minPrice": number,
    "maxPrice": number
  }
}
```

### Récupérer ses filtres

```http
GET /saved-filters
Authorization: Bearer {token}
```

## 📊 Métriques

### Récupérer les métriques

```http
GET /metrics
Authorization: Bearer {token}
```

---

## Notes sur les réponses

- Tous les endpoints nécessitent un token JWT valide dans le header `Authorization`
- Les réponses sont au format JSON
- Les codes de statut HTTP standards sont utilisés :
  - 200 : Succès
  - 201 : Création réussie
  - 400 : Requête invalide
  - 401 : Non authentifié
  - 403 : Non autorisé
  - 404 : Ressource non trouvée
  - 500 : Erreur serveur
