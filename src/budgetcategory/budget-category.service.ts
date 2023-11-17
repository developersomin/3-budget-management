import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { BudgetCategory } from "./entity/budgets-category.entity";
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { CreateCategoryBudgetDto } from "./dto/create-category-budget.dto";
import { CategoryService } from "../category/category.service";
import { BudgetsService } from "../budgets/budgets.service";

@Injectable()
export class BudgetCategoryService {
	constructor(
		@InjectRepository(BudgetCategory) private readonly budgetCategoryRepository: Repository<BudgetCategory>,
		private readonly categoryService: CategoryService,
		@Inject(forwardRef(() => BudgetsService)) private readonly budgetsService: BudgetsService,
		private readonly dateSource: DataSource,
	) {}

	getRepository(qr?: QueryRunner): Repository<BudgetCategory> {
		return qr ? qr.manager.getRepository<BudgetCategory>(BudgetCategory) : this.budgetCategoryRepository;
	}

	getBudgetCategory(budgetCategoryId: string) {
		return this.budgetCategoryRepository.findOne({
			where: {
				id: budgetCategoryId,
			},
		});
	}

	findByBudgetIdAndCategoryId(budgetId:string, categoryId:string){
		return this.budgetCategoryRepository.findOne({
			where: {
				budget: {
					id: budgetId,
				},
				category: {
					id: categoryId,
				},
			},
		});
	}

	async createBudgetCategory(
		amount: number,
		budgetId: string,
		categoryId: string,
		qr?: QueryRunner,
	): Promise<BudgetCategory> {
		const repository = this.getRepository(qr);
		const budgetCategory = repository.create({
			amount,
			budget: {
				id: budgetId,
			},
			category: {
				id: categoryId,
			},
		});
		return repository.save(budgetCategory);
	}

	async updateBudgetCategory(
		budgetCategoryId: string,
		qr: QueryRunner,
		amount: number,
		categoryId: string,
	): Promise<BudgetCategory> {
		const repository = this.getRepository(qr);
		const budgetCategory = await this.getBudgetCategory(budgetCategoryId);
		if (!budgetCategory) {
			throw new BadRequestException('수정할 예산 카테고리를 찾지 못했습니다.');
		}
		if (categoryId) {
			return repository.save({
				...budgetCategory,
				amount,
				category: {
					id: categoryId,
				},
			});
		} else {
			return repository.save({
				...budgetCategory,
				amount,
			});
		}
	}

	/**
	 * 카테고리 별 예산 설정
	 * 1.월별 예산이 설정 되있는지 확인한다.
	 * 2.만약 월별 예산이 설정이 안되어있으면 생성한다.
	 * 3.카테고리 별 예산 설정할때 필요한 카테고리 이름이 존재하는지 확인한다.
	 * 4.만약 카테고리 이름이 없으면 생성한다.
	 * 5.위 사항을 다 진행하면 카테고리 ID와 예산 ID를 가져 올 수 있다.
	 * 6. 카테고리 ID와 예산 ID 로 카테고리 별 예산이 존재하는지 확인한다.
	 * 7. 있으면 error (수정하는 메소드를 실행)
	 * 8. 만약 없으면 생성하고 리턴한다.
	 */
	async budgetByCategory(
		createCategoryBudgetDto: CreateCategoryBudgetDto,
		userId: string,
		qr: QueryRunner,
	): Promise<BudgetCategory> {
		const { year, month, categoryName, amount } = createCategoryBudgetDto;
		let budget = await this.budgetsService.findBudget(year, month, userId);
		if (!budget) {
			budget = await this.budgetsService.createBudget({ year, month }, userId, qr);
		}
		let category = await this.categoryService.findCategory(categoryName);
		if (!category) {
			category = await this.categoryService.createCategory(categoryName, qr);
		}
		const findBudgetCategory = await this.findByBudgetIdAndCategoryId(budget.id, category.id);
		if (findBudgetCategory) {
			throw new BadRequestException("동일한 카테고리 예산이 있습니다. 변경을 원하시면 updateBudgetCategory 로 수정해주세요.")
		}
		const result = await this.createBudgetCategory(amount, budget.id, category.id, qr);
		await this.budgetsService.updateTotalAmount(budget, budget.totalAmount + amount, qr);
		return result;
	}
}
