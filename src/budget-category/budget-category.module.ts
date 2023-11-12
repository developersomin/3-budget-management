import { Module } from '@nestjs/common';
import { BudgetCategoryService } from './budget-category.service';
import { BudgetCategoryController } from './budget-category.controller';

@Module({
  controllers: [BudgetCategoryController],
  providers: [BudgetCategoryService],
})
export class BudgetCategoryModule {}
