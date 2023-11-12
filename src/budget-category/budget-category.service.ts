import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { BudgetCategory } from "./entity/budgets-category.entity";
import { Repository } from "typeorm";
import { Budgets } from "../budgets/entity/budgets.entity";

@Injectable()
export class BudgetCategoryService {
  constructor(@InjectRepository(BudgetCategory) private readonly budgetCategoryRepository:Repository<BudgetCategory>) {
  }

  /** 예산 설정 API
   *  1.동일한 카테고리가 있는지 검색
   *  2.만약 동일 카테고리가 있을 시 금액만 변경됨
   *  3.동일 카테고리가 없을시 두가지 유형 있음
   *  3-1.카테고리가 없을때  카테고리 생성 후 예산 저장
   *  3-2.카테고리가 있을때  그냥 예산 저장
   */
  async findByBudgetAndCategory(budgetId: string, categoryId: string): Promise<BudgetCategory> {
    const budgetCategory = await this.budgetCategoryRepository.findOne({
      where: {
        budget: { id: budgetId },
        category: { id: categoryId }
      }
    });
    return budgetCategory;
  }

  createBudgetCategory(amount:number,budgetId:string,categoryId:string){
    return this.budgetCategoryRepository.save({
      amount,
      budget: {
        id: budgetId
      },
      category: {
        id: categoryId
      }
    });
  }

  updateBudgetCategory(budgetCategory:BudgetCategory,amount:number) {
    return this.budgetCategoryRepository.save({
      ...budgetCategory,
      amount
    });
  }

  async postBudget(categoryName, money, userId): Promise<Budgets> {
    const budget = await this.findByUserAndCategory(userId, categoryName);
    if (budget) {
      return await this.budgetCategoryRepository.save({
        ...budget,
        money
      });
    } else {
      const category = await this.categoryService.findCategory(categoryName);
      if (category) {
        return this.budgetCategoryRepository.save({
          money,
          user: { id: userId },
          category: { id: category.id }
        });
      } else {
        const newCategory = await this.categoryService.createCategory(categoryName);
        return this.budgetCategoryRepository.save({
          money,
          user: { id: userId },
          category: { id: newCategory.id }
        });
      }
    }
  }
}
