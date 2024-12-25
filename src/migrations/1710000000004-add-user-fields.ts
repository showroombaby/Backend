import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFields1710000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "name" VARCHAR,
      ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,2) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "name",
      DROP COLUMN IF EXISTS "rating"
    `);
  }
} 