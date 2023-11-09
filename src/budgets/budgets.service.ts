import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budgets } from './entity/budgets.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Users } from '../users/entity/users.entity';

@Injectable()
export class BudgetsService {
	constructor(@InjectRepository(Budgets) private readonly budgetsRepository: Repository<Budgets>) {
	}

	async postBudget(categoryName,money,userId){
		/**
		 *  동일한 카테고리가 있는지 검색
		 *  만약 동일 카테고리가 있을 시 금액만 변경됨
		 *  동일 카테고리가 없을 시 생성
		 */
		const budgets = await this.budgetsRepository.findOne({
			where:{
				user: {
					id:userId
				},
				category:{
					name: categoryName,
				}
			}, relations: ['category', 'user'],
		})
		console.log(budgets);
		if (budgets) {
			return await this.budgetsRepository.save({
				...budgets,
				money,
			});
		} else {
			return this.budgetsRepository.save({
				money,
				user: {
					id: userId,
				},
				category: {
					name: categoryName,
				},
			});
		}
	}
}
