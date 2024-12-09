import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddProductViews1710000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne viewCount à la table products
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'view_count',
        type: 'integer',
        default: 0,
      }),
    );

    // Créer la table product_views
    await queryRunner.createTable(
      new Table({
        name: 'product_views',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'viewer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ip',
            type: 'varchar',
          },
          {
            name: 'user_agent',
            type: 'varchar',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Ajouter des index pour améliorer les performances
    await queryRunner.query(`
      CREATE INDEX idx_product_views_product_id ON product_views(product_id);
      CREATE INDEX idx_product_views_created_at ON product_views(created_at);
      CREATE INDEX idx_product_views_ip ON product_views(ip);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_product_views_ip;
      DROP INDEX IF EXISTS idx_product_views_created_at;
      DROP INDEX IF EXISTS idx_product_views_product_id;
    `);
    await queryRunner.dropTable('product_views');
    await queryRunner.dropColumn('products', 'view_count');
  }
}
