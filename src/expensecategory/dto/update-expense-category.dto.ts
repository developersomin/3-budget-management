import {  IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateExpenseCategoryDto {
	@IsString()
	@IsOptional()
	memo: string;

	@IsNumber()
	@IsOptional()
	cost: number;

	@IsString()
	@IsOptional()
	categoryName: string;
}