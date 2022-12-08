import { test as base } from "@playwright/test";
import { DBUsers } from "../db/db_users";
import { generator } from "../helpers/generator";
import { User } from "../models/user";
type MyFixtures = {
	userCreation: User[];
};

export const test = base.extend<MyFixtures>({
	userCreation: async ({ }, use) => {
		const { randomString } = generator();
		const mainUser = new User(
			`autoqa-${ randomString(5) }`,
			`autoqa-${ randomString(5) }`,
			false
		);
		const adminUser = new User(
			`autoqa-admin-${ randomString(5) }`,
			`autoqa-admin-${ randomString(5) }`,
			true
		);
		console.log(
			`creating users...\n\tadmin: ${ adminUser.login },\n\tmain: ${ mainUser.login }`
		);
		// pass here setup fixture
		const ids = await new DBUsers().addUsers([mainUser, adminUser]);
		if (ids && ids[0] && ids[1]) {
			mainUser.setId(ids[0]);
			adminUser.setId(ids[1]);
		}

		console.log("testing...");
		await use([mainUser]);
		console.log("Teardown fixtures start...");
		// pass here teardown fixture
		await new DBUsers().deleteUsers([mainUser, adminUser]);
		console.log("Teardown fixtures complete");
	},
});
export { expect } from "@playwright/test";
