import { Category } from '@/modules/products/entities/category.entity';

export const categories: Partial<Category>[] = [
  {
    name: 'Poussettes',
    description: 'Poussettes et accessoires de transport',
  },
  {
    name: 'Vêtements',
    description: 'Vêtements pour bébé et enfant',
  },
  {
    name: 'Jouets',
    description: 'Jouets et jeux pour tous les âges',
  },
  {
    name: 'Mobilier',
    description: 'Lits, commodes, tables à langer et autres meubles',
  },
  {
    name: 'Équipement',
    description: 'Sièges auto, transats, chaises hautes',
  },
  {
    name: 'Puériculture',
    description: "Articles de soin et d'hygiène",
  },
  {
    name: 'Alimentation',
    description: 'Biberons, chauffe-biberons, stérilisateurs',
  },
  {
    name: 'Éveil et Loisirs',
    description: "Tapis d'éveil, livres, instruments de musique",
  },
  {
    name: 'Sécurité',
    description: 'Barrières, moniteurs, protections',
  },
  {
    name: 'Autres',
    description: 'Autres articles pour bébé et enfant',
  },
];
