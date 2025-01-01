import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1735741217784 implements MigrationInterface {
    name = 'InitialSchema1735741217784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "viewerId" character varying, "ip" character varying NOT NULL, "userAgent" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_30b2bf7f11bc3f9604ffc95dc89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "saved_filters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "filters" json NOT NULL DEFAULT '{}', "user_id" uuid NOT NULL, CONSTRAINT "PK_d30e30ca883a3bd014c9ed983ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying, "last_name" character varying, "avatar" character varying, "avatarUrl" character varying, "name" character varying, "username" character varying, "rating" numeric(3,2) NOT NULL DEFAULT '0', "role" character varying NOT NULL DEFAULT 'user', "is_email_verified" boolean NOT NULL DEFAULT false, "address" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "condition" character varying NOT NULL, "latitude" numeric(10,6), "longitude" numeric(10,6), "address" character varying, "city" character varying, "zipCode" character varying, "seller_id" uuid NOT NULL, "category_id" uuid NOT NULL, "viewCount" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "filename" character varying NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a2f0e6548c4c382c2769ad7658d" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_731c5d4877a8511f3bd5d7e6c10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "sender_id" uuid NOT NULL, "recipient_id" uuid NOT NULL, "product_id" uuid, "status" text NOT NULL DEFAULT 'SENT', "archived_by_sender" boolean NOT NULL DEFAULT false, "archived_by_recipient" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_views" ADD CONSTRAINT "FK_ca78d95dae75fe32fa233c134fa" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_views" ADD CONSTRAINT "FK_28453e231373168ec22f863956b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_filters" ADD CONSTRAINT "FK_1072cc58f972749123491fcd776" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_favorites" ADD CONSTRAINT "FK_a2d24803b21b98abca48007c02a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_favorites" ADD CONSTRAINT "FK_a0b0826f5c155ce481fb0d2017b" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_566c3d68184e83d4307b86f85ab" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_566c3d68184e83d4307b86f85ab"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_a0b0826f5c155ce481fb0d2017b"`);
        await queryRunner.query(`ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_a2d24803b21b98abca48007c02a"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe"`);
        await queryRunner.query(`ALTER TABLE "saved_filters" DROP CONSTRAINT "FK_1072cc58f972749123491fcd776"`);
        await queryRunner.query(`ALTER TABLE "product_views" DROP CONSTRAINT "FK_28453e231373168ec22f863956b"`);
        await queryRunner.query(`ALTER TABLE "product_views" DROP CONSTRAINT "FK_ca78d95dae75fe32fa233c134fa"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "product_favorites"`);
        await queryRunner.query(`DROP TABLE "product_images"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "saved_filters"`);
        await queryRunner.query(`DROP TABLE "product_views"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
