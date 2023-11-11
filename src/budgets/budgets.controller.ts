import { Body, Controller, ParseFloatPipe, Post, UseGuards } from "@nestjs/common";
import { BudgetsService } from './budgets.service';
import { AccessTokenGuard } from '../auth/guard/jwt-token.guard';
import { User } from '../users/decorator/users.decorator';
import { DesignBudgetDto } from "./dto/designBudget.dto";

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async postBudget(@Body('categoryName') categoryName: string, @Body('money') money: number, @User('id') userId: string) {
    return this.budgetsService.postBudget(categoryName,money,userId);
  }

  @Post("/recommend")
  async designBudget(@Body()designBudgetDto:DesignBudgetDto) {
    return this.budgetsService.designBudget(designBudgetDto);
  }
}
