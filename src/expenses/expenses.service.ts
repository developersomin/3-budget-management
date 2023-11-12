import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { Repository, SelectQueryBuilder } from "typeorm";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { QuerySearchDto } from "./dto/query-search.dto";
import { UsersService } from "../users/users.service";
import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expenses) private readonly expensesRepository: Repository<Expenses>,
              private readonly usersService: UsersService) {
  }

  createExpense(createExpenseDto: CreateExpenseDto, userId: string): Promise<Expenses> {
    const { cost, memo, categoryId } = createExpenseDto;
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

  async deleteExpense(expenseId: string): Promise<boolean> {
    const result = await this.expensesRepository.softDelete({ id: expenseId });
    return result.affected ? true : false;
  }

  getExpense(expenseId: string): Promise<Expenses> {
    return this.expensesRepository.findOne({ where: { id: expenseId }, relations: ["user", "category"] });
  }
  innerJoinUserAndCategoryQuery(qb: SelectQueryBuilder<Expenses>,userId:string){
  qb.innerJoinAndSelect("expenses.user", "user")
      .innerJoinAndSelect("expenses.category", "category")
      .where("user.id = :userId", { userId });
  }

  betweenDateQuery(qb: SelectQueryBuilder<Expenses>, startDate: Date, endDate: Date) {
      qb.andWhere("expenses.createdAt >= :startDate", { startDate })
      .andWhere("expenses.createdAt <= :endDate", { endDate });
  }

  findCategoryQuery(qb: SelectQueryBuilder<Expenses>, categoryId: string) {
    if (categoryId) {
      qb.andWhere("category.id = :categoryId", { categoryId });
    }
  }

  minMaxCostQuery(qb: SelectQueryBuilder<Expenses>, minCost: number, maxCost: number) {
    if (minCost) {
      qb.andWhere("expenses.cost > :minCost", { minCost });
    }
    if (maxCost) {
      qb.andWhere("expenses.cost < :maxCost", { maxCost });
    }
  }

  findExpenses(querySearchDto: QuerySearchDto, userId: string): Promise<Expenses[]> {
    const { startDate, endDate, categoryId, minCost, maxCost } = querySearchDto;
    const qb = this.expensesRepository.createQueryBuilder("expenses")
    this.innerJoinUserAndCategoryQuery(qb, userId);
    this.betweenDateQuery(qb, startDate, endDate);
    this.findCategoryQuery(qb, categoryId);
    this.minMaxCostQuery(qb, minCost, maxCost);

    qb.addSelect("SUM(expenses.cost) as categorySum")
      .addSelect("SUM(expenses.cost) as totalExpense")
      .groupBy("category.id, expenses.id");

    return qb.getRawMany();
  }

  /**
   * ### 오늘 지출 안내(API)
   *
   * - 오늘 지출한 내용을 `총액` 과 `카테고리 별 금액` 을 알려줍니다.
   * - `월별`설정한 예산 기준 `카테고리 별` 통계 제공
   *     - 일자기준 오늘 `적정 금액` : 오늘 기준 사용했으면 적절했을 금액
   *     - 일자기준 오늘 `지출 금액` : 오늘 기준 사용한 금액
   *     - `위험도` : 카테고리 별 적정 금액, 지출금액의 차이를 위험도로 나타내며 %(퍼센테이지) 입니다.
   *         - ex) 오늘 사용하면 적당한 금액 10,000원/ 사용한 금액 20,000원 이면 200%
   * - **선택 구현 기능)** 매일 20:00 시 알림 발송
   *     - Scheduler 까지만 구현하셔도 좋습니다.
   *     - Discord webhook, 이메일, 카카오톡 등 실제 알림까지 진행하셔도 좋습니다.
   */

  async todayTotalCost(userId:string,now:Date){
    //const qb = await this.expensesRepository.createQueryBuilder("expenses");
    now.setHours(0, 0, 0, 0);
    const qb = this.expensesRepository.createQueryBuilder("expenses")
    this.innerJoinUserAndCategoryQuery(qb, userId);
    this.betweenDateQuery(qb, now, null);
    const todayExpenses = await qb.addSelect("category.name", "categoryName")
      .addSelect("SUM(expenses.cost)", "categorySum")
      .groupBy("category.id")
      .getRawMany();
    const categoryNames = todayExpenses.map(item => ({
      categoryName: item.categoryName,
      categorySum: item.categorySum
    }));


    for (const expense of todayExpenses) {

    }
    const todayTotalCost = todayExpenses.reduce((total, expense) => total + expense.cost, 0);
    return todayTotalCost;
  }
  daysRemainingInMonth(now:Date): number {
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - now.getDate();
    return daysRemaining;
  }
  
  async untilYesterdayTotalCost(now:Date,userId:string){
    const qb = this.expensesRepository.createQueryBuilder("expenses");
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    this.betweenDateQuery(qb, firstDay, yesterday);
    const expenses = await qb.getMany();
    const untilYesterdayTotalCost = expenses.reduce((total, expense) => total + expense.cost, 0);
    return untilYesterdayTotalCost;
  }
  
  async informTodayExpense(userId:string){
    const now = new Date();
    //오늘 하루 비용 총액
    const todayTotalCost = await this.todayTotalCost(userId,now);
    const user = await this.usersService.findOne({ id: userId });
    //예산 총액
    const totalMoney = user.budgets.reduce((total, budget) => total + budget.money, 0);
    //1일부터 어제까지 비용 총액
    const untilYesterdayTotalCost = await this.untilYesterdayTotalCost(now, userId);
    //남은 일
    const remainingDays = this.daysRemainingInMonth(now);
    //(예산 총액 - 어제까지 쓴 비용 총액) / 남은 일
    const properCost = (totalMoney-untilYesterdayTotalCost)/remainingDays;
    return {
      '일자기준 오늘 적정 금액': properCost,
      '일자기준 오늘 지출 금액': todayTotalCost,
    }

  }
}
