import {
	Column,
	Entity, OneToMany
} from "typeorm";
import { BaseEntity } from "../../commons/entity/base.entity";
import { BudgetCategory } from "../../budget-category/entity/budgets-category.entity";
import { ExpenseCategory } from "../../expense-category/entity/expenses-category.entity";

@Entity()
export class Category extends BaseEntity {
	@Column({ unique: true})
	name: string;
	@OneToMany(() => BudgetCategory, (BudgetsCategory) => BudgetsCategory.category)
	budgetsCategory: BudgetCategory[];
	@OneToMany(() => ExpenseCategory, (expensesCategory) => expensesCategory.category)
	expensesCategory: ExpenseCategory[];
}