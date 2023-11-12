import {
	Column,
	Entity, OneToMany
} from "typeorm";
import { BaseEntity } from "../../commons/entity/base.entity";
import { BudgetsCategory } from "../../budgetsCategory/entity/budgets-category.entity";
import { ExpensesCategory } from "../../expensesCategory/entity/expenses-category.entity";

@Entity()
export class Category extends BaseEntity {
	@Column({ unique: true})
	name: string;
	@OneToMany(() => BudgetsCategory, (BudgetsCategory) => BudgetsCategory.category)
	budgetsCategory: BudgetsCategory[];
	@OneToMany(() => ExpensesCategory, (expensesCategory) => expensesCategory.category)
	expensesCategory: ExpensesCategory[];
}