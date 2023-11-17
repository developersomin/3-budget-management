import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import * as dotenv from 'dotenv';

dotenv.config();
const options: DataSourceOptions & SeederOptions = {
	type: 'mysql',
	host: process.env.DATABASE_HOST,
	port: Number(process.env.DATABASE_PORT),
	username: process.env.DATABASE_USERNAME,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_DATABASE,
	entities: ["src/**/*.entity.*"],
	synchronize: true,
	logging: true,
	seeds: ['src/database/seeds/**/*{.ts,.js}'],
}

export const dataSource = new DataSource(options);