import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1737639494104 implements MigrationInterface {
    name = 'InitialSchema1737639494104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "filename" character varying NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "condition" character varying NOT NULL, "latitude" numeric(10,6), "longitude" numeric(10,6), "address" character varying, "city" character varying, "zipCode" character varying, "seller_id" uuid NOT NULL, "category_id" uuid NOT NULL, "viewCount" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "viewerId" character varying, "ip" character varying NOT NULL, "userAgent" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_30b2bf7f11bc3f9604ffc95dc89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "saved_filters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "filters" json NOT NULL DEFAULT '{}', "user_id" uuid NOT NULL, CONSTRAINT "PK_d30e30ca883a3bd014c9ed983ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying, "last_name" character varying, "avatar" character varying, "avatarUrl" character varying, "name" character varying, "username" character varying, "rating" numeric(3,2) NOT NULL DEFAULT '0', "role" character varying NOT NULL DEFAULT 'user', "is_email_verified" boolean NOT NULL DEFAULT false, "address" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporter_id" uuid NOT NULL, "product_id" uuid NOT NULL, "reason" character varying NOT NULL DEFAULT 'other', "description" text NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "moderationNote" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_39430dab0f2c9bf6b7cdf957a9" CHECK ("status" IN ('pending', 'reviewed', 'resolved', 'rejected')), CONSTRAINT "CHK_528565e2a17f7406f019604038" CHECK ("reason" IN ('inappropriate', 'fake', 'offensive', 'spam', 'other')), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sync_queue_operation_enum" AS ENUM('create', 'update', 'delete')`);
        await queryRunner.query(`CREATE TYPE "public"."sync_queue_status_enum" AS ENUM('pending', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "sync_queue" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying NOT NULL, "operation" "public"."sync_queue_operation_enum" NOT NULL, "data" json NOT NULL, "status" "public"."sync_queue_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "lastError" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "synced_at" TIMESTAMP, CONSTRAINT "PK_ff45aae31ec336e210e9bb34e6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a2f0e6548c4c382c2769ad7658d" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_731c5d4877a8511f3bd5d7e6c10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('message', 'product', 'system', 'favorite', 'report')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('unread', 'read', 'archived')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "message" character varying NOT NULL, "metadata" jsonb, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'unread', "user_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."device_tokens_platform_enum" AS ENUM('ios', 'android', 'web')`);
        await queryRunner.query(`CREATE TABLE "device_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "platform" "public"."device_tokens_platform_enum" NOT NULL DEFAULT 'ios', "deviceModel" character varying, "osVersion" character varying, "isActive" boolean NOT NULL DEFAULT true, "user_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastUsedAt" TIMESTAMP, CONSTRAINT "PK_84700be257607cfb1f9dc2e52c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "sender_id" uuid NOT NULL, "recipient_id" uuid NOT NULL, "product_id" uuid, "read" boolean NOT NULL DEFAULT false, "archived_by_sender" boolean NOT NULL DEFAULT false, "archived_by_recipient" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "search_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "searchTerm" character varying NOT NULL, "filters" jsonb NOT NULL, "resultsCount" integer NOT NULL, "category" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb93c8f85dbdca85943ca494812" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."message_history_action_enum" AS ENUM('sent', 'read', 'deleted')`);
        await queryRunner.query(`CREATE TABLE "message_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "senderId" uuid NOT NULL, "receiverId" uuid NOT NULL, "messageId" character varying NOT NULL, "action" "public"."message_history_action_enum" NOT NULL, "content" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b3bd70fbc92e976540d6ceb67c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "action_type" character varying NOT NULL, "entity_id" character varying NOT NULL, "entity_type" character varying NOT NULL, "details" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_46f5a0fcfbcbabab7467cad298" CHECK ("action_type" IN ('create', 'update', 'delete', 'view', 'favorite', 'unfavorite', 'report', 'login', 'logout')), CONSTRAINT "PK_9384942edf4804b38ca0ee51416" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_views" ADD CONSTRAINT "FK_ca78d95dae75fe32fa233c134fa" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_views" ADD CONSTRAINT "FK_28453e231373168ec22f863956b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_filters" ADD CONSTRAINT "FK_1072cc58f972749123491fcd776" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_0ba6a2ea28e6e64af44e4e1cc6d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sync_queue" ADD CONSTRAINT "FK_1605c43d06cf9c9c3059eaa4e62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_favorites" ADD CONSTRAINT "FK_a2d24803b21b98abca48007c02a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_favorites" ADD CONSTRAINT "FK_a0b0826f5c155ce481fb0d2017b" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_tokens" ADD CONSTRAINT "FK_17e1f528b993c6d55def4cf5bea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_566c3d68184e83d4307b86f85ab" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
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
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_566c3d68184e83d4307b86f85ab"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_17e1f528b993c6d55def4cf5bea"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_a0b0826f5c155ce481fb0d2017b"`);
        await queryRunner.query(`ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_a2d24803b21b98abca48007c02a"`);
        await queryRunner.query(`ALTER TABLE "sync_queue" DROP CONSTRAINT "FK_1605c43d06cf9c9c3059eaa4e62"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_0ba6a2ea28e6e64af44e4e1cc6d"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`);
        await queryRunner.query(`ALTER TABLE "saved_filters" DROP CONSTRAINT "FK_1072cc58f972749123491fcd776"`);
        await queryRunner.query(`ALTER TABLE "product_views" DROP CONSTRAINT "FK_28453e231373168ec22f863956b"`);
        await queryRunner.query(`ALTER TABLE "product_views" DROP CONSTRAINT "FK_ca78d95dae75fe32fa233c134fa"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`);
        await queryRunner.query(`DROP TABLE "history"`);
        await queryRunner.query(`DROP TABLE "message_history"`);
        await queryRunner.query(`DROP TYPE "public"."message_history_action_enum"`);
        await queryRunner.query(`DROP TABLE "search_history"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "product_favorites"`);
        await queryRunner.query(`DROP TABLE "sync_queue"`);
        await queryRunner.query(`DROP TYPE "public"."sync_queue_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sync_queue_operation_enum"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "saved_filters"`);
        await queryRunner.query(`DROP TABLE "product_views"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_images"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
