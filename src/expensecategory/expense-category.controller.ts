import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import { User } from "../commons/decorator/users.decorator";
import { CreateExpenseCategoryDto } from "./dto/create-expense-category.dto";
import { ExpenseCategory } from "./entity/expenses-category.entity";
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { UpdateExpenseCategoryDto } from "./dto/update-expense-category.dto";
import { TransactionInterceptor } from '../commons/interceptor/transaction.interceptor';
import { QueryRunnerDecorator } from '../commons/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';

@Controller('expenseCategory')
@UseGuards(AccessTokenGuard)
export class ExpenseCategoryController {
	constructor(private readonly expenseCategoryService: ExpenseCategoryService) {}

	@Post()
	@UseInterceptors(TransactionInterceptor)
	createExpenseCategory(
		@Body() createExpenseCategoryDto: CreateExpenseCategoryDto,
		@User('id') userId: string,
		@QueryRunnerDecorator() qr: QueryRunner,
	): Promise<ExpenseCategory> {
		return this.expenseCategoryService.createExpenseCategory(createExpenseCategoryDto, userId,qr);
	}

	@Get('/:expenseCategoryId')
	getExpenseCategory(@Param('expenseCategoryId') expenseCategoryId: string): Promise<ExpenseCategory> {
		return this.expenseCategoryService.getExpenseCategory(expenseCategoryId);
	}

	@Patch('/:expenseCategoryId')
	@UseInterceptors(TransactionInterceptor)
	updateExpenseCategory(
		@Param('expenseCategoryId') expenseCategoryId: string,
		@Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
		@QueryRunnerDecorator() qr: QueryRunner,
	): Promise<ExpenseCategory> {
		return this.expenseCategoryService.updateExpenseCategory(updateExpenseCategoryDto, expenseCategoryId,qr);
	}

	@Delete('/:expenseCategoryId')
	@UseInterceptors(TransactionInterceptor)
	deleteExpenseCategory(@Param('expenseCategoryId') expenseCategoryId: string,@QueryRunnerDecorator() qr: QueryRunner,): Promise<boolean> {
		return this.expenseCategoryService.deleteExpenseCategory(expenseCategoryId,qr);
	}
}
