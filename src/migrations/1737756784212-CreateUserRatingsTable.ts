import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserRatingsTable1737756784212 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user_ratings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "rating" decimal(2,1) NOT NULL,
                "comment" text,
                "rater_id" uuid NOT NULL,
                "rated_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "pk_user_ratings" PRIMARY KEY ("id"),
                CONSTRAINT "fk_user_ratings_rater" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_user_ratings_rated" FOREIGN KEY ("rated_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "uq_user_ratings_rater_rated" UNIQUE ("rater_id", "rated_id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_ratings"`);
  }
}
