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

## ⭐ Favoris

### Ajouter aux favoris

```http
POST /favorites/{productId}
Authorization: Bearer {token}

Réponses :
- 201: Produit ajouté aux favoris
- 404: Produit non trouvé
- 409: Produit déjà dans les favoris
```

### Retirer des favoris

```http
DELETE /favorites/{productId}
Authorization: Bearer {token}

Réponses :
- 204: Produit retiré des favoris
- 404: Favori non trouvé
```

### Récupérer tous les favoris

```http
GET /favorites
Authorization: Bearer {token}

Réponse :
[
  {
    "id": "uuid",
    "userId": "uuid",
    "productId": "uuid",
    "createdAt": "date",
    "product": {
      "id": "uuid",
      "title": "string",
      "price": number,
      "images": [
        {
          "url": "string"
        }
      ]
    }
  }
]
```

### Récupérer un favori spécifique

```http
GET /favorites/{id}
Authorization: Bearer {token}

Réponses :
- 200: Favori trouvé
- 404: Favori non trouvé
```

## 🔄 Notifications

### Récupérer toutes les notifications

```http
GET /notifications
Authorization: Bearer {token}

Réponse :
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "string",
      "content": "string",
      "status": "UNREAD" | "READ" | "ARCHIVED",
      "createdAt": "date"
    }
  ],
  "meta": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

### Récupérer les notifications non lues

```http
GET /notifications/unread
Authorization: Bearer {token}

Réponse :
[
  {
    "id": "uuid",
    "userId": "uuid",
    "type": "string",
    "content": "string",
    "status": "UNREAD",
    "createdAt": "date"
  }
]
```

### Marquer une notification comme lue

```http
POST /notifications/{id}/read
Authorization: Bearer {token}

Réponses :
- 200: Notification marquée comme lue
- 404: Notification non trouvée
```

### Marquer toutes les notifications comme lues

```http
POST /notifications/read/all
Authorization: Bearer {token}

Réponse :
- 200: Toutes les notifications ont été marquées comme lues
```

### Archiver une notification

```http
POST /notifications/{id}/archive
Authorization: Bearer {token}

Réponses :
- 200: Notification archivée
- 404: Notification non trouvée
```

### Supprimer une notification

```http
DELETE /notifications/{id}
Authorization: Bearer {token}

Réponses :
- 200: Notification supprimée
- 404: Notification non trouvée
```

### Compter les notifications non lues

```http
GET /notifications/count/unread
Authorization: Bearer {token}

Réponse :
{
  "count": number
}
```

## 🔄 Synchronisation Hors Ligne

### Ajouter une opération à synchroniser

```http
POST /offline/sync
Authorization: Bearer {token}
Content-Type: application/json
{
  "entityType": "string",
  "entityId": "string",
  "operation": "create" | "update" | "delete",
  "data": {}
}
```

### Traiter la file de synchronisation

```http
POST /offline/sync/process
Authorization: Bearer {token}
```

### Récupérer les opérations échouées

```http
GET /offline/sync/failed
Authorization: Bearer {token}
```

### Réessayer les opérations échouées

```http
POST /offline/sync/retry
Authorization: Bearer {token}
```

### Nettoyer les opérations terminées

```http
POST /offline/sync/clear
Authorization: Bearer {token}
Query Parameters:
  - olderThan: Date (optionnel)
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
