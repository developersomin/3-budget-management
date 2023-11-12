import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateCategoryBudgetDto{
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  month: number;

  @IsNumber()
  @IsNotEmpty()
  categoryName:string;

  @IsNumber()
  @IsNotEmpty()
  amount:number;
}