import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1704295000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1704295000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index pour la recherche de produits
    await queryRunner.query(`
      CREATE INDEX "idx_products_user" ON "products" ("user_id");
      CREATE INDEX "idx_products_category" ON "products" ("category_id");
      CREATE INDEX "idx_products_status" ON "products" ("status");
      CREATE INDEX "idx_products_created" ON "products" ("created_at" DESC);
      CREATE INDEX "idx_products_search" ON "products" USING gin(to_tsvector('french', title || ' ' || description));
    `);

    // Index pour les messages et conversations
    await queryRunner.query(`
      CREATE INDEX "idx_messages_conversation" ON "messages" ("conversation_id");
      CREATE INDEX "idx_messages_user" ON "messages" ("user_id");
      CREATE INDEX "idx_messages_created" ON "messages" ("created_at" DESC);
      CREATE INDEX "idx_conversations_updated" ON "conversations" ("updated_at" DESC);
    `);

    // Index pour les notifications
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id");
      CREATE INDEX "idx_notifications_status" ON "notifications" ("status");
      CREATE INDEX "idx_notifications_created" ON "notifications" ("created_at" DESC);
    `);

    // Index pour les favoris
    await queryRunner.query(`
      CREATE INDEX "idx_favorites_user" ON "favorites" ("user_id");
      CREATE INDEX "idx_favorites_product" ON "favorites" ("product_id");
    `);

    // Index pour la file de synchronisation
    await queryRunner.query(`
      CREATE INDEX "idx_sync_queue_user" ON "sync_queue" ("user_id");
      CREATE INDEX "idx_sync_queue_status" ON "sync_queue" ("status");
      CREATE INDEX "idx_sync_queue_created" ON "sync_queue" ("created_at" DESC);
    `);

    // Index pour les tokens d'appareils
    await queryRunner.query(`
      CREATE INDEX "idx_device_tokens_user" ON "device_tokens" ("user_id");
      CREATE INDEX "idx_device_tokens_token" ON "device_tokens" ("token");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Suppression des index produits
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_products_user";
      DROP INDEX IF EXISTS "idx_products_category";
      DROP INDEX IF EXISTS "idx_products_status";
      DROP INDEX IF EXISTS "idx_products_created";
      DROP INDEX IF EXISTS "idx_products_search";
    `);

    // Suppression des index messages et conversations
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_messages_conversation";
      DROP INDEX IF EXISTS "idx_messages_user";
      DROP INDEX IF EXISTS "idx_messages_created";
      DROP INDEX IF EXISTS "idx_conversations_updated";
    `);

    // Suppression des index notifications
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_notifications_user";
      DROP INDEX IF EXISTS "idx_notifications_status";
      DROP INDEX IF EXISTS "idx_notifications_created";
    `);

    // Suppression des index favoris
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_favorites_user";
      DROP INDEX IF EXISTS "idx_favorites_product";
    `);

    // Suppression des index file de synchronisation
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sync_queue_user";
      DROP INDEX IF EXISTS "idx_sync_queue_status";
      DROP INDEX IF EXISTS "idx_sync_queue_created";
    `);

    // Suppression des index tokens d'appareils
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_device_tokens_user";
      DROP INDEX IF EXISTS "idx_device_tokens_token";
    `);
  }
}
