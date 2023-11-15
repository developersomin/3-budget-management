import { SelectQueryBuilder } from "typeorm";
import { Expenses } from "../entity/expenses.entity";
import { ExpenseCategory } from "../../expensecategory/entity/expenses-category.entity";

export interface ICalculateDate {
  year: number;
  month: number;
  day: number;
  lastDayCount: number;
  firstDay: Date;
  yesterday: Date;
  today: Date;
  now: Date;
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

export interface IUsedUntilTodayExpense{
  [categoryName:string]:number;
  totalTodayCost: number;
}

interface CategoryNameToNumberMap {
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