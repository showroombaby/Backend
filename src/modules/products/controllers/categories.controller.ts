import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from '../../categories/services/categories.service';

@Controller('product-categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }
}
