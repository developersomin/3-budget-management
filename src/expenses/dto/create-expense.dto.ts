import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Category } from "../../category/entity/category.entity";

export class CreateExpenseDto{
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsNumber()
  cost: number;

  @IsString()
  memo:string;
}