import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const status = exception.getStatus();
		const exceptionObj = exception.getResponse();
		
		response.status(status).json({
			statusCode: status,
			error: exceptionObj['error'],
			message: exceptionObj['message'],
			timestamp: new Date().toLocaleDateString('kr'),
			path: request.url,
		});
	}
}