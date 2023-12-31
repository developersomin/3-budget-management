import { SelectQueryBuilder } from "typeorm";
import { Expenses } from "../entity/expenses.entity";
import { ExpenseCategory } from "../../expensecategory/entity/expenses-category.entity";
import { IProperAmount } from '../../budgets/interface/budget-service.interface';
import { RecommendEnum } from '../enum/recommend.enum';

export interface ICalculateDate {
  year: number;
  month: number;
  day: number;
  lastDayCount: number;
  firstDay: Date;
  today: Date;
  now: Date;
  lastMonth:Date;
  lastMonthFirstDay:Date;
  aWeekAgo:Date;
}

export interface IFindExpensesQuery {
  qb: SelectQueryBuilder<Expenses>;
  userId: string;
  startDate: Date;
  endDate: Date;
  categoryId: string;
  minCost: number;
  maxCost: number;
}

export interface CategoryNameToNumberMap {
	[categoryName: string]: number;
}

export interface IExpenseGuideResult {
  todayExpenseSumByCategory: CategoryNameToNumberMap;
  todayBudgetByCategory:CategoryNameToNumberMap;
  riskPercent: CategoryNameToNumberMap;
}

export interface ICategoryBySum{
  categoryName: string;
  categoryByTotalCost: number;
}

export interface ICategoryByTotalCost{
  totalCost: number;
  categoryByTotalCost: ICategoryBySum[];
  expenseCategories: ExpenseCategory[];
}

export interface IUsedUntilTodayExpense{
  totalCost: number;
  categoryByTotalCost: ICategoryBySum[];
}

export interface ICompareExpenseWithLastMonth {
	totalConsumptionRate :string,
	categoryByConsumptionRate: IPercent,
}

export interface IExpenseGuide {
	usedUntilTodayExpense: IUsedUntilTodayExpense;
	calcProperBudget: IProperAmount;
	riskPercent: IPercent;
}

export interface IPercent {
	[categoryName: string]: string;
}

export interface IRecommendTodayExpense {
	restTodayBudgetAmount: CategoryNameToNumberMap;
	message: RecommendEnum;
}