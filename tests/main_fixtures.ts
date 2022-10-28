import { DBUsers } from "../db/db_users";
import { test as base } from "@playwright/test";
import { User } from "../models/user";
import { generator } from "../helpers/generator";
type MyFixtures = {
	userCreation: User;
};

export const test = base.extend<MyFixtures>({
	userCreation: async ({}, use) => {
		const { randomString } = generator();
		// Set up the fixture.
		const main_user = new User(
			`autoqa-${randomString(5)}`,
			`autoqa-${randomString(5)}`,
			false
		);
		const adminUser = new User(
			`autoqa-admin-${randomString(5)}`,
			`autoqa-admin-${randomString(5)}`,
			true
		);
		await new DBUsers().addUsers([main_user, adminUser]);

		// Use the fixture value in the test.
		await use(main_user);

		// Clean up the fixture.
		await new DBUsers().deleteUsers([main_user, adminUser]);
	},
});
export { expect } from "@playwright/test";
