import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

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

	@Transform(({ value }) => new Date(value), { toClassOnly: true })
	@IsDate({message: '예) 2023-11-13 <- 이런식으로 입력하세요'})
	@IsNotEmpty({ message: 'createdAt 는 필수 입력 필드입니다.' })
	createdAt: Date;
}