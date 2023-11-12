import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Users } from '../../users/entity/users.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { BudgetsCategory } from "../../budgetsCategory/entity/budgets-category.entity";

@Entity()
export class Budgets extends BaseEntity{
	@Column()
	year: number;

	@Column()
	month: number;

	@Column()
	totalAmount: number;

	@ManyToOne(()=>Users, (user)=>user.budgets)
	user: Users;

	@OneToMany(()=> BudgetsCategory, (budgetCategory)=>budgetCategory.budget)
	budgetCategory:BudgetsCategory[];
}