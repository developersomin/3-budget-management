import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budgets } from './entity/budgets.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UsersService } from "../users/users.service";
import { CategoryService } from "../category/category.service";
import { DesignBudgetDto } from "./dto/design-budget.dto";
import { Users } from "../users/entity/users.entity";
import { BudgetCategoryService } from "../budgetcategory/budget-category.service";
import { ICalcProperBudget } from "./interface/budget-service.interface";
import { BudgetCategory } from '../budgetcategory/entity/budgets-category.entity';

@Injectable()
export class BudgetsService {
	constructor(
		@InjectRepository(Budgets) private readonly budgetsRepository: Repository<Budgets>,
		private readonly usersService: UsersService,
		private readonly categoryService: CategoryService,
		@Inject(forwardRef(() => BudgetCategoryService)) private readonly budgetCategoryService: BudgetCategoryService,
	) {}

	getRepository(qr?: QueryRunner): Repository<Budgets> {
		return qr ? qr.manager.getRepository<Budgets>(Budgets) : this.budgetsRepository;
	}

	getBudget(budgetId: string): Promise<Budgets> {
		return this.budgetsRepository.findOne({ where: { id: budgetId }, relations: ['budgetCategory'] });
	}

	findBudget(year: number, month: number, userId: string, qr?: QueryRunner): Promise<Budgets> {
		const repository = this.getRepository(qr);
		return repository.findOne({
			where: {
				year,
				month,
				user: {
					id: userId,
				},
			},
		});
	}

	findByMonthAndUserId(budgets: Pick<Budgets, 'year' | 'month'>, userId: string, qr?: QueryRunner): Promise<Budgets> {
		const repository = this.getRepository(qr);
		return repository
			.createQueryBuilder('budgets')
			.innerJoinAndSelect('budgets.user', 'user')
			.innerJoinAndSelect('budgets.budgetCategory', 'budgetCategory')
			.innerJoinAndSelect('budgetCategory.category', 'category')
			.where('user.id = :userId', { userId })
			.andWhere('budgets.year = :year', { year: budgets.year })
			.andWhere('budgets.month = :month', { month: budgets.month })
			.getOne();
	}

	async createBudget(budgets: Pick<Budgets, 'year' | 'month'>, userId: string, qr?: QueryRunner): Promise<Budgets> {
		const repository = this.getRepository(qr);
		const result = await repository.save({
			year: budgets.year,
			month: budgets.month,
			user: {
				id: userId,
			},
		});
		return result;
	}

	updateTotalAmount(budget: Budgets, totalAmount: number, qr?: QueryRunner): Promise<Budgets> {
		const repository = this.getRepository(qr);
		return repository.save({
			...budget,
			totalAmount,
		});
	}

	calcProperBudget(budget: Budgets, lastDayCount: number, day: number): ICalcProperBudget {
		const totalAmount = budget.totalAmount;
		const todayProperAmount = (totalAmount / lastDayCount) * day;

		const budgetCategories = budget.budgetCategory;
		const todayBudgetByCategory = {};
		for (const budgetCategory of budgetCategories) {
			const properAmountByCategory = (budgetCategory.amount / totalAmount) * todayProperAmount;
			const categoryName = budgetCategory.category.name;
			todayBudgetByCategory[categoryName] = properAmountByCategory;
		}
		return { ...todayBudgetByCategory, todayProperAmount };
	}

	/** 예산 설계 추천 API
	 * 1.예산 설계된 유저들을 가져오고 유저들이 없으면 오류
	 * 2.모드 카테고리 목록을 가져오고 카테고리 별 비율을 넣을 객체를 하나 만들고 초기화 함
	 * 3.10% 미만은 기타에 넣어 주어야 하기 때문에 기타 키값도 초기화 함
	 * 4.예산이 설계된 유저들의 카테고리별 비율을 계산하고 처음에 초기화 된 객체에 더해줌
	 * 5.10% 미만의 비율들은 기타 카테고리에 더해줌
	 * 6.다 더해진 비율들을 예산설계된 총 인원에서 나눠주어 비율 평균을 구함
	 * 7.카테고리 비율중 0인 것들의 키를 제거
	 * 8.나의 총 예산 금액에 비율을 곱하여 예산 설계 금액을 추천해줌
	 * 9.만원 단위로 반올림 했기 때문에 차이가 조금 있음 이 부분은 차이난 만큼 기타에서 빼주고 더해줌
	 */
	async designBudget(dto: DesignBudgetDto, userId: string, qr: QueryRunner): Promise<BudgetCategory[]> {
		const { year, month, totalAmount } = dto;
		const users = await this.findBudgetedUser();
		const budgetRatio = await this.sumRatioUsers(users);
		for (const key in budgetRatio) {
			budgetRatio[key] = Math.floor((budgetRatio[key] * totalAmount) / 1000) * 1000;
		}
		let sum = 0;
		for (let key in budgetRatio) {
			sum += budgetRatio[key];
		}
		const floorValue = totalAmount - sum;
		const keyArray = Object.keys(budgetRatio);
		budgetRatio[keyArray[0]] += floorValue;
		for (let key in budgetRatio) {
			await this.budgetCategoryService.budgetByCategory(
				{
					year,
					month,
					categoryName: key,
					amount: budgetRatio[key],
				},
				userId,
				qr,
			);
		}
		const budget = await this.findByMonthAndUserId({ year, month }, userId, qr);
		return budget.budgetCategory;
	}

	async findBudgetedUser(): Promise<Users[]> {
		const users = await this.usersService.findUsersWithBudgets();
		if (users.length === 0) {
			throw new InternalServerErrorException('예산을 설계한 유저들이 없습니다.');
		}
		return users;
	}

	async getCategories(): Promise<{ [key: string]: number }> {
		const categories = await this.categoryService.findCategories();
		const budgetRatio = {};
		for (const category of categories) {
			budgetRatio[category.name] = 0;
		}
		budgetRatio['기타'] = 0;
		return budgetRatio;
	}

	async sumRatioUsers(users: Users[]): Promise<{ [key: string]: number }> {
		const budgetRatio = await this.getCategories();
		let count = 0;
		for (const user of users) {
			for (const budget of user.budgets) {
				const totalAmount = budget.totalAmount;
				for (const budgetCategory of budget.budgetCategory) {
					const categoryName = budgetCategory.category.name;
					const ratio = budgetCategory.amount / totalAmount;
					if (ratio > 0.1) {
						budgetRatio[categoryName] = budgetRatio[categoryName] + ratio;
					} else {
						budgetRatio['기타'] = budgetRatio['기타'] + ratio;
					}
				}
				count++;
			}
		}
		for (const key in budgetRatio) {
			budgetRatio[key] = budgetRatio[key] / count;
			console.log(budgetRatio[key]);
			if (budgetRatio[key] === 0) {
				delete budgetRatio[key];
			}
		}
		return budgetRatio;
	}
}
