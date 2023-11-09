import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Expenses } from '../../expenses/entity/expenses.entity';
import { Budgets } from '../../budgets/entity/budgets.entity';
import { BaseEntity } from '../../commons/entity/base.entity';
import { OmitType } from '@nestjs/mapped-types';

@Entity()
export class Category {
	@PrimaryColumn()
	name: string;

	@OneToMany(()=>Expenses , (expense)=>expense.category)
	expenses: Expenses[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;
}