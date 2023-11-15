import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
	constructor(@InjectRepository(Category) private readonly categoryRepository: Repository<Category>) {}

	createCategory(name) {
		return this.categoryRepository.save({ name });
	}
	findCategory(name) {
		return this.categoryRepository.findOne({ where: { name } });
	}

	findCategories(): Promise<Category[]> {
		return this.categoryRepository.find();
	}
}
