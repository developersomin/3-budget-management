import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from '../users/entity/users.entity';
import { IGiveToken, IVerifyToken } from './interface/auth-service.interface';

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService) {}

	/**
	 * 1) signToken()
	 *  - accessToken 과 refreshToken 을 sign하는 로직
	 * 2) giveToken()
	 *  - 로그인 시 1)을 실행하여 나온 accessToken,refreshToken 을 반환
	 * 3) 아무나 접근 할 수 없는 정보를 접근 할 때 accessToken을 Header에 추가해서 요청을 함께 보낸다.
	 *  - 예) authorization: 'Bearer {token}'
	 * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누군지 알 수 있다.
	 *  - extractTokenFromHeader(): 클라이언트로 온 토큰을 파싱하는 작업
	 *  - verifyToken():파싱된 토큰으로 검증 진행
	 * 5) 모든 토큰은 만료 기간이 있고 만료기간이 끝나면 새로 토큰을 발급 받아야 한다.
	 *  - 만료되면 검증이 안되니 accessToken 이 만료 시에는 refreshToken 으로 accessToken 을 재발급 해야한다.
	 *  - refresh 토큰이 만료 시 는 원칙상으로 다시 로그인해서 accessToken 과 refreshToke 을 받아야한다.
	 *  - rotateToken() : accessToken 만료시 /auth/token/refresh 요청해서 재발급 받는다.
	 **/
	signToken(user: Pick<Users, 'nickname' | 'id'>, isRefreshToken: boolean): string {
		const payload = {
			sub: user.id,
			nickname: user.nickname,
			type: isRefreshToken ? 'refresh' : 'access',
		};

		return this.jwtService.sign(payload, {
			secret: process.env.JWT_SECRET,
			expiresIn: isRefreshToken ? 7200 : 600,
		});
	}

	giveToken(user: Pick<Users, 'nickname' | 'id'>): IGiveToken {
		return {
			accessToken: this.signToken(user, false),
			refreshToken: this.signToken(user, true),
		};
	}

	extractTokenFromHeader(header: string): string {
		//authorization: 'Bearer {token}'
		const splitToken = header.split(' ');

		if (splitToken.length !== 2 || splitToken[0] !== 'Bearer') {
			throw new UnauthorizedException('잘못된 토큰 입니다.');
		}

		const token = splitToken[1];

		return token;
	}

	verifyToken(token: string): IVerifyToken {
		try {
			return this.jwtService.verify(token, {
				secret: process.env.JWT_SECRET,
			});
		} catch (e) {
			throw new UnauthorizedException('토큰 만료 또는 잘못된 토큰 입니다.');
		}
	}

	async rotateToken(token: string, isRefreshToken: boolean): Promise<string> {
		const decoded = this.jwtService.verify(token, {
			secret: process.env.JWT_SECRET,
		});

		if (decoded.type !== 'refresh') {
			throw new UnauthorizedException('토큰 재발급은 Refresh 토큰으로만 가능합니다!');
		}

		return this.signToken(
			{
				...decoded,
			},
			isRefreshToken,
		);
	}
}

