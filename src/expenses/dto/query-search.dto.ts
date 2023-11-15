import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class QuerySearchDto {
	@Transform(({ value }) => new Date(value), { toClassOnly: true })
	@IsDate()
	@IsNotEmpty()
	startDate: Date;

	@Transform(({ value }) => new Date(value), { toClassOnly: true })
	@IsDate()
	@IsNotEmpty()
	endDate: Date;

	@IsString()
	@IsOptional()
	categoryId: string;

	@IsNumber()
	@IsOptional()
	minCost: number;

	@IsNumber()
	@IsOptional()
	maxCost: number;
}