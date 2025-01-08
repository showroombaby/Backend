# Endpoints à Corriger

## 🔔 Notifications

### Récupération des notifications

```http
GET /notifications
Status: ✅ (200 OK)

Fonctionnalités disponibles et testées :
- ✅ Récupération de toutes les notifications
- ✅ Récupération des notifications non lues
- ✅ Marquage des notifications comme lues
- ✅ Archivage des notifications
- ✅ Suppression des notifications
- ✅ Comptage des notifications non lues
```

## ⭐ Favoris

### État actuel

```http
POST /favorites/{productId}
Status: ✅ (Tests réussis)

Fonctionnalités testées :
- ✅ Création de catégories et produits préalable
- ✅ Ajout d'un produit aux favoris
- ✅ Gestion des doublons (409 Conflict)
- ✅ Gestion des produits inexistants (404 Not Found)
- ✅ Suppression des favoris
- ✅ Récupération des favoris avec détails du produit
```

## 🔄 Synchronisation Hors Ligne

### État actuel

```http
POST /offline/sync
Status: ❌ (Problèmes critiques détectés)

Problèmes identifiés dans les logs :
1. Traitement des opérations
   - ❌ Les opérations sont marquées "completed" sans exécution réelle
   - ❌ Pas de vérification de l'existence des entités avant traitement
   - ❌ Pas de rollback en cas d'échec

2. Validation des données
   - ❌ Accepte des IDs invalides sans validation
   - ❌ Pas de vérification du format des données
   - ❌ Pas de validation du type d'opération

3. Gestion des erreurs
   - ❌ Champ lastError non utilisé
   - ❌ Compteur attempts non incrémenté
   - ❌ Statut "failed" jamais utilisé
   - ❌ Pas de log des erreurs détaillé

Corrections nécessaires :
1. Implémentation du processus de synchronisation
   ```typescript
   // Exemple de correction nécessaire dans sync.service.ts
   async processSyncQueue(userId: string) {
     const pendingOps = await this.findPendingOperations(userId);
     for (const op of pendingOps) {
       try {
         // Valider l'opération
         await this.validateOperation(op);
         
         // Exécuter l'opération
         await this.executeOperation(op);
         
         // Mettre à jour le statut
         await this.markAsCompleted(op.id);
       } catch (error) {
         // Gérer l'erreur
         await this.handleOperationError(op, error);
       }
     }
   }
   ```

2. Validation et gestion des erreurs
   ```typescript
   // Exemple de validation à ajouter
   async validateOperation(op: SyncOperation) {
     // Vérifier le type d'entité
     if (!this.isValidEntityType(op.entityType)) {
       throw new BadRequestException(`Invalid entity type: ${op.entityType}`);
     }
     
     // Vérifier l'existence de l'entité
     await this.checkEntityExists(op);
     
     // Valider les données
     await this.validateOperationData(op);
   }
   ```

3. Journalisation et monitoring
   ```typescript
   // Exemple de gestion d'erreur à implémenter
   async handleOperationError(op: SyncOperation, error: Error) {
     await this.syncQueueRepository.update(op.id, {
       status: 'failed',
       attempts: op.attempts + 1,
       lastError: error.message
     });
     
     this.logger.error(
       `Sync operation failed: ${op.id}`,
       { error, operation: op }
     );
   }
   ```
```

## 🔄 Notes pour la correction

1. **Priorité Haute**
   - ✅ Implémentation des notifications
   - ✅ Implémentation des favoris
   - ❌ Synchronisation hors ligne (problèmes critiques)

2. **Points d'attention**
   - ✅ S'assurer que tous les modules sont correctement importés
   - ✅ Vérifier les logs serveur pour plus de détails sur les erreurs
   - ✅ Valider les DTOs pour tous les endpoints
   - ✅ Vérifier la gestion des erreurs pour les favoris
   - ❌ Corriger la synchronisation hors ligne

3. **Tests à effectuer**
   - ✅ Tester les notifications avec différents types de données
   - ✅ Vérifier la gestion des erreurs pour les notifications
   - ✅ Valider les réponses avec le schéma attendu
   - ✅ Tester les favoris avec différents produits
   - ❌ Vérifier la synchronisation des données hors ligne

## 🐛 Problèmes spécifiques à vérifier

### Favoris
1. **Gestion des produits**
   - ✅ Vérifier que les produits existent avant l'ajout aux favoris
   - ✅ Tester la suppression d'un produit et son impact sur les favoris
   - ✅ Vérifier la mise à jour des produits dans les favoris

2. **Permissions**
   - ✅ Vérifier que seul le propriétaire peut gérer ses favoris
   - ✅ Tester les tentatives d'accès non autorisées
   - ✅ Vérifier la gestion des tokens expirés

3. **Performance**
   - ✅ Tester la pagination des favoris
   - ✅ Vérifier les requêtes N+1 potentielles
   - ✅ Tester avec un grand nombre de favoris

### Synchronisation
1. **Gestion des données**
   - ❌ Validation des données avant synchronisation
   - ❌ Vérification de l'existence des entités
   - ❌ Gestion des conflits de données

2. **Performances**
   - ❌ Traitement par lots des opérations
   - ❌ Gestion de la mémoire pour les grandes files
   - ❌ Timeouts de synchronisation

3. **Reprise sur erreur**
   - ❌ Mécanisme de retry avec backoff
   - ❌ Gestion des erreurs transientes
   - ❌ Journalisation détaillée des erreurs
