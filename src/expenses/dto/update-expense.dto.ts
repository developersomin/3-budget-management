import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Category } from "../../category/entity/category.entity";
import { PickType } from "@nestjs/mapped-types";
import { CreateExpenseDto } from "./create-expense.dto";

export class UpdateExpenseDto extends PickType(CreateExpenseDto, ['categoryId'] as const){
  @IsNumber()
  cost: number;

  @IsString()
  memo:string;
}