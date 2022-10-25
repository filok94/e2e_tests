import { generator } from "../helpers/generator";

const { randomString } = generator();

export class User {
	constructor(
		public login: string | null = null,
		public password: string | null = null
	) {
		this.login = login ? login : randomString();
		this.password = password ? password : randomString();
	}

	getAuthJson() {
		return JSON.stringify({
			login: this.login,
			password: this.password,
		});
	}
}
