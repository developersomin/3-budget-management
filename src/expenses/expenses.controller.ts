import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../users/decorator/users.decorator";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { Expenses } from "./entity/expenses.entity";
import { QuerySearchDto } from "./dto/query-search.dto";

@Controller("expenses")
@UseGuards(AccessTokenGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {
  }

  @Post()
  createExpense(@Body() createExpenseDto: CreateExpenseDto,
                @User("id") userId: string):Promise<Expenses> {
    return this.expensesService.createExpense(createExpenseDto, userId);
  }

  @Get("/:expenseId")
  getExpense(@Param("expenseId") expenseId: string):Promise<Expenses> {
    return this.expensesService.getExpense(expenseId);
  }

  @Patch("/:expenseId")
  updateExpense(@Param("expenseId") expenseId: string,
                @Body() updateExpenseDto: UpdateExpenseDto):Promise<Expenses> {
    return this.expensesService.updateExpense(updateExpenseDto, expenseId);
  }

  @Delete("/:expenseId")
  deleteExpense(@Param("expenseId") expenseId: string): Promise<boolean> {
    return this.expensesService.deleteExpense(expenseId);
  }

  @Get()
  findExpenses(@Query() querySearchDto: QuerySearchDto, @User("id") userId: string): Promise<Expenses[]> {
    return this.expensesService.findExpenses(querySearchDto, userId);
  }
}
