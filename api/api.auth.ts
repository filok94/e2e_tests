import { APIRequestContext, APIResponse } from "@playwright/test";

export const AUTH_URLS = {
	signIn: "auth/sign_in",
	signUp: "auth/sign_up",
	refreshTokens: "auth/refresh_tokens",
} as const;
// eslint-disable-next-line no-redeclare
export type AUTH_URLS = typeof AUTH_URLS[keyof typeof AUTH_URLS];

export class ApiAuth {
	constructor ( private request: APIRequestContext ) {
		this.request = request;
	}

	async signIn (
		data: { login: string; password: string } | object
	): Promise<APIResponse> {
		return await this.request.post( AUTH_URLS.signIn, {
			data
		} );
	}

	async signUp (
		data: { login: string; password: string } | object
	): Promise<APIResponse> {
		return await this.request.post( AUTH_URLS.signUp, {
			data 
		} );
	}

	async refreshTokens (
		data: { refresh_token: string } | object
	): Promise<APIResponse> {
		return await this.request.post( AUTH_URLS.refreshTokens, {
			data 
		} );
	}
}
