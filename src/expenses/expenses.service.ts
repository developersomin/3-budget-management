import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { Repository } from "typeorm";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expenses) private readonly expensesRepository: Repository<Expenses>) {}

  createExpense(createExpenseDto: CreateExpenseDto,userId:string) {
    const { cost, memo,categoryId } = createExpenseDto;
    return this.expensesRepository.save({
      cost,
      memo,
      user: {
        id: userId
      },
      category: {
        id: categoryId
      }
    });
  }

  updateExpense(updateExpenseDto: UpdateExpenseDto,userId:string){

  }

}
