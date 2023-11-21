import { Users } from '../../users/entity/users.entity';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm'
import { Category } from '../../category/entity/category.entity';
import { ExpenseCategory } from '../../expensecategory/entity/expenses-category.entity';
import { Expenses } from '../../expenses/entity/expenses.entity';
import * as bcrypt from 'bcryptjs';
import { Budgets } from '../../budgets/entity/budgets.entity';
import { BudgetCategory } from '../../budgetcategory/entity/budgets-category.entity';
export default class InitialDatabaseSeed implements Seeder {
	async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
		const usersRepository = dataSource.getRepository(Users);
		const userData = [];
		for (let i = 1; i < 21; i++) {
			const hashedPassword = await bcrypt.hash('zxcv12345!', Number(process.env.HASH_SALT));
			userData.push({ nickname: `angiwon${i}`, password: hashedPassword });
		}
		await usersRepository.insert(userData);
		const users = await usersRepository.find();
		
		const expensesRepository = dataSource.getRepository(Expenses);
		const budgetsRepository = dataSource.getRepository(Budgets);
		
		const expenseData=[];
		const budgetData = [];
		for (let i = 0; i < users.length; i++) {
			const year=2023;
			for (let month = 10; month < 12; month++) {
				expenseData.push({
					year,
					month,
					user: {
						id: users[i].id,
					},
				});
				budgetData.push({
					year,
					month,
					user: {
						id: users[i].id,
					},
				});
			}
		}
		await budgetsRepository.insert(budgetData);
		await expensesRepository.insert(expenseData);

		const categoryRepository = dataSource.getRepository(Category);
		await categoryRepository.insert([
			{ name: '식비' },
			{ name: '교통' },
			{ name: '주거' },
			{ name: '쇼핑' },
			{ name: '취미' },
		]);
		const categories = await categoryRepository.find();
		let budgets = await budgetsRepository.find();
		const expenses = await expensesRepository.find();
		const expenseCategoryRepository = dataSource.getRepository(ExpenseCategory);
		const budgetCategoryRepository = dataSource.getRepository(BudgetCategory);
		const expenseCategoryData=[];
		const budgetCategoryData=[];
		for (let i = 0; i < budgets.length; i++) {
			const budgetId = budgets[i].id;
			for (let j = 0; j < categories.length; j++) {
				const amount = Math.round(Math.floor(Math.random() * (400000 - 200000) + 200000) / 10000) * 10000;
				const categoryId = categories[j].id;
				budgetCategoryData.push({
					amount,
					budget: {
						id: budgetId,
					},
					category: {
						id: categoryId,
					},
				});
			}
		}
		await budgetCategoryRepository.insert(budgetCategoryData);
		budgets = await budgetsRepository.find({ relations: ['budgetCategory'] });
		for (const budget of budgets) {
			let totalAmount =0;
			const budgetCategories = budget.budgetCategory;
			for (const budgetCategory of budgetCategories) {
				totalAmount += budgetCategory.amount;
			}
			await budgetsRepository.save({
				...budget,
				totalAmount
			})
		}
		
		for (let i = 0; i < expenses.length; i++) {
			for (let j = 0; j < 50; j++) {
				const cost = Math.round(Math.floor(Math.random() * (13000 - 4000) + 4000) / 100) * 100;
				const expenseId = expenses[i].id;
				const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
				const now = new Date();
				let date: number;
				if (expenses[i].month === now.getMonth() + 1) {
					date = Math.floor(Math.random() * now.getDate() + 1);
				} else {
					date = Math.floor(Math.random() * (30 - 1) + 1);
				}
				expenseCategoryData.push({
					cost,
					expense: {
						id: expenseId,
					},
					category: {
						id: categoryId,
					},
					createdAt: new Date(expenses[i].year,expenses[i].month-1, date),
					updatedAt: new Date(expenses[i].year,expenses[i].month-1, date),
				});
			}
		}
		await expenseCategoryRepository.insert(expenseCategoryData);
	}
}