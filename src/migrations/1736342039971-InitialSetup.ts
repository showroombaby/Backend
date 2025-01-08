import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup1736342039971 implements MigrationInterface {
  name = 'InitialSetup1736342039971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Création des tables de base
    await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "first_name" character varying,
                "last_name" character varying,
                "avatar" character varying,
                "avatarUrl" character varying,
                "name" character varying,
                "username" character varying,
                "rating" numeric(3,2) NOT NULL DEFAULT '0',
                "role" character varying NOT NULL DEFAULT 'user',
                "is_email_verified" boolean NOT NULL DEFAULT false,
                "address" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "status" character varying NOT NULL DEFAULT 'draft',
                "condition" character varying NOT NULL,
                "latitude" numeric(10,6),
                "longitude" numeric(10,6),
                "address" character varying,
                "city" character varying,
                "zipCode" character varying,
                "seller_id" uuid NOT NULL,
                "category_id" uuid NOT NULL,
                "viewCount" integer NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "product_images" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "url" character varying NOT NULL,
                "filename" character varying NOT NULL,
                "product_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "product_favorites" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_a2f0e6548c4c382c2769ad7658d" UNIQUE ("user_id", "product_id"),
                CONSTRAINT "PK_731c5d4877a8511f3bd5d7e6c10" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "sender_id" uuid NOT NULL,
                "recipient_id" uuid NOT NULL,
                "product_id" uuid,
                "read" boolean NOT NULL DEFAULT false,
                "status" text NOT NULL DEFAULT 'SENT',
                "archived_by_sender" boolean NOT NULL DEFAULT false,
                "archived_by_recipient" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "sync_queue" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "entityType" character varying NOT NULL,
                "entityId" character varying NOT NULL,
                "operation" character varying NOT NULL,
                "data" json NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "attempts" integer NOT NULL DEFAULT '0',
                "lastError" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "synced_at" TIMESTAMP,
                CONSTRAINT "PK_sync_queue" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "device_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token" character varying NOT NULL,
                "platform" character varying NOT NULL DEFAULT 'ios',
                "deviceModel" character varying,
                "osVersion" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "user_id" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "lastUsedAt" TIMESTAMP,
                CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "action_type" character varying NOT NULL,
                "entity_id" character varying NOT NULL,
                "entity_type" character varying NOT NULL,
                "details" jsonb,
                "ip_address" character varying,
                "user_agent" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_history" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_action_type" CHECK ("action_type" IN ('create', 'update', 'delete', 'view', 'favorite', 'unfavorite', 'report', 'login', 'logout'))
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying NOT NULL,
                "title" character varying NOT NULL,
                "message" character varying NOT NULL,
                "metadata" jsonb,
                "status" character varying NOT NULL DEFAULT 'unread',
                "user_id" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_notification_type" CHECK ("type" IN ('message', 'product', 'system', 'favorite', 'report')),
                CONSTRAINT "CHK_notification_status" CHECK ("status" IN ('unread', 'read', 'archived'))
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "product_views" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "viewerId" uuid,
                "ip" character varying NOT NULL,
                "userAgent" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_views" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "reporter_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "reason" character varying NOT NULL DEFAULT 'other',
                "description" text NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "moderationNote" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_report_reason" CHECK ("reason" IN ('inappropriate', 'fake', 'offensive', 'spam', 'other')),
                CONSTRAINT "CHK_report_status" CHECK ("status" IN ('pending', 'reviewed', 'resolved', 'rejected'))
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "saved_filters" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "filters" json NOT NULL DEFAULT '{}',
                "user_id" uuid NOT NULL,
                CONSTRAINT "PK_saved_filters" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "search_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "searchTerm" character varying NOT NULL,
                "filters" jsonb NOT NULL,
                "resultsCount" integer NOT NULL,
                "category" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_search_history" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "message_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "senderId" uuid NOT NULL,
                "receiverId" uuid NOT NULL,
                "messageId" uuid NOT NULL,
                "action" character varying NOT NULL,
                "content" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_message_history" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_message_action" CHECK ("action" IN ('sent', 'read', 'deleted'))
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_seller_id"
            FOREIGN KEY ("seller_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_category_id"
            FOREIGN KEY ("category_id")
            REFERENCES "categories"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_images"
            ADD CONSTRAINT "FK_product_images_product_id"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_favorites"
            ADD CONSTRAINT "FK_product_favorites_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_favorites"
            ADD CONSTRAINT "FK_product_favorites_product_id"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_sender_id"
            FOREIGN KEY ("sender_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_recipient_id"
            FOREIGN KEY ("recipient_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_product_id"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "sync_queue"
            ADD CONSTRAINT "FK_sync_queue_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "device_tokens"
            ADD CONSTRAINT "FK_device_tokens_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "history"
            ADD CONSTRAINT "FK_history_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notifications_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_views"
            ADD CONSTRAINT "FK_product_views_product_id"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_views"
            ADD CONSTRAINT "FK_product_views_viewer_id"
            FOREIGN KEY ("viewerId")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_reports_reporter_id"
            FOREIGN KEY ("reporter_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_reports_product_id"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "saved_filters"
            ADD CONSTRAINT "FK_saved_filters_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "search_history"
            ADD CONSTRAINT "FK_search_history_user_id"
            FOREIGN KEY ("userId")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "message_history"
            ADD CONSTRAINT "FK_message_history_sender_id"
            FOREIGN KEY ("senderId")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "message_history"
            ADD CONSTRAINT "FK_message_history_receiver_id"
            FOREIGN KEY ("receiverId")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "message_history"
            ADD CONSTRAINT "FK_message_history_message_id"
            FOREIGN KEY ("messageId")
            REFERENCES "messages"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_history" DROP CONSTRAINT "FK_search_history_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_filters" DROP CONSTRAINT "FK_saved_filters_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" DROP CONSTRAINT "FK_product_views_viewer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" DROP CONSTRAINT "FK_product_views_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history" DROP CONSTRAINT "FK_history_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_device_tokens_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sync_queue" DROP CONSTRAINT "FK_sync_queue_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_recipient_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_sender_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_product_favorites_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_product_favorites_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_seller_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_history" DROP CONSTRAINT "FK_message_history_message_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_history" DROP CONSTRAINT "FK_message_history_receiver_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_history" DROP CONSTRAINT "FK_message_history_sender_id"`,
    );

    // Suppression des tables
    await queryRunner.query(`DROP TABLE "search_history"`);
    await queryRunner.query(`DROP TABLE "saved_filters"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TABLE "product_views"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "history"`);
    await queryRunner.query(`DROP TABLE "device_tokens"`);
    await queryRunner.query(`DROP TABLE "sync_queue"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "product_favorites"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "message_history"`);
  }
}
