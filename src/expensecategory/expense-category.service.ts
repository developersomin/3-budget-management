import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ExpenseCategory } from "./entity/expenses-category.entity";
import { QueryRunner, Repository } from 'typeorm';
import { CreateExpenseCategoryDto } from "./dto/create-expense-category.dto";
import { ExpensesService } from "../expenses/expenses.service";
import { CategoryService } from "../category/category.service";
import { UpdateExpenseCategoryDto } from "./dto/update-expense-category.dto";
import { Category } from "../category/entity/category.entity";
import { BudgetCategory } from '../budgetcategory/entity/budgets-category.entity';

@Injectable()
export class ExpenseCategoryService {
	constructor(
		@InjectRepository(ExpenseCategory) private readonly expenseCategoryRepository: Repository<ExpenseCategory>,
		private readonly expensesService: ExpensesService,
		private readonly categoryService: CategoryService,
	) {}

	getRepository(qr?: QueryRunner): Repository<ExpenseCategory> {
		return qr ? qr.manager.getRepository<ExpenseCategory>(ExpenseCategory) : this.expenseCategoryRepository;
	}

	async createExpenseCategory(
		createExpenseCategoryDto: CreateExpenseCategoryDto,
		userId: string,
		qr: QueryRunner
	): Promise<ExpenseCategory> {
		const repository = this.getRepository(qr);
		const { year, month, cost, memo, categoryName, isExclude } = createExpenseCategoryDto;
		let expense = await this.expensesService.findByMonthAndUserId({ year, month }, userId);
		if (!expense) {
			expense = await this.expensesService.createExpense({ year, month }, userId, qr);
		}
		let category = await this.categoryService.findCategory(categoryName);
		if (!category) {
			category = await this.categoryService.createCategory(categoryName, qr);
		}
		const result = await repository.save({
			cost,
			memo,
			isExclude,
			expense: {
				id: expense.id,
			},
			category: {
				id: category.id,
			},
		});
		await this.expensesService.updateTotalCostExpense(expense, expense.totalCost + cost, qr);
		return result;
	}

	getExpenseCategory(expenseCategoryId: string): Promise<ExpenseCategory> {
		return this.expenseCategoryRepository.findOne({
			where: { id: expenseCategoryId },
			relations: ['category', 'expense'],
		});
	}

	async updateExpenseCategory(
		updateExpenseCategoryDto: UpdateExpenseCategoryDto,
		expenseCategoryId: string,
		qr:QueryRunner
	): Promise<ExpenseCategory> {
		const repository = this.getRepository();
		const { memo, cost, categoryName, isExclude } = updateExpenseCategoryDto;
		const expenseCategory = await this.getExpenseCategory(expenseCategoryId);
		if (!expenseCategory) {
			throw new BadRequestException('수정할 지출 내역이 존재하지 않습니다.');
		}
		let category: Category;
		let result: ExpenseCategory;
		if (categoryName) {
			category = await this.categoryService.findCategory(categoryName);
			if (!category) {
				category = await this.categoryService.createCategory(categoryName,qr);
			}
			result = await repository.save({
				...expenseCategory,
				memo,
				isExclude,
				cost,
				category: {
					id: category.id,
				},
			});
		} else {
			result = await repository.save({
				...expenseCategory,
				memo,
				isExclude,
				cost,
			});
		}
		const expenseId = expenseCategory.expense.id;
		const expense = await this.expensesService.getExpense(expenseId);
		const differCost = expenseCategory.cost - cost; //500 - 400
		await this.expensesService.updateTotalCostExpense(expense, expense.totalCost - differCost, qr);
		return result;
	}

	async deleteExpenseCategory(expenseCategoryId: string,qr:QueryRunner): Promise<boolean> {
		const repository = this.getRepository();
		const expenseCategory = await this.getExpenseCategory(expenseCategoryId);
		if (!expenseCategory) {
			throw new BadRequestException('삭제할 지출 내역이 존재하지 않습니다.');
		}
		const expenseId = expenseCategory.expense.id;
		const expense = await this.expensesService.getExpense(expenseId);
		await this.expensesService.updateTotalCostExpense(expense, expense.totalCost - expenseCategory.cost, qr);
		const result = await repository.softDelete({ id: expenseCategoryId });
		return result.affected ? true : false;
	}
}

