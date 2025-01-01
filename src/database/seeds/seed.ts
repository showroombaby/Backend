import dataSource from '@/config/database.seed.config';
import { Category } from '@/modules/categories/entities/category.entity';
import { categories } from './category.seed';

async function bootstrap() {
  try {
    await dataSource.initialize();
    const categoryRepository = dataSource.getRepository(Category);

    console.log('🌱 Début du seeding...');

    // Seed des catégories
    console.log('Insertion des catégories...');
    for (const category of categories) {
      const exists = await categoryRepository.findOne({
        where: { name: category.name },
      });

      if (!exists) {
        await categoryRepository.save(category);
        console.log(`✅ Catégorie créée : ${category.name}`);
      } else {
        console.log(`ℹ️ Catégorie existante : ${category.name}`);
      }
    }

    console.log('✨ Seeding terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur pendant le seeding :', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

bootstrap();
