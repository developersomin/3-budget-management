import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { AccessTokenGuard } from '../auth/guard/jwt-token.guard';
import { User } from '../users/decorator/users.decorator';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  postBudget(@Body('categoryName') categoryName: string, @Body('money') money: number, @User('id') userId: string) {
    return this.budgetsService.postBudget(categoryName,money,userId);
  }
}
