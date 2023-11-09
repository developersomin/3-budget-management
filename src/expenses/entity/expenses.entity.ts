import {  Column, Entity, ManyToOne } from 'typeorm';
import { Users } from '../../users/entity/users.entity';
import { Category } from '../../category/entity/category.entity';
import { BaseEntity } from '../../commons/entity/base.entity';

@Entity()
export class Expenses extends BaseEntity{
	@Column()
	memo: string;

	@Column()
	cost: number;

	@ManyToOne(()=>Users, (user)=>user.expenses)
	user: Users;

	@ManyToOne(() => Category, (category) => category.expenses)
	category: Category;
}