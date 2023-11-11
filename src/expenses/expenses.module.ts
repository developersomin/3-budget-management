import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Expenses } from "./entity/expenses.entity";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Expenses]), UsersModule],
  controllers: [ExpensesController],
  providers: [ExpensesService,AuthService,JwtService],
})
export class ExpensesModule {}
