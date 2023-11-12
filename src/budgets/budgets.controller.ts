import { Body, Controller, ParseFloatPipe, Post, UseGuards } from "@nestjs/common";
import { BudgetsService } from './budgets.service';
import { AccessTokenGuard } from '../auth/guard/jwt-token.guard';
import { User } from '../users/decorator/users.decorator';
import { DesignBudgetDto } from "./dto/design-budget.dto";
import { CreateCategoryBudgetDto } from "./dto/create-category-budget.dto";
import { BudgetCategory } from "../budget-category/entity/budgets-category.entity";

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  postBudget(@Body() createCategoryBudgetDto: CreateCategoryBudgetDto, @User("id") userId: string): Promise<BudgetCategory> {
    return this.budgetsService.budgetByCategory(createCategoryBudgetDto, userId);
  }

  @Post("/recommend")
  designBudget(@Body()designBudgetDto:DesignBudgetDto) {
    return this.budgetsService.designBudget(designBudgetDto);
  }
}
