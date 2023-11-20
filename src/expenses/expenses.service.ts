import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { QueryRunner, Repository } from 'typeorm';
import { BudgetsService } from "../budgets/budgets.service";
import {
	ICalculateDate, ICategoryBySum, ICategoryByTotalCost, ICompareExpenseWithLastMonth,
	IExpenseGuideResult,
	IFindExpensesQuery,
	IUsedUntilTodayExpense,
} from './interface/expenses-service.interface';
import { QuerySearchDto } from "./dto/query-search.dto";
import { RecommendEnum } from './enum/recommend.enum';
import { ExpenseCategory } from '../expensecategory/entity/expenses-category.entity';

@Injectable()
export class ExpensesService {
	constructor(
		@InjectRepository(Expenses) private readonly expensesRepository: Repository<Expenses>,
		private readonly budgetsService: BudgetsService,
	) {}
	getRepository(qr?: QueryRunner): Repository<Expenses> {
		return qr ? qr.manager.getRepository<Expenses>(Expenses) : this.expensesRepository;
	}

	createExpense(expenses: Pick<Expenses, 'year' | 'month'>, userId: string, qr?: QueryRunner): Promise<Expenses> {
		const repository = this.getRepository(qr);
		return repository.save({
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

/*	updateTotalCostExpense(expense: Expenses, totalCost: number, qr?: QueryRunner): Promise<Expenses> {
		const repository = this.getRepository(qr);
		return repository.save({
			...expense,
			totalCost,
		});
	}*/

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
		const totalSum = await qb
			.select('SUM(expenseCategory.cost) AS totalCost')
			.andWhere('expenseCategory.isExclude = false')
			.groupBy('users.id')
			.getRawOne();
		return totalSum ? totalSum.totalCost : 0;
	}

	async searchCategoryByTotalCost({
		userId,
		startDate,
		endDate,
		categoryId,
		minCost,
		maxCost,
	}): Promise<ICategoryBySum[]> {
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
		const day = now.getDate();
		const lastDayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate() + 1);
		const lastMonthFirstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		const aWeekAgo = new Date();
		aWeekAgo.setDate(day - 6);
		aWeekAgo.setHours(0, 0, 0, 0);
		return {
			year,
			month,
			day,
			lastDayCount,
			firstDay,
			today,
			now,
			lastMonth,
			lastMonthFirstDay,
			aWeekAgo,
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
		const { todayProperAmount, ...todayBudgetByCategory } = this.budgetsService.calcProperBudget(
			budget,
			lastDayCount,
			day,
		);
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

	async usedUntilTodayExpense(
		userId: string,
		firstDay: Date,
		now: Date,
		year: number,
		month: number,
	): Promise<IUsedUntilTodayExpense> {
		const budget = await this.budgetsService.findByMonthAndUserId(
			{
				year,
				month,
			},
			userId,
		);
		if (!budget) {
			throw new InternalServerErrorException('설정된 예산이 없습니다.');
		}
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

	async recommendTodayExpense(userId: string) {
		const { firstDay, year, month, day, lastDayCount, now } = this.calcDate();
		const budget = await this.budgetsService.findByMonthAndUserId({ year, month }, userId);
		const { todayProperAmount, ...todayBudgetByCategory } = this.budgetsService.calcProperBudget(
			budget,
			lastDayCount,
			day,
		);
		const budgetCategories = budget.budgetCategory;
		if (!budget) {
			throw new InternalServerErrorException('설정된 예산이 없습니다.');
		}
		const { totalTodayCost, ...todayExpenseSumByCategory } = await this.usedUntilTodayExpense(
			userId,
			firstDay,
			now,
			year,
			month,
		);
		const restTodayBudgetAmount = {};
		let todayTotalProperCost = 0;
		for (const budgetCategory of budgetCategories) {
			const categoryName = budgetCategory.category.name;
			const todayProperCost =
				Math.round(
					(budgetCategory.amount - todayExpenseSumByCategory[categoryName]) / (lastDayCount - day + 1) / 100,
				) * 100;
			if (todayProperCost < 3000) {
				restTodayBudgetAmount[categoryName] = 3000;
			} else {
				restTodayBudgetAmount[categoryName] = todayProperCost;
			}
			todayTotalProperCost += todayProperCost;
		}
		let message: RecommendEnum;
		if (todayProperAmount * 1.2 < todayTotalProperCost) {
			message = RecommendEnum.GOOD;
		} else if (todayProperAmount * 0.8 < todayTotalProperCost && todayProperAmount * 1.2 >= todayTotalProperCost) {
			message = RecommendEnum.SOSO;
		} else if (todayProperAmount * 0.5 < todayTotalProperCost && todayProperAmount * 0.8 >= todayTotalProperCost) {
			message = RecommendEnum.BAD;
		} else {
			message = RecommendEnum.DIE;
		}
	}

	async compareExpenseWithLastMonth(userId: string): Promise<ICompareExpenseWithLastMonth> {
		const { lastMonthFirstDay, lastMonth, firstDay, today } = this.calcDate();
		const qb = this.expensesRepository.createQueryBuilder('expenses');
		const lastMonthCategoryByCost = await this.searchCategoryByTotalCost({
			userId,
			startDate: lastMonthFirstDay,
			endDate: lastMonth,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		const lastMonthTotalCost = await this.searchTotalCost({
			userId,
			startDate: lastMonthFirstDay,
			endDate: lastMonth,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		const nowCategoryByCost = await this.searchCategoryByTotalCost({
			userId,
			startDate: firstDay,
			endDate: today,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		const nowTotalCost = await this.searchTotalCost({
			userId,
			startDate: firstDay,
			endDate: today,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		//categoryName        categoryByTotalCost
		const result = {
			totalPercent: nowTotalCost / lastMonthTotalCost,
			categoryPercent: {},
		};
		for (const category of lastMonthCategoryByCost) {
			result.categoryPercent[category.categoryName] = 1 / category.categoryByTotalCost;
		}
		for (const category of nowCategoryByCost) {
			if (result.categoryPercent[category.categoryName]) {
				result.categoryPercent[category.categoryName] =
					category.categoryByTotalCost * result.categoryPercent[category.categoryName];
			} else {
				result.categoryPercent[category.categoryName] = category.categoryByTotalCost;
			}
		}
		return result;
	}
	async compareExpenseWithLastWeek(userId: string): Promise<number> {
		const { aWeekAgo, today } = this.calcDate();
		const beforeToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
		const beforeAWeekAgo = new Date(aWeekAgo.getFullYear(), aWeekAgo.getMonth(), aWeekAgo.getDate() - 1);
		const qb = this.expensesRepository.createQueryBuilder('expenses');

		const lastMonthTotalCost = await this.searchTotalCost({
			userId,
			startDate: beforeAWeekAgo,
			endDate: aWeekAgo,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});

		const nowTotalCost = await this.searchTotalCost({
			userId,
			startDate: beforeToday,
			endDate: today,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});

		const totalPercent = nowTotalCost / lastMonthTotalCost;

		return totalPercent;
	}
}
