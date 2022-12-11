import { ApiGames } from "../api/api.games";
import { ApiAuth } from "../api/api.auth";
import { expect, test as base } from "../tests/main_fixtures";

export type ApiFixtures = {
	apiAuth: ApiAuth;
	apiGames: ApiGames;
};
export const test = base.extend<ApiFixtures>({
	apiAuth: async ({ request }, use) => {
		await use(new ApiAuth(request));
	},
	apiGames: async ({ request }, use) => {
		await use(new ApiGames(request));
	},
});

export { expect };
