import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class QuerySearchDto {
	@Transform(({ value }) => new Date(value))
	@IsDate({message: '예)2023-11-13 이런식으로 입력해주세요'})
	@IsNotEmpty({message: '예)2023-11-13 이런식으로 입력해주세요'})
	startDate: Date;

	@Transform(({ value }) => new Date(value))
	@IsDate({message: '예)2023-11-13 이런식으로 입력해주세요'})
	@IsNotEmpty()
	endDate: Date;

	@IsString()
	@IsOptional()
	categoryId: string;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	@IsOptional()
	minCost: number;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	@IsOptional()
	maxCost: number;
}