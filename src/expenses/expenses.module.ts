import { forwardRef, Module } from "@nestjs/common";
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { BudgetsModule } from "../budgets/budgets.module";
import { ExpenseCategory } from "../expensecategory/entity/expenses-category.entity";
import { ExpenseCategoryModule } from "../expensecategory/expense-category.module";

@Module({
  imports: [TypeOrmModule.forFeature([Expenses]), UsersModule,BudgetsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService,AuthService,JwtService],
  exports: [ExpensesService]
})
export class ExpensesModule {}
