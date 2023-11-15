import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ExpenseCategory } from "./entity/expenses-category.entity";
import { Repository } from "typeorm";
import { CreateExpenseCategoryDto } from "./dto/create-expense-category.dto";
import { ExpensesService } from "../expenses/expenses.service";
import { CategoryService } from "../category/category.service";
import { UpdateExpenseCategoryDto } from "./dto/update-expense-category.dto";
import { Category } from "../category/entity/category.entity";

@Injectable()
export class ExpenseCategoryService {
	constructor(
		@InjectRepository(ExpenseCategory) private readonly expenseCategoryRepository: Repository<ExpenseCategory>,
		private readonly expensesService: ExpensesService,
		private readonly categoryService: CategoryService,
	) {}

	async createExpenseCategory(
		createExpenseCategoryDto: CreateExpenseCategoryDto,
		userId: string,
	): Promise<ExpenseCategory> {
		const { year, month, cost, memo, categoryName } = createExpenseCategoryDto;
		let expense = await this.expensesService.findByMonthAndUserId({ year, month }, userId);
		if (!expense) {
			expense = await this.expensesService.createExpense({ year, month }, userId);
		}
		let category = await this.categoryService.findCategory(categoryName);
		if (!category) {
			category = await this.categoryService.createCategory(categoryName);
		}
		const result = await this.expenseCategoryRepository.save({
			cost,
			memo,
			expense: {
				id: expense.id,
			},
			category: {
				id: category.id,
			},
		});
		await this.expensesService.updateTotalCostExpense(expense, expense.totalCost + cost);
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
	): Promise<ExpenseCategory> {
		const { memo, cost, categoryName } = updateExpenseCategoryDto;
		const expenseCategory = await this.getExpenseCategory(expenseCategoryId);
		if (!expenseCategory) {
			throw new BadRequestException('수정할 지출 내역이 존재하지 않습니다.');
		}
		let category: Category;
		let result: ExpenseCategory;
		if (categoryName) {
			category = await this.categoryService.findCategory(categoryName);
			if (!category) {
				category = await this.categoryService.createCategory({
					name: categoryName,
				});
			}
			result = await this.expenseCategoryRepository.save({
				...expenseCategory,
				memo,
				cost,
				category: {
					id: category.id,
				},
			});
		} else {
			result = await this.expenseCategoryRepository.save({
				...expenseCategory,
				memo,
				cost,
			});
		}
		const expenseId = expenseCategory.expense.id;
		const expense = await this.expensesService.getExpense(expenseId);
		const differCost = expenseCategory.cost - cost; //500 - 400
		await this.expensesService.updateTotalCostExpense(expense, expense.totalCost - differCost);
		return result;
	}

	async deleteExpenseCategory(expenseCategoryId: string): Promise<boolean> {
		const expenseCategory = await this.getExpenseCategory(expenseCategoryId);
		if (!expenseCategory) {
			throw new BadRequestException('삭제할 지출 내역이 존재하지 않습니다.');
		}
		const expenseId = expenseCategory.expense.id;
		const expense = await this.expensesService.getExpense(expenseId);
		await this.expensesService.updateTotalCostExpense(expense, expense.totalCost - expenseCategory.cost);
		const result = await this.expenseCategoryRepository.softDelete({ id: expenseCategoryId });
		return result.affected ? true : false;
	}
}

