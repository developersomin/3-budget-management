import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Users } from '../../users/entity/users.entity';

export const User = createParamDecorator((data: keyof Users | undefined, context: ExecutionContext) => {
	const req = context.switchToHttp().getRequest();
	const user = req.user;

	if (!user) {
		throw new InternalServerErrorException('User 데코레이터에는 accessTokenGuard 와 함께 사용해야함');
	}
	if (data) {
		return user[data];
	}
	return user;
});
