import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { QueryRunner, Repository } from 'typeorm';

@Injectable()
export class CategoryService {
	constructor(@InjectRepository(Category) private readonly categoryRepository: Repository<Category>) {}

	getRepository(qr?: QueryRunner) {
		return qr ? qr.manager.getRepository<Category>(Category) : this.categoryRepository;
	}

	createCategory(name: string,qr?:QueryRunner): Promise<Category> {
		const repository = this.getRepository(qr);
		return repository.save({ name });
	}
	findCategory(name: string): Promise<Category> {
		return this.categoryRepository.findOne({ where: { name } });
	}

	findCategories(): Promise<Category[]> {
		return this.categoryRepository.find();
	}
}