import {
	Column,
	Entity, OneToMany
} from "typeorm";
import { BaseEntity } from "../../commons/entity/base.entity";
import { BudgetCategory } from "../../budgetcategory/entity/budgets-category.entity";
import { ExpenseCategory } from "../../expensecategory/entity/expenses-category.entity";

@Entity()
export class Category extends BaseEntity {
	@Column({ unique: true })
	name: string;

	@OneToMany(() => BudgetCategory, (budgetCategory) => budgetCategory.category)
	budgetCategory: BudgetCategory[];

	@OneToMany(() => ExpenseCategory, (expenseCategory) => expenseCategory.category)
	expenseCategory: ExpenseCategory[];
}