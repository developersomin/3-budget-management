import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ExpenseCategoryService } from './expense-category.service';
import { User } from "../users/decorator/users.decorator";
import { Expenses } from "../expenses/entity/expenses.entity";
import { CreateExpenseCategoryDto } from "./dto/create-expense-category.dto";
import { ExpenseCategory } from "./entity/expenses-category.entity";
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { UpdateExpenseCategoryDto } from "./dto/update-expense-category.dto";

@Controller('expenseCategory')
@UseGuards(AccessTokenGuard)
export class ExpenseCategoryController {
	constructor(private readonly expenseCategoryService: ExpenseCategoryService) {}

	@Post()
	createExpenseCategory(
		@Body() createExpenseCategoryDto: CreateExpenseCategoryDto,
		@User('id') userId: string,
	): Promise<ExpenseCategory> {
		return this.expenseCategoryService.createExpenseCategory(createExpenseCategoryDto, userId);
	}

	@Get('/:expenseCategoryId')
	getExpenseCategory(@Param('expenseCategoryId') expenseCategoryId: string): Promise<ExpenseCategory> {
		return this.expenseCategoryService.getExpenseCategory(expenseCategoryId);
	}

	@Patch('/:expenseCategoryId')
	updateExpenseCategory(
		@Param('expenseCategoryId') expenseCategoryId: string,
		@Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
	): Promise<ExpenseCategory> {
		return this.expenseCategoryService.updateExpenseCategory(updateExpenseCategoryDto, expenseCategoryId);
	}

	@Delete('/:expenseCategoryId')
	deleteExpenseCategory(@Param('expenseCategoryId') expenseCategoryId: string): Promise<boolean> {
		return this.expenseCategoryService.deleteExpenseCategory(expenseCategoryId);
	}
}
