import { Column, Entity, ManyToOne, OneToMany, Unique } from "typeorm";
import { Users } from '../../users/entity/users.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { ExpenseCategory } from "../../expensecategory/entity/expenses-category.entity";

@Entity()
@Unique(['year', 'month', 'user'])
export class Expenses extends BaseEntity {
	@Column()
	year: number;

	@Column()
	month: number;

	@Column({ default: 0 })
	totalCost: number;

	@ManyToOne(() => Users, (user) => user.expenses)
	user: Users;

	@OneToMany(() => ExpenseCategory, (expenseCategory) => expenseCategory.expense)
	expenseCategory: ExpenseCategory[];
}