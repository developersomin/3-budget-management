import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { Repository } from "typeorm";
import { BudgetsService } from "../budgets/budgets.service";
import {
  ICalculateDate, ICategoryBySum, ICategoryByTotalCost,
  IExpenseGuideResult,
  IFindExpensesQuery,
  IUsedUntilTodayExpense,
} from './interface/expenses-service.interface';
import { QuerySearchDto } from "./dto/query-search.dto";

@Injectable()
export class ExpensesService {
	constructor(
		@InjectRepository(Expenses) private readonly expensesRepository: Repository<Expenses>,
		private readonly budgetsService: BudgetsService,
	) {}

	createExpense(expenses: Pick<Expenses, 'year' | 'month'>, userId: string): Promise<Expenses> {
		return this.expensesRepository.save({
			year: expenses.year,
			month: expenses.month,
			user: {
				id: userId,
			},
		});
	}

	findByMonthAndUserId(expenses: Pick<Expenses, 'year' | 'month'>, userId: string): Promise<Expenses> {
		return this.expensesRepository.findOne({
			where: {
				year: expenses.year,
				month: expenses.month,
				user: {
					id: userId,
				},
			},
		});
	}

	updateTotalCostExpense(expense: Expenses, totalCost: number): Promise<Expenses> {
		return this.expensesRepository.save({
			...expense,
			totalCost,
		});
	}

	getExpense(expenseId: string): Promise<Expenses> {
		return this.expensesRepository.findOne({ where: { id: expenseId }, relations: ['expenseCategory'] });
	}

	async findExpenses(querySearchDto: QuerySearchDto, userId: string): Promise<ICategoryByTotalCost> {
		const { startDate, endDate, categoryId, minCost, maxCost } = querySearchDto;
		const qb1 = this.expensesRepository.createQueryBuilder('expenses');
		this.findExpensesQuery({
			qb: qb1,
			userId,
			startDate,
			endDate,
			categoryId,
			minCost,
			maxCost,
		});
		const expense = await qb1.getOne();
		const expenseCategories = expense.expenseCategory;
		const totalCost = await this.searchTotalCost({
			userId,
			...querySearchDto,
		});
		const categoryByTotalCost = await this.searchCategoryByTotalCost({
			userId,
			...querySearchDto,
		});
		return {
			totalCost,
			categoryByTotalCost,
			expenseCategories,
		};
	}

	async searchTotalCost({ userId, startDate, endDate, categoryId, minCost, maxCost }): Promise<number> {
		const qb = this.expensesRepository.createQueryBuilder('expenses');
		this.findExpensesQuery({
			qb,
			userId,
			startDate,
			endDate,
			categoryId,
			minCost,
			maxCost,
		});
		const totalSum = await qb.select('SUM(expenseCategory.cost) AS totalCost').groupBy('users.id').getRawOne();
		return totalSum ? totalSum.totalCost : 0;
	}

	async searchCategoryByTotalCost({ userId, startDate, endDate, categoryId, minCost, maxCost }):Promise<ICategoryBySum[]> {
		const qb = this.expensesRepository.createQueryBuilder('expenses');
		this.findExpensesQuery({
			qb: qb,
			userId,
			startDate,
			endDate,
			categoryId,
			minCost,
			maxCost,
		});
		const categoryByTotalCost = await qb
			.select(['category.name AS categoryName', 'SUM(expenseCategory.cost) AS categoryByTotalCost'])
			.groupBy('category.name')
			.getRawMany();
		return categoryByTotalCost;
	}

	findExpensesQuery({ qb, userId, startDate, endDate, categoryId, minCost, maxCost }: IFindExpensesQuery) {
		qb.innerJoinAndSelect('expenses.user', 'users')
			.innerJoinAndSelect('expenses.expenseCategory', 'expenseCategory')
			.innerJoinAndSelect('expenseCategory.category', 'category')
			.where('users.id = :userId', { userId })
			.andWhere('expenseCategory.updatedAt >= :startDate', { startDate })
			.andWhere('expenseCategory.updatedAt <= :endDate', { endDate });
		if (categoryId) {
			qb.andWhere('category.id = :categoryId', { categoryId });
		}
		if (minCost) {
			qb.andWhere('expenseCategory.cost >= :minCost', { minCost });
		}
		if (maxCost) {
			qb.andWhere('expenseCategory.cost <= :maxCost', { maxCost });
		}
	}

	calcDate(): ICalculateDate {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const day = now.getDay();
		const lastDayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDay();
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDay() - 1);
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDay());
		return {
			year,
			month,
			day,
			lastDayCount,
			firstDay,
			yesterday,
			today,
			now,
		};
	}

	async expenseGuide(userId: string): Promise<IExpenseGuideResult> {
		const { year, month, day, lastDayCount, firstDay, now } = this.calcDate();
		const { totalTodayCost, ...todayExpenseSumByCategory } = await this.usedUntilTodayExpense(
			userId,
			firstDay,
			now,
			year,
			month,
		);
		const budget = await this.budgetsService.findByMonthAndUserId({ year, month }, userId);
		const totalAmount = budget.totalAmount;
		const todayProperAmount = (totalAmount / lastDayCount) * day;
		const todayBudgetByCategory = this.budgetsService.calcProperBudget(budget, todayProperAmount);
		const riskPercent = {};
		for (const key in todayBudgetByCategory) {
			riskPercent[key] = Math.round(todayExpenseSumByCategory[key] / todayBudgetByCategory[key]);
		}
		riskPercent['total'] = Math.round(totalTodayCost / todayProperAmount);
		return {
			todayExpenseSumByCategory,
			todayBudgetByCategory,
			riskPercent,
		};
	}

	async usedUntilTodayExpense(userId: string, firstDay, now, year, month): Promise<IUsedUntilTodayExpense> {
		const qb = this.expensesRepository.createQueryBuilder('expenses');
		this.findExpensesQuery({
			qb,
			userId,
			startDate: firstDay,
			endDate: now,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		const budget = await this.budgetsService.findByMonthAndUserId(
			{
				year,
				month,
			},
			userId,
		);
		const todayExpense = await qb.getOne();
		const expenseCategories = todayExpense.expenseCategory;
		const todayExpenseSumByCategory = {};
		let totalTodayCost = 0;
		const budgetCategories = budget.budgetCategory;
		for (const budgetCategory of budgetCategories) {
			totalTodayCost[budgetCategory.category.name] = '';
		}
		for (const expenseCategory of expenseCategories) {
			const cost = expenseCategory.cost;
			const categoryName = expenseCategory.category.name;
			if (todayExpenseSumByCategory[categoryName] === undefined) {
				todayExpenseSumByCategory['기타'] += cost;
			} else {
				todayExpenseSumByCategory[categoryName] += cost;
			}
			totalTodayCost += cost;
		}
		return { ...todayExpenseSumByCategory, totalTodayCost };
	}
}
