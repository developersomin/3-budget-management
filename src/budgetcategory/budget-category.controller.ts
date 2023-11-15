import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { BudgetCategoryService } from './budget-category.service';
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../users/decorator/users.decorator";
import { BudgetCategory } from "./entity/budgets-category.entity";
import { CreateCategoryBudgetDto } from "./dto/create-category-budget.dto";

@Controller('budgetCategory')
export class BudgetCategoryController {
	constructor(private readonly budgetCategoryService: BudgetCategoryService) {}

	@Post()
	@UseGuards(AccessTokenGuard)
	postBudget(
		@Body() createCategoryBudgetDto: CreateCategoryBudgetDto,
		@User('id') userId: string,
	): Promise<BudgetCategory> {
		return this.budgetCategoryService.budgetByCategory(createCategoryBudgetDto, userId);
	}
}
