import { Body, Controller, ParseFloatPipe, Post, UseGuards } from "@nestjs/common";
import { BudgetsService } from './budgets.service';
import { DesignBudgetDto } from "./dto/design-budget.dto";
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../users/decorator/users.decorator";
import { BudgetCategory } from "../budgetcategory/entity/budgets-category.entity";
import { QueryRunnerDecorator } from '../commons/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';

@Controller('budgets')
export class BudgetsController {
	constructor(private readonly budgetsService: BudgetsService) {}

	@Post('/recommend')
	@UseGuards(AccessTokenGuard)
	designBudget(
		@Body() designBudgetDto: DesignBudgetDto,
		@User('id') userId: string,
		@QueryRunnerDecorator() qr: QueryRunner,
	): Promise<BudgetCategory[]> {
		return this.budgetsService.designBudget(designBudgetDto, userId, qr);
	}
}
