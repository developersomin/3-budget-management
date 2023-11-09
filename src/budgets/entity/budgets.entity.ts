import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from '../../category/entity/category.entity';
import { Users } from '../../users/entity/users.entity';

@Entity()
export class Budgets{
	@Column()
	money: string;

	@ManyToOne(()=>Users, (user)=>user.budgets)
	user: Users;

	@ManyToOne(()=>Category, (category)=>category.budgets)
	category:Category;
}