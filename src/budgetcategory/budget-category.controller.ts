import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { BudgetCategoryService } from './budget-category.service';
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../commons/decorator/users.decorator";
import { BudgetCategory } from "./entity/budgets-category.entity";
import { CreateCategoryBudgetDto } from "./dto/create-category-budget.dto";
import { TransactionInterceptor } from '../commons/interceptor/transaction.interceptor';
import { QueryRunnerDecorator } from '../commons/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';

@Controller('budgetCategory')
export class BudgetCategoryController {
	constructor(private readonly budgetCategoryService: BudgetCategoryService) {}

	@Post()
	@UseGuards(AccessTokenGuard)
	@UseInterceptors(TransactionInterceptor)
	postBudget(
		@Body() createCategoryBudgetDto: CreateCategoryBudgetDto,
		@User('id') userId: string,
		@QueryRunnerDecorator() qr: QueryRunner,
	): Promise<BudgetCategory> {
		return this.budgetCategoryService.budgetByCategory(createCategoryBudgetDto, userId, qr);
	}
}
