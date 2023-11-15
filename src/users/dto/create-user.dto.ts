import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
	@IsNotEmpty({ message: '아이디는 필수 입력 필드입니다.' })
	@IsString()
	@MinLength(6)
	@MaxLength(20)
	@Matches(/^(?=.*[a-z])(?=.*\d)[a-z\d]+$/, { message: '영문 소문와 소문자 조합으로 아이디를 만드셔야합니다.' })
	nickname: string;
	@IsString()
	@MinLength(10, { message: '패스워드는 10자리 이상이어야 합니다.' })
	@Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
		message: '영어 숫자 특수문자 조합으로 비밀번호를 입력하셔야 합니다.',
	})
	@IsNotEmpty({ message: '패스워드는 필수 입력 필드입니다.' })
	password: string;
}
