import { Column, Entity, ManyToOne } from 'typeorm';
import { Users } from '../../users/entity/users.entity';
import { Category } from '../../category/entity/category.entity';

@Entity()
export class Expenses{
	@Column()
	memo: string;

	@Column()
	cost: number;

	@ManyToOne(()=>Users, (user)=>user.expenses)
	user: Users;

	@ManyToOne(() => Category, (category) => category.expenses)
	category: Category;
}