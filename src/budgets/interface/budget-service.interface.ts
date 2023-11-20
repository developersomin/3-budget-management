export interface ICalcProperBudget{
  [categoryName:string]:number;
}

export interface ICategoryByAmount{
  categoryName: string;
  categoryByAmount: number;
}

export interface IProperAmount{
  todayProperAmount: number;
  todayBudgetByCategory: ICategoryByAmount[];
}
