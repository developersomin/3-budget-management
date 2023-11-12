import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "../../commons/entity/base.entity";
import { Users } from "../../users/entity/users.entity";
import { Category } from "../../category/entity/category.entity";
import { Budgets } from "../../budgets/entity/budgets.entity";

@Entity()
export class BudgetsCategory extends BaseEntity{
  @Column()
  amount: number;

  @ManyToOne(() => Budgets, (budget) => budget.budgetCategory)
  budget: Budgets;

  @ManyToOne(() => Category, (category) => category.budgetsCategory)
  category: Category;
}