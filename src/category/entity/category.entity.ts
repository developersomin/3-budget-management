import {
	Column,
	Entity, OneToMany
} from "typeorm";
import { BaseEntity } from "../../commons/entity/base.entity";
import { Budgets } from "../../budgets/entity/budgets.entity";
import { Expenses } from "../../expenses/entity/expenses.entity";

@Entity()
export class Category extends BaseEntity {
	@Column({ unique: true})
	name: string;
	@OneToMany(() => Budgets, (budget) => budget.category)
	budgets: Budgets[];
	@OneToMany(() => Expenses, (expense) => expense.category)
	expenses: Expenses[];
}