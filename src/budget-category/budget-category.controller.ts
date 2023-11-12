import { Controller } from '@nestjs/common';
import { BudgetCategoryService } from './budget-category.service';

@Controller('budget-category')
export class BudgetCategoryController {
  constructor(private readonly budgetCategoryService: BudgetCategoryService) {}
}
