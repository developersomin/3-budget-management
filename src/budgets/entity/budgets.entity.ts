import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Users } from '../../users/entity/users.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { BudgetCategory } from "../../budgetcategory/entity/budgets-category.entity";

@Entity()
@Unique(['year', 'month', 'user'])
export class Budgets extends BaseEntity {
	@Column()
	year: number;

	@Column()
	month: number;

	@Column({ default: 0 })
	totalAmount: number;

	@ManyToOne(() => Users, (user) => user.budgets)
	user: Users;

	@OneToMany(() => BudgetCategory, (budgetCategory) => budgetCategory.budget)
	budgetCategory: BudgetCategory[];
}