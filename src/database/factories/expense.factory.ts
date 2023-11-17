import { Expenses } from '../../expenses/entity/expenses.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Expenses, (faker) => {
	const expense = new Expenses();
	expense.year = 2023;
	expense.month = Math.floor(Math.random() * 12 + 1)
	return expense;
})