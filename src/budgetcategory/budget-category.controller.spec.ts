import { Test, TestingModule } from '@nestjs/testing';
import { BudgetCategoryController } from './budget-category.controller';
import { BudgetCategoryService } from './budget-category.service';

describe('BudgetCategoryController', () => {
  let controller: BudgetCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetCategoryController],
      providers: [BudgetCategoryService],
    }).compile();

    controller = module.get<BudgetCategoryController>(BudgetCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
