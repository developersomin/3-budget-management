import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class QuerySearchDto {
  @IsDate()
  @IsNotEmpty()
  startDate: Date;
  @IsDate()
  @IsNotEmpty()
  endDate: Date;
  @IsString()
  categoryId: string;
  @IsNumber()
  minCost: number;
  @IsNumber()
  maxCost: number;
}