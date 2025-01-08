import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReadColumnToMessages1736298925507 implements MigrationInterface {
    name = 'AddReadColumnToMessages1736298925507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "status" TO "read"`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporter_id" uuid NOT NULL, "product_id" uuid NOT NULL, "reason" character varying NOT NULL DEFAULT 'other', "description" text NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "moderationNote" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_39430dab0f2c9bf6b7cdf957a9" CHECK ("status" IN ('pending', 'reviewed', 'resolved', 'rejected')), CONSTRAINT "CHK_528565e2a17f7406f019604038" CHECK ("reason" IN ('inappropriate', 'fake', 'offensive', 'spam', 'other')), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sync_queue_operation_enum" AS ENUM('create', 'update', 'delete')`);
        await queryRunner.query(`CREATE TYPE "public"."sync_queue_status_enum" AS ENUM('pending', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "sync_queue" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying NOT NULL, "operation" "public"."sync_queue_operation_enum" NOT NULL, "data" jsonb NOT NULL, "status" "public"."sync_queue_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "lastError" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "syncedAt" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_ff45aae31ec336e210e9bb34e6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('message', 'product', 'system', 'favorite', 'report')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('unread', 'read', 'archived')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "message" character varying NOT NULL, "metadata" jsonb, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'unread', "user_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."device_tokens_platform_enum" AS ENUM('ios', 'android', 'web')`);
        await queryRunner.query(`CREATE TABLE "device_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "platform" "public"."device_tokens_platform_enum" NOT NULL DEFAULT 'ios', "deviceModel" character varying, "osVersion" character varying, "isActive" boolean NOT NULL DEFAULT true, "user_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastUsedAt" TIMESTAMP, CONSTRAINT "PK_84700be257607cfb1f9dc2e52c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "search_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "searchTerm" character varying NOT NULL, "filters" jsonb NOT NULL, "resultsCount" integer NOT NULL, "category" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb93c8f85dbdca85943ca494812" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."message_history_action_enum" AS ENUM('sent', 'read', 'deleted')`);
        await queryRunner.query(`CREATE TABLE "message_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "senderId" uuid NOT NULL, "receiverId" uuid NOT NULL, "messageId" character varying NOT NULL, "action" "public"."message_history_action_enum" NOT NULL, "content" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b3bd70fbc92e976540d6ceb67c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "action_type" character varying NOT NULL, "entity_id" character varying NOT NULL, "entity_type" character varying NOT NULL, "details" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_46f5a0fcfbcbabab7467cad298" CHECK ("action_type" IN ('create', 'update', 'delete', 'view', 'favorite', 'unfavorite', 'report', 'login', 'logout')), CONSTRAINT "PK_9384942edf4804b38ca0ee51416" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "read"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "read" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_0ba6a2ea28e6e64af44e4e1cc6d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sync_queue" ADD CONSTRAINT "FK_1605c43d06cf9c9c3059eaa4e62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_tokens" ADD CONSTRAINT "FK_17e1f528b993c6d55def4cf5bea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "search_history" ADD CONSTRAINT "FK_11fdc5f9da08d75bbab5296bcd5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_history" ADD CONSTRAINT "FK_9b260b33055255603ff81dd3348" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_history" ADD CONSTRAINT "FK_b0d774db7ea830a514e30a7d3c1" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "history" ADD CONSTRAINT "FK_ea92daa642af67e2a924a5547d5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "history" DROP CONSTRAINT "FK_ea92daa642af67e2a924a5547d5"`);
        await queryRunner.query(`ALTER TABLE "message_history" DROP CONSTRAINT "FK_b0d774db7ea830a514e30a7d3c1"`);
        await queryRunner.query(`ALTER TABLE "message_history" DROP CONSTRAINT "FK_9b260b33055255603ff81dd3348"`);
        await queryRunner.query(`ALTER TABLE "search_history" DROP CONSTRAINT "FK_11fdc5f9da08d75bbab5296bcd5"`);
        await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_17e1f528b993c6d55def4cf5bea"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "sync_queue" DROP CONSTRAINT "FK_1605c43d06cf9c9c3059eaa4e62"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_0ba6a2ea28e6e64af44e4e1cc6d"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "read"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "read" text NOT NULL DEFAULT 'SENT'`);
        await queryRunner.query(`DROP TABLE "history"`);
        await queryRunner.query(`DROP TABLE "message_history"`);
        await queryRunner.query(`DROP TYPE "public"."message_history_action_enum"`);
        await queryRunner.query(`DROP TABLE "search_history"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "sync_queue"`);
        await queryRunner.query(`DROP TYPE "public"."sync_queue_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sync_queue_operation_enum"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "read" TO "status"`);
    }

}
