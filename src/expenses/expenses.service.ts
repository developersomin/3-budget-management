import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { Repository } from "typeorm";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { QuerySearchDto } from "./dto/query-search.dto";

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expenses) private readonly expensesRepository: Repository<Expenses>) {}

  createExpense(createExpenseDto: CreateExpenseDto,userId:string):Promise<Expenses> {
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

  async updateExpense(updateExpenseDto: UpdateExpenseDto, expenseId: string): Promise<Expenses> {
    const { categoryId, memo, cost } = updateExpenseDto;
    const expense = await this.getExpense(expenseId);
    if (!expense) {
      throw new BadRequestException("수정할 지출 내역이 존재하지 않습니다.");
    }
    return this.expensesRepository.save({
      ...expense,
      memo,
      cost
    });
  }

  async deleteExpense(expenseId:string): Promise<boolean> {
    const result = await this.expensesRepository.softDelete({ id: expenseId });
    return result.affected ? true : false;
  }

  getExpense(expenseId:string): Promise<Expenses> {
    return this.expensesRepository.findOne({ where: { id: expenseId }, relations: ["user", "category"] });
  }

  findExpenses(querySearchDto: QuerySearchDto, userId: string): Promise<Expenses[]> {
    const { startDate, endDate, categoryId, minCost, maxCost } = querySearchDto;
    const qb = this.expensesRepository.createQueryBuilder("expenses")
      .innerJoinAndSelect("expenses.user", "user")
      .where("user.id = :userId", { userId })
      .andWhere("expenses.date BETWEEN :startDate AND :endDate", { startDate, endDate });

    if (categoryId) {
      qb.innerJoinAndSelect("expenses.category", "category")
        .andWhere("category.id = :categoryId", { categoryId });
    }
    if (minCost) {
      qb.andWhere("expenses.cost > :minCost", { minCost });
    }
    if (maxCost) {
      qb.andWhere("expenses.cost < :maxCost", { maxCost });
    }

    qb.addSelect("SUM(expenses.cost) as categorySum")
      .addSelect("SUM(expenses.cost) as totalExpense")
      .groupBy("category.id, expenses.id");

    return qb.getMany();
  }
}
