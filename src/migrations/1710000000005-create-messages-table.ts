import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesTable1710000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sender_id" UUID NOT NULL,
        "receiver_id" UUID NOT NULL,
        "product_id" UUID,
        "content" TEXT NOT NULL,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
      )
    `);

    // Index pour améliorer les performances des requêtes de conversation
    await queryRunner.query(`
      CREATE INDEX "idx_messages_sender_receiver" ON "messages" ("sender_id", "receiver_id");
      CREATE INDEX "idx_messages_created_at" ON "messages" ("created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_messages_created_at";
      DROP INDEX IF EXISTS "idx_messages_sender_receiver";
      DROP TABLE IF EXISTS "messages";
    `);
  }
} 