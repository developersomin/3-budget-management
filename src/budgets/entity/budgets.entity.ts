import { Column, Entity, ManyToOne, OneToMany, Unique } from "typeorm";
import { Users } from '../../users/entity/users.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { BudgetCategory } from "../../budget-category/entity/budgets-category.entity";

@Entity()
@Unique(['year','month'])
export class Budgets extends BaseEntity{
	@Column()
	year: number;

	@Column()
	month: number;

	@Column({nullable:true})
	totalAmount: number;

	@ManyToOne(()=>Users, (user)=>user.budgets)
	user: Users;

	@OneToMany(()=> BudgetCategory, (budgetCategory)=>budgetCategory.category)
	budgetCategory:BudgetCategory[];
}