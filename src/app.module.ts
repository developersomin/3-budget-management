import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from './users/users.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { BudgetCategoryModule } from './budgetcategory/budget-category.module';
import { ExpenseCategoryModule } from './expensecategory/expense-category.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
      entities: [__dirname + "/**/*.entity.*"],
      synchronize: true,
      logging: true
    }),
    UsersModule,
    BudgetsModule,
    ExpensesModule,
    CategoryModule,
    AuthModule,
    BudgetCategoryModule,
    ExpenseCategoryModule,
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
