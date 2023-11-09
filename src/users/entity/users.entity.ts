import { Column, Entity, OneToMany } from 'typeorm';
import { Budgets } from '../../budgets/entity/budgets.entity';
import { Expenses } from '../../expenses/entity/expenses.entity';

@Entity()
export class Users {
	@Column({ unique: true})
	nickname: string;

	@Column()
	password: string;

	@OneToMany(()=>Budgets, (budget)=> budget.user)
	budgets: Budgets[]

	@OneToMany(()=>Expenses, (expense)=> expense.user)
	expenses: Expenses[];
}