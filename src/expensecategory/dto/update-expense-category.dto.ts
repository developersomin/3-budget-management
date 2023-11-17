import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseCategoryDto {
	@IsString()
	@IsOptional()
	memo: string;

	@IsNumber()
	@IsOptional()
	cost: number;

	@IsBoolean()
	@IsOptional()
	isExclude: boolean;

	@IsString()
	@IsOptional()
	categoryName: string;
}