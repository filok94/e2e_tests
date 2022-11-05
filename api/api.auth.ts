import { APIRequestContext, APIResponse } from "@playwright/test";
import { expect, test as base } from "../tests/main_fixtures";

export const AUTH_URLS = {
	signIn: `auth/sign_in`,
	signUp: `auth/sign_up`,
	refreshTokens: "auth/refresh_token",
} as const;
// eslint-disable-next-line no-redeclare
export type AUTH_URLS = typeof AUTH_URLS[keyof typeof AUTH_URLS];

type ApiFixtures = {
	apiAuth: ApiAuth;
};
export const test = base.extend<ApiFixtures>({
	apiAuth: async ({ request }, use) => {
		await use(new ApiAuth(request));
	},
});

class ApiAuth {
	constructor(private request: APIRequestContext) {
		this.request = request;
	}

	async signIn(
		data: { login: string; password: string } | object
	): Promise<APIResponse> {
		return await this.request.post(AUTH_URLS.signIn, { data });
	}
	async signUp(
		data: { login: string; password: string } | object
	): Promise<APIResponse> {
		return await this.request.post(AUTH_URLS.signUp, { data });
	}
}

export { expect };
