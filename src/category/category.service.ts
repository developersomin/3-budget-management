import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService implements OnModuleInit{
	constructor(@InjectRepository(Category) private readonly categoryRepository: Repository<Category>) {
	}


	async onModuleInit() {
		const categoryNames = [{ name: '식비'},{ name: '교통'},{ name: '통신비'},{ name: '거주'},{ name: '쇼핑'}]
		await this.categoryRepository.save(categoryNames);
    }



	getCategory(): Promise<Category[]>{
		return this.categoryRepository.find();
	}


}
