import { forwardRef, Module } from "@nestjs/common";
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budgets } from './entity/budgets.entity';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { BudgetCategoryModule } from "../budgetcategory/budget-category.module";
import { CategoryModule } from "../category/category.module";

@Module({
  imports: [TypeOrmModule.forFeature([Budgets]), UsersModule,CategoryModule,forwardRef(() => BudgetCategoryModule)],
  controllers: [BudgetsController],
  providers: [BudgetsService,AuthService,JwtService],
  exports:[BudgetsService]
})
export class BudgetsModule {}
