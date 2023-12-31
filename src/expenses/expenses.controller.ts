import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ExpensesService } from './expenses.service';
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../commons/decorator/users.decorator";
import { QuerySearchDto } from "./dto/query-search.dto";
import {
	ICategoryByTotalCost,
	ICompareExpenseWithLastMonth,
	IExpenseGuide,
	IRecommendTodayExpense,
} from './interface/expenses-service.interface';


@Controller('expenses')
@UseGuards(AccessTokenGuard)
export class ExpensesController {
	constructor(private readonly expensesService: ExpensesService) {}

	@Get()
	findExpenses(@User('id') userId: string, @Query() querySearchDto: QuerySearchDto): Promise<ICategoryByTotalCost> {
		return this.expensesService.findExpenses(querySearchDto, userId);
	}

	@Get('/recommend')
	recommendTodayExpense(@User('id') userId: string):Promise<IRecommendTodayExpense>{
		return this.expensesService.recommendTodayExpense(userId);
	}

	@Get('/guide')
	expenseGuide(@User('id')userId:string):Promise<IExpenseGuide>{
		return this.expensesService.expenseGuide(userId);
	}

	@Get('/compared/LastMonth')
	compareExpenseWithLastMonth(@User('id')userId:string):Promise<ICompareExpenseWithLastMonth>{
		return this.expensesService.compareExpenseWithLastMonth(userId);
	}
	@Get('/compared/LastWeek')
	compareExpenseWithLastWeek(@User('id')userId:string): Promise<string>{
		return this.expensesService.compareExpenseWithLastWeek(userId);
	}
}
