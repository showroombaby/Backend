import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSyncQueueDataColumn1704688077000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sync_queue
      ALTER COLUMN data TYPE json USING data::json;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sync_queue
      ALTER COLUMN data TYPE jsonb USING data::jsonb;
    `);
  }
}
