# Endpoints à Corriger

## ⭐ Favoris

### Ajouter aux favoris

```http
POST /favorites/{productId}
Status: ❌ (500 Internal Server Error)

Erreur rencontrée :
- Erreur de format UUID dans la requête SQL
- Le service tente d'utiliser l'objet user complet au lieu de son ID
- Message d'erreur : "invalid input syntax for type uuid"
```

## 🔔 Notifications

### Récupération des notifications

```http
GET /notifications
Status: ❌ (404 Not Found)

Erreur rencontrée :
- Endpoint non trouvé
- Le contrôleur des notifications n'est peut-être pas enregistré dans le module
```

## 🔄 Synchronisation Hors Ligne

### Synchronisation des données

```http
POST /offline/sync
Status: ❌ (400 Bad Request)

Erreur rencontrée :
- Validation DTO échouée
- Champs requis manquants :
  - entityType (string)
  - entityId (string)
  - operation (doit être 'create', 'update' ou 'delete')

Format attendu :
```json
{
  "entityType": "string",
  "entityId": "string",
  "operation": "create" | "update" | "delete"
}
```

## 📝 Notes pour la correction

1. **Priorité Haute**
   - Correction des favoris (impact direct sur l'expérience utilisateur)

2. **Priorité Moyenne**
   - Implémentation des notifications
   - Correction de la synchronisation hors ligne

3. **Points d'attention**
   - Vérifier la gestion des UUID dans TypeORM
   - Valider les DTOs pour tous les endpoints
   - S'assurer que tous les modules sont correctement importés
   - Vérifier les logs serveur pour plus de détails sur les erreurs 500

4. **Tests à effectuer après correction**
   - Tester avec différents types de données
   - Vérifier la gestion des erreurs
   - Valider les réponses avec le schéma attendu
