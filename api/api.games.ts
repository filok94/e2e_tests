import { APIRequestContext } from "@playwright/test";

export const GAMES_URLS = {
	getAll: "games",
	getById: (id: string) => `games/${ id }`
};

export type GAMES_URLS = typeof GAMES_URLS[keyof typeof GAMES_URLS]

export class ApiGames {
	constructor (private request: APIRequestContext) {
		this.request = request;
	}
	async getAll (data: { token: string | null  | number | never[] | object } | null = null) {
		if (data) {
			return await this.request.get(GAMES_URLS.getAll, {
				headers: {
					token: String(data.token) 
				} 
			});
		}
		return await this.request.get(GAMES_URLS.getAll);
	}
	async getById (params: {id: string, token: string | null}) {
		if (params.token) {
			return await this.request.get(GAMES_URLS.getById(params.id), {
				headers: {
					token: params.token
				} 
			});
		}
		return await this.request.get(GAMES_URLS.getById(params.id));
	}
}
