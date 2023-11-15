import { IsNotEmpty, IsNumber, Length, Max, Min } from "class-validator";

export class DesignBudgetDto {
	@IsNotEmpty({ message: 'totalAmount 는 필수 입력 필드입니다.' })
	@IsNumber()
	totalAmount: number;

    @IsNotEmpty({ message: 'year 는 필수 입력 필드입니다.' })
	@IsNumber()
	@Min(2000, { message: '예를 들어 2023 같은 형식으로 입력하세요' })
	year: number;

	@IsNotEmpty({ message: 'month 는 필수 입력 필드입니다.' })
	@IsNumber()
	@Min(1, { message: '1~12 숫자를 입력하세요' })
	@Max(12, { message: '1~12 숫자를 입력하세요' })
	month: number;
}