import { IsNotEmpty, IsNumber } from "class-validator";

export class DesignBudgetDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}