import {  Column, Entity, OneToMany } from 'typeorm';
import { Budgets } from '../../budgets/entity/budgets.entity';
import { Expenses } from '../../expenses/entity/expenses.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Users extends BaseEntity{
	@Column({ unique: true})
	nickname: string;

	@Exclude()
	@Column()
	password: string;

	@OneToMany(()=>Budgets, (budget)=> budget.user)
	budgets: Budgets[]

	@OneToMany(()=>Expenses, (expense)=> expense.user)
	expenses: Expenses[];
}
