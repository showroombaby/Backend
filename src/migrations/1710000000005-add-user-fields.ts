import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFields1710000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "username" VARCHAR,
      ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "username",
      DROP COLUMN IF EXISTS "avatar_url";
    `);
  }
} 