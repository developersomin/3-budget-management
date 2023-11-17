import { BaseEntity } from "../../commons/entity/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Category } from "../../category/entity/category.entity";
import { Expenses } from "../../expenses/entity/expenses.entity";

@Entity()
export class ExpenseCategory extends BaseEntity {
	@Column({ nullable: true })
	memo: string;

	@Column()
	cost: number;

	@Column({ default: false })
	isExclude: boolean;

	@ManyToOne(() => Expenses, (expense) => expense.expenseCategory)
	expense: Expenses;

	@ManyToOne(() => Category, (category) => category.expenseCategory)
	category: Category;
}
