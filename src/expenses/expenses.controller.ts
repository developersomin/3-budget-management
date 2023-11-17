import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ExpensesService } from './expenses.service';
import { AccessTokenGuard } from "../auth/guard/jwt-token.guard";
import { User } from "../commons/decorator/users.decorator";
import { QuerySearchDto } from "./dto/query-search.dto";
import { ICategoryByTotalCost } from "./interface/expenses-service.interface";


@Controller('expenses')
@UseGuards(AccessTokenGuard)
export class ExpensesController {
	constructor(private readonly expensesService: ExpensesService) {}

	@Get()
	findExpenses(@User('id') userId: string, @Query() querySearchDto: QuerySearchDto): Promise<ICategoryByTotalCost> {
		return this.expensesService.findExpenses(querySearchDto, userId);
	}

	@Get('/guide')
	expenseGuide(@User('id')userId:string){
		return this.expensesService.expenseGuide(userId);
	}
}
