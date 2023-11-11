import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Category } from '../../category/entity/category.entity';
import { Users } from '../../users/entity/users.entity';
import { BaseEntity } from '../../commons/entity/base.entity';

@Entity()
export class Budgets extends BaseEntity{
	@Column()
	money: number;

	@ManyToOne(()=>Users, (user)=>user.budgets)
	user: Users;

	@ManyToOne(() => Category, (category) => category.budgets,{ onDelete: 'CASCADE' })
	category: Category;
}