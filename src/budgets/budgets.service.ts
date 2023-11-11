import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Budgets } from './entity/budgets.entity';
import { Repository } from 'typeorm';
import { UsersService } from "../users/users.service";
import { CategoryService } from "../category/category.service";
import { DesignBudgetDto } from "./dto/designBudget.dto";
import { Users } from "../users/entity/users.entity";

@Injectable()
export class BudgetsService {
	constructor(@InjectRepository(Budgets) private readonly budgetsRepository: Repository<Budgets>,
							private readonly usersService: UsersService,
							private readonly categoryService: CategoryService) {
	}

	/** 예산 설정 API
	 *  1.동일한 카테고리가 있는지 검색
	 *  2.만약 동일 카테고리가 있을 시 금액만 변경됨
	 *  3.동일 카테고리가 없을시 두가지 유형 있음
	 *  3-1.카테고리가 없을때  카테고리 생성 후 예산 저장
	 *  3-2.카테고리가 있을때  그냥 예산 저장
	 */
	async findByUserAndCategory(userId,categoryName): Promise<Budgets>{
		const budget = await this.budgetsRepository.findOne({
			where: {
				user: { id: userId },
				category: { name: categoryName }
			}
		});
		return budget;
	}

	async postBudget(categoryName, money, userId): Promise<Budgets> {
		const budget = await this.findByUserAndCategory(userId, categoryName);
		if (budget) {
			return await this.budgetsRepository.save({
				...budget,
				money
			});
		} else {
			const category = await this.categoryService.findCategory(categoryName);
			if (category) {
				return this.budgetsRepository.save({
					money,
					user: { id: userId },
					category: { id: category.id }
				});
			} else {
				const newCategory = await this.categoryService.createCategory(categoryName);
				return this.budgetsRepository.save({
					money,
					user: { id: userId },
					category: { id: newCategory.id }
				});
			}
		}
	}
	
	/** 예산 설계 추천 API
	 * 1.예산 설계된 유저들을 가져오고 유저들이 없으면 오류
	 * 2.모드 카테고리 목록을 가져오고 카테고리 별 비율을 넣을 객체를 하나 만들고 초기화 함
	 * 3.10% 미만은 기타에 넣어 주어야 하기 때문에 기타 키값도 초기화 함
	 * 4.예산이 설계된 유저들의 카테고리별 비율을 계산하고 처음에 초기화 된 객체에 더해줌
	 * 5.10% 미만의 비율들은 기타 카테고리에 더해줌
	 * 6.다 더해진 비율들을 예산설계된 총 인원에서 나눠주어 비율 평균을 구함 
	 * 7.카테고리 비율중 0인 것들의 키를 제거
	 * 8.나의 예산 금액에 비율을 곱하여 예산 설계 금액을 추천해줌
	 */
	async findBudgetedUser(): Promise<Users[]>{
		const users = await this.usersService.findUsersWithBudgets();
		if (users.length === 0) {
			throw new InternalServerErrorException("예산을 설계한 유저들이 없습니다.");
		}
		return users;
	}

	async getCategories():Promise<{ [key: string]: number }>{
		const categories = await this.categoryService.findCategories();
		const budgetRatio = { "기타": 0 };
		for (const category of categories) {
			budgetRatio[category.name] = 0;
		}
		return budgetRatio;
	}

	async sumRatioUsers(users): Promise<{ [key: string]: number }> {
		const budgetRatio = await this.getCategories();
		for (const user of users) {
			const totalMoney = user.budgets.reduce((total, budget) => total + budget.money, 0);
			for (const budget of user.budgets) {
				const categoryName = budget.category.name;
				const ratio = budget.money / totalMoney;
				if (ratio > 0.1) {
					budgetRatio[categoryName] = budgetRatio[categoryName] + ratio;
				} else {
					budgetRatio["기타"] = budgetRatio["기타"] + ratio;
				}
			}
		}
		for (const key in budgetRatio) {
			budgetRatio[key] = budgetRatio[key] / users.length;
			if (budgetRatio[key] === 0) {
				delete budgetRatio[key];
			}
		}
		return budgetRatio;
	}

	async designBudget(dto: DesignBudgetDto):Promise<{ [key: string]: number }> {
		const users = await this.findBudgetedUser();
		const budgetRatio = await this.sumRatioUsers(users);
		console.log("amount:" + dto.amount);
		console.log("budgetRatio" + budgetRatio);
		for (const key in budgetRatio) {
			budgetRatio[key] = Math.floor(budgetRatio[key] * dto.amount / 10000) * 10000;
		}
		let sum = 0;
		for (let key in budgetRatio) {
			sum += budgetRatio[key];
		}
		if (sum < dto.amount) {
			budgetRatio["기타"] = budgetRatio["기타"] + (dto.amount - sum);
		}
		return budgetRatio;
	}

}
