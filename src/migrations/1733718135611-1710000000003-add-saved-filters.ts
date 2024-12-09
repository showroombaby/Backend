import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSavedFilters1733718135611 implements MigrationInterface {
  name = 'AddSavedFilters1733718135611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "saved_filters" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" varchar NOT NULL,
      "min_price" decimal(10,2),
      "max_price" decimal(10,2),
      "condition" varchar,
      "category_id" uuid,
      "user_id" uuid NOT NULL,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_saved_filters" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(`ALTER TABLE "saved_filters"
      ADD CONSTRAINT "FK_saved_filters_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE`);

    await queryRunner.query(`ALTER TABLE "saved_filters"
      ADD CONSTRAINT "FK_saved_filters_category" 
      FOREIGN KEY ("category_id") 
      REFERENCES "categories"("id") 
      ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_filters" DROP CONSTRAINT "FK_saved_filters_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_filters" DROP CONSTRAINT "FK_saved_filters_user"`,
    );
    await queryRunner.query(`DROP TABLE "saved_filters"`);
  }
}
