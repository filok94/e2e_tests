import { sign, verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";

export class Tokens {
	constructor (
		public access_token: string | null = null,
		public refresh_token: string | null = null,
		public user: ObjectId | string | null = null
	) {
		this.access_token = access_token;
		this.refresh_token = refresh_token;
		this.user = user;
	}

	getJWTInfo = (): { iat: number; exp: number; userId: string } => {
		const infoFromAccess = verify(
			String(this.access_token),
			process.env.SECRER_JWT
		) as { iat: number; exp: number; userId: string };
		return infoFromAccess;
	};

	createSignJWTToken = (expiresIn: string) => {
		return sign({
			userId: this.user 
		}, process.env.SECRER_JWT, {
			expiresIn,
		});
	};
}
