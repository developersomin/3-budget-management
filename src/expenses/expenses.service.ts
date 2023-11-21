import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { QueryRunner, Repository } from 'typeorm';
import { BudgetsService } from "../budgets/budgets.service";
import {
	CategoryNameToNumberMap,
	ICalculateDate, ICategoryBySum, ICategoryByTotalCost, ICompareExpenseWithLastMonth, IExpenseGuide,
	IFindExpensesQuery, IRecommendTodayExpense,
	IUsedUntilTodayExpense,
} from './interface/expenses-service.interface';
import { QuerySearchDto } from "./dto/query-search.dto";
import { RecommendEnum } from './enum/recommend.enum';
import { Budgets } from '../budgets/entity/budgets.entity';

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

	getExpense(expenseId: string): Promise<Expenses> {
		return this.expensesRepository.findOne({ where: { id: expenseId }, relations: ['expenseCategory'] });
	}

	async findExpenses(querySearchDto: QuerySearchDto, userId: string): Promise<ICategoryByTotalCost> {
		const { startDate, endDate, categoryId, minCost, maxCost } = querySearchDto;

		if (startDate.getTime() - endDate.getTime() > 0) {
			throw new BadRequestException('날짜 기간이 잘못되었습니다.');
		}
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
			.andWhere('expenseCategory.createdAt >= :startDate', { startDate })
			.andWhere('expenseCategory.createdAt <= :endDate', { endDate });
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

	/**
	 * 1.이번달 1일부터 현재까지 지출한 비용을 계산한다.
	 * 2.이번달 예산을 가져온다.
	 * 3.이번달 예산을 가지고 1일부터 현재까지 사용해야 할 적정 금액을 계산한다.
	 * 3-1.이번달 예산 잡은것으로 이번달 총 일수를 나누어 하루 적정 지불 금액을 구한다.
	 * 3-2.하루 적정 지불 금액으로 오늘날짜를 곱하여 오늘까지 적정 지불 금액을 구한다.
	 * 4.이번달까지 사용한 비용 / 적정 지불 금액 * 100  => 위험도를 구한다.
	 * 4-1.만약 지불한 카테고리가 예산 설계한 카테고리에 없으면 지불한 카테고리를 기타 카테고리로 빼서 계산한다.
	 * 5. 리턴 값으로 오늘까지 지붏한 총합과 카테고리별 합계,
	 *              오늘까지 사용할 적정 금액,
	 *              위험도
	 *              위 3가지를 리턴한다.
	 */
	async expenseGuide(userId: string): Promise<IExpenseGuide> {
		const { year, month, day, lastDayCount, firstDay, now } = this.calcDate();
		const usedUntilTodayExpense = await this.usedUntilTodayExpense(userId, firstDay, now, year, month);
		const budget = await this.budgetsService.findByMonthAndUserId({ year, month }, userId);
		const calcProperBudget = this.budgetsService.calcProperBudget(budget, lastDayCount, day);
		const riskPercent = {};
		const categoryByTotalCost = this.changedCategoryByTotalCost(usedUntilTodayExpense.categoryByTotalCost, budget);
		console.log(calcProperBudget.todayBudgetByCategory);
		for (const budgetCategory of calcProperBudget.todayBudgetByCategory) {
			const categoryName = budgetCategory.categoryName;
			const categoryByAmount = budgetCategory.categoryByAmount;
			console.log(categoryByTotalCost[categoryName]+"/"+budgetCategory.categoryByAmount);
			riskPercent[categoryName] = Math.round((categoryByTotalCost[categoryName] / categoryByAmount) * 100) + ' %';
		}
		riskPercent['total'] =
			Math.round((usedUntilTodayExpense.totalCost / calcProperBudget.todayProperAmount) * 100) + ' %';
		console.log(usedUntilTodayExpense.totalCost+"/"+calcProperBudget.todayProperAmount);
		return {
			usedUntilTodayExpense,
			calcProperBudget,
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
		const categoryByTotalCost = await this.searchCategoryByTotalCost({
			userId,
			startDate: firstDay,
			endDate: now,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		const totalCost = await this.searchTotalCost({
			userId,
			startDate: firstDay,
			endDate: now,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		for (const category of categoryByTotalCost) {
			if (category.categoryName) {
			}
		}
		return {
			totalCost,
			categoryByTotalCost,
		};
	}

	changedCategoryByTotalCost(categoryByTotalCost: ICategoryBySum[], budget: Budgets): CategoryNameToNumberMap {
		const result = {};
		const budgetCategories = budget.budgetCategory;
		for (const expenseCategory of categoryByTotalCost) {
			const categoryName = expenseCategory.categoryName;
			const isNameMatched = budgetCategories.some((budgetCategory) => {
				return budgetCategory.category.name === categoryName;
			});
			if (isNameMatched) {
				result[categoryName] = expenseCategory.categoryByTotalCost;
			} else if (!isNameMatched && !result['기타']) {
				result['기타'] = expenseCategory.categoryByTotalCost;
			} else if (!isNameMatched && result['기타']) {
				result['기타'] += expenseCategory.categoryByTotalCost;
			}
		}
		return result;
	}

	/**
	 * 1.이번달 예산을 가져온다.(예산이 없으면 오류를 내보낸다)
	 * 2.이번달 설정한 예산으로 하루에 적정 예산을 계산한다.
	 * 3.이번달부터 지금까지의  총 지불 비용 및 카테고리 별 비용을 계산한다.
	 * 4.이번달 설정한 예산 - 지번달 지출한 비용 = 남은 예산
	 * 5.남은 예산을 남은 일자로 나누어 하루 사용할 예산을 설정한다.
	 * 5-1.만약 하루 사용할 카테고리별 예산이 3천미만일때는 최소값 3천원으로 설정하여 추천해준다.
	 * 6. 이번달 설정 예산과 2번 하루 적정 예산으로 사용했을때의 오늘 까지 사용한 예산을 빼준다.
	 * 6-1. 6번의 예산과 4번의 남은 예산을 비교하여 메세지를 출력한다.
	 */
	async recommendTodayExpense(userId: string): Promise<IRecommendTodayExpense> {
		const { firstDay, year, month, day, lastDayCount, now } = this.calcDate();
		const budget = await this.budgetsService.findByMonthAndUserId({ year, month }, userId);
		if (!budget) {
			throw new InternalServerErrorException('설정된 예산이 없습니다.');
		}
		const { todayProperAmount } = this.budgetsService.calcProperBudget(
			budget,
			lastDayCount,
			day,
		);
		const budgetCategories = budget.budgetCategory;
		const { totalCost, categoryByTotalCost } = await this.usedUntilTodayExpense(userId, firstDay, now, year, month);
		const changedCategoryByTotalCost = this.changedCategoryByTotalCost(categoryByTotalCost, budget);
		const restTodayBudgetAmount = {};
		for (const budgetCategory of budgetCategories) {
			const categoryName = budgetCategory.category.name;
			const todayProperCost =
				Math.round(
					(budgetCategory.amount - changedCategoryByTotalCost[categoryName]) / (lastDayCount - day + 1) / 100,
				) * 100;
			if (todayProperCost < 3000) {
				restTodayBudgetAmount[categoryName] = 3000;
			} else {
				restTodayBudgetAmount[categoryName] = todayProperCost;
			}
		}
		let message: RecommendEnum;
		const properTotalAmount = budget.totalAmount - todayProperAmount;
		const realTotalAmount = budget.totalAmount - totalCost;
		if (properTotalAmount * 1.2 < realTotalAmount) {
			message = RecommendEnum.GOOD;
		} else if (properTotalAmount * 0.8 < realTotalAmount && properTotalAmount * 1.2 >= realTotalAmount) {
			message = RecommendEnum.SOSO;
		} else if (todayProperAmount * 0.5 < totalCost && todayProperAmount * 0.8 >= totalCost) {
			message = RecommendEnum.BAD;
		} else {
			message = RecommendEnum.DIE;
		}
		return {
			restTodayBudgetAmount,
			message,
		};
	}

	/**
	 * 1.예를 들어 오늘은 11/21 이다.
	 * 2.10/1 00:00 부터 10/22 00:00까지 총 지출한 비용을 계산한다.
	 * 3.11/1 00:00 부터 11/22 00:00까지 총 지출한 비용을 계산한다.
	 * 4. 3번/2번*100 을 하여 지난 달 대비 이번달 소비율을 구한다.
	 */
	async compareExpenseWithLastMonth(userId: string): Promise<ICompareExpenseWithLastMonth> {
		const { lastMonthFirstDay, lastMonth, firstDay, today } = this.calcDate();
		const lastMonthCategoryByCost = await this.searchCategoryByTotalCost({
			userId,
			startDate: lastMonthFirstDay,
			endDate: lastMonth,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		if (!lastMonthCategoryByCost) {
			throw new BadRequestException('지난 달 지출 기록이 없습니다.');
		}
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
		const totalConsumptionRate = Math.round((nowTotalCost / lastMonthTotalCost) * 100);
		const result = {
			totalConsumptionRate: totalConsumptionRate+" %",
			categoryByConsumptionRate: {},
		};
		for (const category of lastMonthCategoryByCost) {
			result.categoryByConsumptionRate[category.categoryName] = 1 / category.categoryByTotalCost;
		}
		for (const category of nowCategoryByCost) {
			if (result.categoryByConsumptionRate[category.categoryName]) {
				result.categoryByConsumptionRate[category.categoryName] =
					Math.round(
						category.categoryByTotalCost * result.categoryByConsumptionRate[category.categoryName] * 100,
					) + ' %';
			} else {
				result.categoryByConsumptionRate[category.categoryName] = category.categoryByTotalCost;
			}
		}
		return result;
	}

	/**
	 * 1.예를 들어 오늘은 11/21 화요일이다.
	 * 2.7일 전인 11/14 화요일의 지출 비용을 구한다. (11/14 00:00 ~11/15 00:00)
	 * 3.오늘 지출 비용을 구한다. (11/21 00:00 ~11/22 00:00)
	 * 4. 3번/2번*100 을 하여 지난 달 화요일 대비 이번달 화요일 소비율을 구한다.
	 */
	async compareExpenseWithLastWeek(userId: string): Promise<string> {
		const { aWeekAgo, today,now } = this.calcDate();
		const beforeToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
		const beforeAWeekAgo = new Date(aWeekAgo.getFullYear(), aWeekAgo.getMonth(), aWeekAgo.getDate() - 1);
		const dayOfWeek = now.getDay();
		const daysOfWeek = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
		const lastMonthTotalCost = await this.searchTotalCost({
			userId,
			startDate: beforeAWeekAgo,
			endDate: aWeekAgo,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		if(!lastMonthTotalCost){
			throw new BadRequestException(`지난 주 ${daysOfWeek[dayOfWeek]}에 지출한 기록이 없습니다.`);
		}
		const nowTotalCost = await this.searchTotalCost({
			userId,
			startDate: beforeToday,
			endDate: today,
			categoryId: null,
			minCost: null,
			maxCost: null,
		});
		const totalConsumptionRate = Math.round((nowTotalCost / lastMonthTotalCost) * 100) + ' %';
		return totalConsumptionRate;
	}
}
