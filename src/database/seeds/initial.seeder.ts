import { Users } from '../../users/entity/users.entity';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm'
import { Category } from '../../category/entity/category.entity';
import { ExpenseCategory } from '../../expensecategory/entity/expenses-category.entity';
import { Expenses } from '../../expenses/entity/expenses.entity';

export default class InitialDatabaseSeed implements Seeder {
	async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
		const usersRepository = dataSource.getRepository(Users);
		const userData = [];
		for (let i = 1; i < 21; i++) {
			userData.push({ nickname: `angiwon${i}`, password: 'zxcv12345!' });
		}
		await usersRepository.insert(userData);
		const users = await usersRepository.find();
		const expensesRepository = dataSource.getRepository(Expenses);
		console.log('users완료');

		const expenseData=[];
		for (let i = 0; i < users.length; i++) {
			const year=2023;
			for (let month = 9; month < 11; month++) {
				expenseData.push({
					year,
					month,
					user: {
						id: users[i].id,
					},
				});
			}
		}
		await expensesRepository.insert(expenseData);
		console.log('expenseData');
		const categoryRepository = dataSource.getRepository(Category);
		await categoryRepository.insert([
			{ name: '식비' },
			{ name: '교통' },
			{ name: '주거' },
			{ name: '쇼핑' },
			{ name: '취미' },
		]);
		console.log('category');
		const categories = await categoryRepository.find();
		const expenses = await expensesRepository.find();
		const expenseCategoryRepository = dataSource.getRepository(ExpenseCategory);
		const expenseCategoryData=[];
		for (let i = 0; i < expenses.length; i++) {
			for (let j = 0; j < 50; j++) {
				const cost = Math.round(Math.floor(Math.random() * (20000 - 100) + 100) / 100) * 100;
				const expenseId = expenses[i].id;
				const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
				expenseCategoryData.push({
					cost,
					expense: {
						id: expenseId,
					},
					category: {
						id: categoryId,
					},
				});
			}
		}
		await expenseCategoryRepository.insert(expenseCategoryData);
		console.log('우ㅏㅗㄴ료');
	}
}