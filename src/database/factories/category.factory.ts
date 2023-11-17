import { setSeederFactory } from 'typeorm-extension';
import { ExpenseCategory } from '../../expensecategory/entity/expenses-category.entity';

export default setSeederFactory(ExpenseCategory, () => {
	const expenseCategory = new ExpenseCategory();
	const cost = Math.round(Math.floor(Math.random() * (20000 - 100) + 100) / 100) * 100;
	return expenseCategory;
});