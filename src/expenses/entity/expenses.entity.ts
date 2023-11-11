import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
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

	@JoinColumn()
	@ManyToOne(() => Category, (category) => category.expenses, { onDelete: 'CASCADE' })
	category: Category;
}