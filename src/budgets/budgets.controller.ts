import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { DesignBudgetDto } from "./dto/design-budget.dto";
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../commons/decorator/users.decorator";
import { QueryRunnerDecorator } from '../commons/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from '../commons/interceptor/transaction.interceptor';
import { Budgets } from './entity/budgets.entity';
import { BudgetCategory } from '../budgetcategory/entity/budgets-category.entity';

@Controller('budgets')
export class BudgetsController {
	constructor(private readonly budgetsService: BudgetsService) {}

	@Post('/recommend')
	@UseGuards(AccessTokenGuard)
	@UseInterceptors(TransactionInterceptor)
	designBudget(
		@Body() designBudgetDto: DesignBudgetDto,
		@User('id') userId: string,
		@QueryRunnerDecorator() qr: QueryRunner,
	): Promise<BudgetCategory[]> {
		return this.budgetsService.designBudget(designBudgetDto, userId, qr);
	}
}
