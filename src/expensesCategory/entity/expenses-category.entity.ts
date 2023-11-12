import { BaseEntity } from "../../commons/entity/base.entity";
import { Column, ManyToOne } from "typeorm";
import { Budgets } from "../../budgets/entity/budgets.entity";
import { Category } from "../../category/entity/category.entity";
import { Expenses } from "../../expenses/entity/expenses.entity";

export class ExpensesCategory extends BaseEntity{
  @Column({nullable:true})
  memo: string;

  @Column()
  cost: number;

  @ManyToOne(() => Expenses, (expense) => expense.expensesCategory)
  expense: Expenses;

  @ManyToOne(() => Category, (category) => category.expensesCategory)
  category: Category;
}
