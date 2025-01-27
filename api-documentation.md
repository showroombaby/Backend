# Documentation API Backend Showroom Baby

## Table des matières

- [🔐 Authentification](#authentification)
- [👤 Utilisateurs](#utilisateurs)
- [📦 Produits](#produits)
- [⭐ Notes utilisateurs](#notes-utilisateurs)
- [💬 Messagerie](#messagerie)
- [⭐ Favoris](#favoris)
- [🔔 Notifications](#notifications)
- [📁 Catégories](#catégories)

## Authentification

### Inscription

```http
POST /auth/register
Content-Type: multipart/form-data
```

**Corps de la requête :**

```typescript
{
  email: string;          // Obligatoire, format email valide
  username: string;       // Obligatoire, min 3 caractères, lettres/chiffres/tirets
  password: string;       // Obligatoire, min 8 caractères
  firstName?: string;     // Optionnel
  lastName?: string;      // Optionnel
  address?: {            // Optionnel
    street: string;      // Obligatoire si address fournie
    zipCode: string;     // Obligatoire si address fournie, exactement 5 caractères
    city: string;        // Obligatoire si address fournie
    additionalInfo?: string; // Optionnel
  };
  avatar?: File;         // Optionnel, image
}
```

### Connexion

```http
POST /auth/login
Content-Type: application/json
```

**Corps de la requête :**

```typescript
{
  email: string;
  password: string;
  rememberMe?: boolean;  // Optionnel, défaut: false
}
```

**Réponse :**

```typescript
{
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    // ... autres informations utilisateur
  }
}
```

### Réinitialisation du mot de passe

Le processus de réinitialisation du mot de passe se fait en deux étapes :

1. **Demande de réinitialisation**

```http
POST /auth/request-reset-password
Content-Type: application/json

{
  email: string;  // Email du compte à réinitialiser
}
```

**Réponse (200 OK) :**

```typescript
{
  message: string; // "Un email de réinitialisation a été envoyé"
}
```

L'utilisateur reçoit un email contenant :

- Un lien avec un token de réinitialisation
- Instructions pour réinitialiser le mot de passe
- Durée de validité du lien (24 heures)

2. **Réinitialisation du mot de passe**

```http
POST /auth/reset-password
Content-Type: application/json

{
  token: string;      // Token reçu par email
  newPassword: string; // Nouveau mot de passe (min 8 caractères)
}
```

**Réponse (200 OK) :**

```typescript
{
  message: string; // "Mot de passe réinitialisé avec succès"
}
```

**Codes d'erreur possibles :**

- `400` : Token manquant ou mot de passe invalide
- `401` : Token invalide ou expiré
- `404` : Utilisateur non trouvé

**Règles de validation du nouveau mot de passe :**

- Minimum 8 caractères
- Au moins une lettre majuscule
- Au moins une lettre minuscule
- Au moins un chiffre
- Au moins un caractère spécial (@$!%\*?&)

## Utilisateurs

### Récupérer son profil

```http
GET /users/profile
Authorization: Bearer {token}
```

**Réponse :**

```typescript
{
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  avatarUrl: string | null;
  role: 'user' | 'seller' | 'admin';
  rating: number;        // Note sur 5 avec 2 décimales
  isEmailVerified: boolean;
  address: {
    street: string;
    zipCode: string;
    city: string;
    additionalInfo?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Mettre à jour son profil

```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Corps de la requête :**

```typescript
{
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  avatarUrl?: string;
  address?: {
    street: string;
    zipCode: string;
    city: string;
    additionalInfo?: string;
  };
}
```

### Changer son mot de passe

```http
POST /users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

### Supprimer son compte

```http
DELETE /users/account
Authorization: Bearer {token}
```

## Produits

### Créer un produit

```http
POST /products
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Corps de la requête :**

```typescript
{
  title: string;
  description: string;
  price: number;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SOLD' | 'ARCHIVED';
  images: File[];        // Maximum 8 images
  latitude?: number;     // Optionnel, pour la localisation
  longitude?: number;    // Optionnel, pour la localisation
  address?: string;      // Optionnel
  city?: string;        // Optionnel
  zipCode?: string;     // Optionnel
  phone?: string;       // Optionnel
}
```

### Rechercher des produits

```http
GET /products
```

**Paramètres de requête :**

```typescript
{
  query?: string;        // Terme de recherche
  categoryId?: string;   // Filtrer par catégorie
  minPrice?: number;     // Prix minimum
  maxPrice?: number;     // Prix maximum
  condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  latitude?: number;     // Pour la recherche géolocalisée
  longitude?: number;    // Pour la recherche géolocalisée
  radius?: number;       // Rayon en km (max 100)
  zipCode?: string;      // Code postal
  city?: string;        // Ville
  sortBy?: 'date' | 'price' | 'views';  // Tri
  page?: number;        // Pagination (défaut: 1)
  limit?: number;       // Éléments par page (défaut: 10, max: 100)
}
```

### Produits tendances

```http
GET /products/trending
```

**Paramètres de requête :**

```typescript
{
  limit?: number;  // Nombre de produits (défaut: 10)
}
```

### Détails d'un produit

```http
GET /products/:id
```

### Produits similaires

```http
GET /products/:id/similar
```

### Mettre à jour un produit

```http
PUT /products/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

Même format que la création.

### Supprimer un produit

```http
DELETE /products/:id
Authorization: Bearer {token}
```

## Notes utilisateurs

### Noter un utilisateur

```http
POST /user-ratings
Authorization: Bearer {token}
Content-Type: application/json

{
  userId: string;
  rating: number;     // Entre 0 et 5
  comment?: string;   // Optionnel
}
```

### Récupérer les notes d'un utilisateur

```http
GET /user-ratings/user/:userId
Authorization: Bearer {token}
```

## Messagerie

### Envoyer un message

```http
POST /messages
Authorization: Bearer {token}
Content-Type: application/json

{
  content: string;
  recipientId: string;
  productId?: string;  // Optionnel
}
```

### Récupérer les conversations

```http
GET /messages/conversations
Authorization: Bearer {token}
```

**Paramètres de requête :**

```typescript
{
  page?: number;
  limit?: number;
}
```

### Récupérer les conversations archivées

```http
GET /messages/conversations/archived
Authorization: Bearer {token}
```

### Récupérer les messages d'une conversation

```http
GET /messages/conversation/:userId
Authorization: Bearer {token}
```

### Marquer un message comme lu

```http
POST /messages/:id/read
Authorization: Bearer {token}
```

### Archiver/Désarchiver

```http
POST /messages/:id/archive
POST /messages/conversation/:userId/archive
POST /messages/conversation/:userId/unarchive
Authorization: Bearer {token}
```

### Rechercher dans les messages

```http
GET /messages/search
Authorization: Bearer {token}
```

**Paramètres de requête :**

```typescript
{
  query?: string;
  userId?: string;
  productId?: string;
}
```

## Favoris

### Ajouter aux favoris

```http
POST /favorites/:productId
Authorization: Bearer {token}
```

### Retirer des favoris

```http
DELETE /favorites/:productId
Authorization: Bearer {token}
```

### Récupérer tous les favoris

```http
GET /favorites
Authorization: Bearer {token}
```

### Récupérer un favori spécifique

```http
GET /favorites/:id
Authorization: Bearer {token}
```

## Notifications

### Récupérer les notifications

```http
GET /notifications
Authorization: Bearer {token}
```

**Paramètres de requête :**

```typescript
{
  page?: number;
  limit?: number;
}
```

### Notifications non lues

```http
GET /notifications/unread
Authorization: Bearer {token}
```

### Marquer comme lu

```http
POST /notifications/:id/read
POST /notifications/read/all
Authorization: Bearer {token}
```

### Archiver une notification

```http
POST /notifications/:id/archive
Authorization: Bearer {token}
```

### Supprimer une notification

```http
DELETE /notifications/:id
Authorization: Bearer {token}
```

### Compter les notifications non lues

```http
GET /notifications/count/unread
Authorization: Bearer {token}
```

## Catégories

### Liste des catégories

```http
GET /categories
```

### Créer une catégorie (admin)

```http
POST /categories
Authorization: Bearer {token}
Content-Type: application/json

{
  name: string;
  description?: string;
}
```

### Mettre à jour une catégorie (admin)

```http
PUT /categories/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  name?: string;
  description?: string;
}
```

### Supprimer une catégorie (admin)

```http
DELETE /categories/:id
Authorization: Bearer {token}
```

## Notes importantes

1. **Authentication :**

   - Tous les endpoints protégés nécessitent un header `Authorization: Bearer {token}`
   - Le token est obtenu lors de la connexion

2. **Gestion des erreurs :**

   - 400 : Données invalides
   - 401 : Non authentifié
   - 403 : Non autorisé
   - 404 : Ressource non trouvée
   - 409 : Conflit (ex: email déjà utilisé)
   - 422 : Erreur de validation
   - 500 : Erreur serveur

3. **Pagination :**

   - Les endpoints paginés retournent :

   ```typescript
   {
     data: T[];
     meta: {
       total: number;
       page: number;
       lastPage: number;
     }
   }
   ```

4. **Dates :**

   - Toutes les dates sont au format ISO 8601
   - Exemple : "2024-01-23T13:45:30Z"

5. **Images :**
   - Les URLs des images sont relatives
   - Préfixer avec l'URL de base de l'API
