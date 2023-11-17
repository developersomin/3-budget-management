
import { Users } from '../../users/entity/users.entity';
import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Users, () => {
	const user = new Users();
	const nickname = faker.internet.userName();
	const password = faker.internet.password();
	user.nickname = nickname;
	user.password = password;
	return user;
});