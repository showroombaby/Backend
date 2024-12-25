import { ProductStatus } from '../entities/product.entity';
import { ProductCondition } from '../enums/product-condition.enum';

export class SellerInfoDto {
  id: string;
  username: string;
  avatarUrl?: string;
  rating?: number;
  productsCount: number;
  memberSince: Date;
}

export class ProductDetailDto {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  status: ProductStatus;
  images: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    zipCode?: string;
  };
  seller: SellerInfoDto;
  category: {
    id: string;
    name: string;
  };
  isFavorite: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
} 