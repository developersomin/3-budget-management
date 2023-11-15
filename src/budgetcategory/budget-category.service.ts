import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BudgetCategory } from "./entity/budgets-category.entity";
import { Repository } from "typeorm";
import { CreateCategoryBudgetDto } from "./dto/create-category-budget.dto";
import { CategoryService } from "../category/category.service";
import { BudgetsService } from "../budgets/budgets.service";

@Injectable()
export class BudgetCategoryService {
	constructor(
		@InjectRepository(BudgetCategory) private readonly budgetCategoryRepository: Repository<BudgetCategory>,
		private readonly categoryService: CategoryService,
		@Inject(forwardRef(() => BudgetsService)) private readonly budgetsService: BudgetsService,
	) {}

	async findByBudgetAndCategory(budgetId: string, categoryId: string): Promise<BudgetCategory> {
		const budgetCategory = await this.budgetCategoryRepository.findOne({
			where: {
				budget: { id: budgetId },
				category: { id: categoryId },
			},
		});
		return budgetCategory;
	}

	createBudgetCategory(amount: number, budgetId: string, categoryId: string) {
		return this.budgetCategoryRepository.save({
			amount,
			budget: {
				id: budgetId,
			},
			category: {
				id: categoryId,
			},
		});
	}

	updateBudgetCategory(budgetCategory: BudgetCategory, amount: number) {
		return this.budgetCategoryRepository.save({
			...budgetCategory,
			amount,
		});
	}

	/**
	 * 카테고리 별 예산 설정
	 * 1.월별 예산이 설정 되있는지 확인한다.
	 * 2.만약 월별 예산이 설정이 안되어있으면 생성한다.
	 * 3.카테고리 별 예산 설정할때 필요한 카테고리 이름이 존재하는지 확인한다.
	 * 4.만약 카테고리 이름이 없으면 생성한다.
	 * 5.위 사항을 다 진행하면 카테고리 ID와 예산 ID를 가져 올 수 있다.
	 * 6. 카테고리 ID와 예산 ID 로 카테고리 별 예산이 존재하는지 확인한다.
	 * 7. 만약 없으면 생성하고 리턴한다.
	 * 8. 있으면 amount 수정하고 카테고리별 amount 를 다 더해 budget의 totalamount를 계산한다.
	 * 9.
	 */
	async budgetByCategory(createCategoryBudgetDto: CreateCategoryBudgetDto, userId: string): Promise<BudgetCategory> {
		const { year, month, categoryName, amount } = createCategoryBudgetDto;
		let budget = await this.budgetsService.findByMonthAndUserId({ year, month }, userId);
		if (!budget) {
			budget = await this.budgetsService.createBudget({ year, month }, userId);
		}
		let category = await this.categoryService.findCategory(categoryName);
		if (!category) {
			category = await this.categoryService.createCategory(categoryName);
		}
		const findBudgetCategory = await this.findByBudgetAndCategory(budget.id, category.id);
		if (!findBudgetCategory) {
			const result = await this.createBudgetCategory(amount, budget.id, category.id);
			await this.budgetsService.updateTotalAmount(budget, budget.totalAmount + amount);
			return result;
		} else {
			const result = await this.updateBudgetCategory(findBudgetCategory, amount);
			const differAmount = findBudgetCategory.amount - amount;
			await this.budgetsService.updateTotalAmount(budget, budget.totalAmount - differAmount);
			return result;
		}
	}
}
