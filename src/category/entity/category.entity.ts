import {  Column, Entity, OneToMany } from 'typeorm';
import { Expenses } from '../../expenses/entity/expenses.entity';
import { Budgets } from '../../budgets/entity/budgets.entity';
import { BaseEntity } from '../../commons/entity/base.entity';

@Entity()
export class Category extends BaseEntity{
	@Column()
	name: string;

	@OneToMany(()=>Expenses , (expense)=>expense.category)
	expenses: Expenses[];

	@OneToMany(()=>Budgets , (budget)=>budget.category)
	budgets: Budgets[];
}