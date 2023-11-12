import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { Users } from '../../users/entity/users.entity';
import { Category } from '../../category/entity/category.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { ExpensesCategory } from "../../expensesCategory/entity/expenses-category.entity";

@Entity()
export class Expenses extends BaseEntity{

	@Column()
	year: number;

	@Column()
	month: number;

	@Column()
	totalCost: number;

	@ManyToOne(()=>Users, (user)=>user.expenses)
	user: Users;

	@OneToMany(() => ExpensesCategory, (expensesCategory) => expensesCategory.expense)
	expensesCategory: ExpensesCategory[];
}