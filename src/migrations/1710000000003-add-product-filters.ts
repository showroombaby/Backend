import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddProductFilters1710000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'enum pour l'état des produits
    await queryRunner.query(`
      CREATE TYPE "public"."product_condition_enum" AS ENUM (
        'new',
        'like_new',
        'very_good',
        'good',
        'fair'
      )
    `);

    // Ajouter les colonnes à la table products
    await queryRunner.addColumns('products', [
      new TableColumn({
        name: 'condition',
        type: 'enum',
        enum: ['new', 'like_new', 'very_good', 'good', 'fair'],
        enumName: 'product_condition_enum',
        isNullable: false,
        default: "'good'",
      }),
      new TableColumn({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 6,
        isNullable: true,
      }),
      new TableColumn({
        name: 'longitude',
        type: 'decimal',
        precision: 10,
        scale: 6,
        isNullable: true,
      }),
      new TableColumn({
        name: 'address',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'city',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'zip_code',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    // Créer la table saved_filters
    await queryRunner.createTable(
      new Table({
        name: 'saved_filters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'min_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'condition',
            type: 'enum',
            enum: ['new', 'like_new', 'very_good', 'good', 'fair'],
            enumName: 'product_condition_enum',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'radius',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['category_id'],
            referencedTableName: 'categories',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    // Ajouter des index pour améliorer les performances
    await queryRunner.query(`
      CREATE INDEX idx_products_condition ON products(condition);
      CREATE INDEX idx_products_location ON products(latitude, longitude);
      CREATE INDEX idx_products_city ON products(city);
      CREATE INDEX idx_products_zip_code ON products(zip_code);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_condition;
      DROP INDEX IF EXISTS idx_products_location;
      DROP INDEX IF EXISTS idx_products_city;
      DROP INDEX IF EXISTS idx_products_zip_code;
    `);

    // Supprimer la table saved_filters
    await queryRunner.dropTable('saved_filters');

    // Supprimer les colonnes de la table products
    await queryRunner.dropColumns('products', [
      'condition',
      'latitude',
      'longitude',
      'address',
      'city',
      'zip_code',
    ]);

    // Supprimer l'enum
    await queryRunner.query(`DROP TYPE "public"."product_condition_enum"`);
  }
}
