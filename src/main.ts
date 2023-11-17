import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from "@nestjs/common";
import { TransactionInterceptor } from './commons/interceptor/transaction.interceptor';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    DataSource
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        //dto 정의된 타입외 값은 허용하지 않는다.
      forbidNonWhitelisted: true,  //정해진 필드가 아닌 경우 에러를 보낸다.
      transform: true   //데이터를 받아서 넘겨줄때 자동으로 타입을 변환해준다.
    })
  );
  await app.listen(3000);
}
bootstrap();
