import { Module } from "@nestjs/common";
import { ExpenseCategoryService } from './expense-category.service';
import { ExpenseCategoryController } from './expense-category.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExpenseCategory } from "./entity/expenses-category.entity";
import { CategoryModule } from "../category/category.module";
import { ExpensesModule } from "../expenses/expenses.module";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";

@Module({
  imports:[TypeOrmModule.forFeature([ExpenseCategory]),UsersModule,CategoryModule,ExpensesModule],
  controllers: [ExpenseCategoryController],
  providers: [ExpenseCategoryService,AuthService,JwtService],
  exports: [ExpenseCategoryService]
})
export class ExpenseCategoryModule {}
