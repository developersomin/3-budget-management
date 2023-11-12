import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Budgets } from './entity/budgets.entity';
import { Repository } from 'typeorm';
import { UsersService } from "../users/users.service";
import { CategoryService } from "../category/category.service";
import { DesignBudgetDto } from "./dto/design-budget.dto";
import { Users } from "../users/entity/users.entity";
import { BudgetCategoryService } from "../budget-category/budget-category.service";
import { CreateCategoryBudgetDto } from "./dto/create-category-budget.dto";
import { BudgetCategory } from "../budget-category/entity/budgets-category.entity";

@Injectable()
export class BudgetsService {
	constructor(@InjectRepository(Budgets) private readonly budgetsRepository: Repository<Budgets>,
							private readonly usersService: UsersService,
							private readonly categoryService: CategoryService,
							private readonly budgetCategoryService: BudgetCategoryService) {
	}

	/**
	 * 카테고리 별 예산 설정
	 * 1.월별 예산이 설정 되있는지 확인한다.
	 * 2.만약 월별 예산이 설정이 안되어있으면 생성한다.
	 * 3.카테고리 별 예산 설정할때 필요한 카테고리 이름이 존재하는지 확인한다.
	 * 4.만약 카테고리 이름이 없으면 생성한다.
	 * 5.위 사항을 다 진행하면 카테고리 ID와 예산 ID를 가져 올 수 있다.
	 * 6. 카테고리 ID와 예산 ID 로 카테고리 별 예산이 존재하는지 확인한다.
	 * 7. 만약 없으면 생성하고 리턴한다.
	 * 8. 있으면 amount 수정하고 카테고리별 amount 를 다 더해 budget의 totalamount를 계산한다.
	 * 9.
	 */
	async budgetByCategory(createCategoryBudgetDto: CreateCategoryBudgetDto, userId: string): Promise<BudgetCategory> {
		const { year, month, categoryName, amount } = createCategoryBudgetDto;
		let budget = await this.findByMonthAndUserId({ year, month }, userId);
		let budgetId = budget.id;
		if (!budget) {
			budget = await this.createBudget({ year, month }, userId);
			budgetId = budget.id;
		}
		let category = await this.categoryService.findCategory(categoryName);
		let categoryId = category.id;
		if (!category) {
			category = await this.categoryService.createCategory({
				name: categoryName
			});
			categoryId = category.id;
		}
		const findBudgetCategory = await this.budgetCategoryService.findByBudgetAndCategory(budgetId, categoryId);
		if (!findBudgetCategory) {
			const result = await this.budgetCategoryService.createBudgetCategory(amount, budgetId, categoryId);
			await this.updateTotalAmount(budget);
			return result;
		} else {
			const result = await this.budgetCategoryService.updateBudgetCategory(findBudgetCategory, amount);
			await this.updateTotalAmount(budget);
			return result;
		}
	}

	findByMonthAndUserId(budgets: Pick<Budgets, "year" | "month">, userId: string): Promise<Budgets> {
		return this.budgetsRepository.findOne({
			where: {
				year: budgets.year,
				month: budgets.month,
				user: {
					id: userId
				}
			}
		});
	}
	createBudget(budgets:Pick<Budgets, 'year'|'month'>,userId: string){
		return this.budgetsRepository.save({
			...budgets,
			user:{
				id: userId,
			},
		})
	}

	async updateTotalAmount(budget:Budgets){
		const totalAmount = budget.budgetCategory.reduce((total, budget) => total + budget.amount, 0);
		await this.budgetsRepository.save({
			...budget,
			totalAmount
		});
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
	async designBudget(dto: DesignBudgetDto):Promise<{ [key: string]: number }> {
		const users = await this.findBudgetedUser();
		const budgetRatio = await this.sumRatioUsers(users);
		console.log("amount:" + dto.totalAmount);
		console.log("budgetRatio" + budgetRatio);
		for (const key in budgetRatio) {
			budgetRatio[key] = Math.round(budgetRatio[key] * dto.totalAmount / 10000) * 10000;
		}
		let sum = 0;
		for (let key in budgetRatio) {
			sum += budgetRatio[key];
		}
		if (sum < dto.totalAmount) {
			budgetRatio["기타"] = budgetRatio["기타"] + (dto.totalAmount - sum);
		} else {
			budgetRatio["기타"] = budgetRatio["기타"] - (sum - dto.totalAmount);
		}
		return budgetRatio;
	}

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

	async sumRatioUsers(users: Users[]): Promise<{ [key: string]: number }> {
		const budgetRatio = await this.getCategories();
		for (const user of users) {
			for (const budget of user.budgets) {
				const totalAmount = budget.totalAmount;
				for (const budgetCategory of budget.budgetCategory) {
					const categoryName = budgetCategory.category.name;
					const ratio = budgetCategory.amount / totalAmount;
					if (ratio > 0.1) {
						budgetRatio[categoryName] = budgetRatio[categoryName] + ratio;
					} else {
						budgetRatio["기타"] = budgetRatio["기타"] + ratio;
					}
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
}
