import { DBUsers } from "../db/db_users";
import { test as base } from "@playwright/test";
import { User } from "../models/user";
type MyFixtures = {
	userCreation: User;
};

export const test = base.extend<MyFixtures>({
	userCreation: async ({}, use) => {
		// Set up the fixture.
		const main_user = new User();
		await DBUsers.addUsers([main_user]);

		// Use the fixture value in the test.
		await use(main_user);

		// Clean up the fixture.
		await DBUsers.deleteUsers([main_user]);
	},
});
export { expect } from "@playwright/test";
