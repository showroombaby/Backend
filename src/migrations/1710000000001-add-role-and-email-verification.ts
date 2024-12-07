import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleAndEmailVerification1710000000001
  implements MigrationInterface
{
  name = 'AddRoleAndEmailVerification1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer le type enum pour les rôles
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM ('admin', 'user', 'seller')
    `);

    // Ajouter la colonne role
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'
    `);

    // Ajouter la colonne isEmailVerified
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "is_email_verified" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "is_email_verified"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "role"
    `);

    // Supprimer le type enum
    await queryRunner.query(`
      DROP TYPE "public"."users_role_enum"
    `);
  }
}
