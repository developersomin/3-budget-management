import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const QueryRunnerDecorator = createParamDecorator((data, context: ExecutionContext) => {
	const request = context.switchToHttp().getRequest();

	if (!request.queryRunner) {
		throw new InternalServerErrorException('QueryRunner 데코레이터를 사용하실려면 트랜잭션인터셉터를 적용해야 합니다.')
	}
	return request.queryRunner;
});