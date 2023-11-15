import { forwardRef, Module } from "@nestjs/common";
import { BudgetCategoryService } from './budget-category.service';
import { BudgetCategoryController } from './budget-category.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetCategory } from "./entity/budgets-category.entity";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { BudgetsModule } from "../budgets/budgets.module";
import { CategoryModule } from "../category/category.module";

@Module({
  imports:[TypeOrmModule.forFeature([BudgetCategory]),UsersModule,CategoryModule,forwardRef(() => BudgetsModule)],
  controllers: [BudgetCategoryController],
  providers: [BudgetCategoryService, AuthService, JwtService],
  exports: [BudgetCategoryService]
})
export class BudgetCategoryModule {}
