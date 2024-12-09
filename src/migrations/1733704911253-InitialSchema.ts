import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1733704911253 implements MigrationInterface {
  name = 'InitialSchema1733704911253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'enum ProductStatus
    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM ('draft', 'published', 'sold', 'archived')
    `);

    // Créer l'enum ProductCondition
    await queryRunner.query(`
      CREATE TYPE "product_condition_enum" AS ENUM ('new', 'like_new', 'good', 'fair', 'poor')
    `);

    // Créer l'enum Role
    await queryRunner.query(`
      CREATE TYPE "role_enum" AS ENUM ('user', 'admin')
    `);

    // Créer la table users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "first_name" character varying,
        "last_name" character varying,
        "avatar" character varying,
        "role" "role_enum" NOT NULL DEFAULT 'user',
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "address" jsonb,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Créer la table categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
      )
    `);

    // Créer la table products
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "status" "product_status_enum" NOT NULL DEFAULT 'draft',
        "condition" "product_condition_enum" NOT NULL,
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "address" character varying,
        "city" character varying,
        "zip_code" character varying,
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "seller_id" uuid,
        "category_id" uuid,
        CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
      )
    `);

    // Créer la table product_images
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "product_id" uuid,
        CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id")
      )
    `);

    // Créer la table product_views
    await queryRunner.query(`
      CREATE TABLE "product_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_agent" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "product_id" uuid,
        "user_id" uuid,
        CONSTRAINT "PK_f75d7e0c0d3e6f0e6f3c3c3c3c3" PRIMARY KEY ("id")
      )
    `);

    // Ajouter les contraintes de clé étrangère
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_seller"
      FOREIGN KEY ("seller_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "product_images"
      ADD CONSTRAINT "FK_product_images_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "product_views"
      ADD CONSTRAINT "FK_product_views_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "product_views"
      ADD CONSTRAINT "FK_product_views_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les contraintes de clé étrangère
    await queryRunner.query(
      `ALTER TABLE "product_views" DROP CONSTRAINT "FK_product_views_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" DROP CONSTRAINT "FK_product_views_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_seller"`,
    );

    // Supprimer les tables
    await queryRunner.query(`DROP TABLE "product_views"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Supprimer les enums
    await queryRunner.query(`DROP TYPE "role_enum"`);
    await queryRunner.query(`DROP TYPE "product_condition_enum"`);
    await queryRunner.query(`DROP TYPE "product_status_enum"`);
  }
}
