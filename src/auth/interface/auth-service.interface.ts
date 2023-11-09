export interface IGiveToken {
	accessToken: string;
	refreshToken: string;
}
export interface IVerifyToken {
	sub: string;
	nickname: string;
	type: boolean;
}
