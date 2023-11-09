import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Users } from './entity/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { IGiveToken } from '../auth/interface/auth-service.interface';

@Injectable()
export class UsersService {
	constructor(@InjectRepository(Users) private readonly usersRepository: Repository<Users>, private readonly authService: AuthService) {
	}
	findOne(options: FindOptionsWhere<Users>): Promise<Users> {
		return this.usersRepository.findOne({ where: options});
	}

	async signup(createUserDto:CreateUserDto):Promise<Users>{
		const { nickname, password } = createUserDto;
		const findUser = await this.findOne({ nickname });
		if (findUser) {
			throw new BadRequestException('이미 가입한 아이디가 있습니다.');
		}
		const hashedPassword = await bcrypt.hash(password, Number(process.env.HASH_SALT));
		const newUser = this.usersRepository.create({
			nickname,
			password: hashedPassword,
		});
		await this.usersRepository.save(newUser);

		return newUser;
	}

	async login(user: Pick<Users, 'nickname' | 'password'>): Promise<IGiveToken> {
		const findUser = await this.findOne({ nickname: user.nickname });
		if (!findUser) {
			throw new BadRequestException('아이디가 존재하지 않습니다.');
		}
		const passOk = await bcrypt.compare(user.password, findUser.password);
		if (!passOk) {
			throw new UnauthorizedException('비밀번호가 틀렸습니다');
		}
		return this.authService.giveToken(findUser);
	}
}
