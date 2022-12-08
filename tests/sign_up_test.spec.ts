import * as bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { expect, test as base } from "../fixtures/api.fixture";
import { ExceptionStrings } from "../helpers/exception_strings";
import { generator } from "../helpers/generator";
import { Tokens } from "../models/tokens";
import { User } from "../models/user";
import { DBUsers } from "./../db/db_users";

type ServerError = {
	message: string[];
};
type FxitureDeletion = {
	deletion: User;
};
const test = base.extend<FxitureDeletion>({
	deletion: async ({ }, use) => {
		const user = new User();
		const db = new DBUsers();
		await use(user);
		await db.deleteUsers([user]);
	},
});
test.describe("tests sign up", () => {
	test("test sign_up with existing user", async ({ apiAuth, userCreation }) => {
		const [existingUser] = userCreation;
		//STEP: sign_up with existing credentials
		const res = await apiAuth.signUp({
			login: existingUser.login,
			password: existingUser.password,
		});
		//RESULT: 409 Conflict
		const json: ServerError = await res.json();
		expect(res.status()).toBe(409);
		expect(json.message).toBe("Conflict");
	});

	test("test sign_up validation", async ({ apiAuth }) => {
		const { randomString } = generator();
		const userLowPassword = randomString(7);
		const userLargePassword = randomString(256);
		const userLowLogin = randomString(5);
		const userLargeLogin = randomString(21);
		const [userLogin, userPassword] = [randomString(10), randomString(10)];
		// STEP: password length < 8
		let response = await apiAuth.signUp({
			login: userLogin,
			password: userLowPassword,
		});
		// RESULT: 400
		let json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER("password", 8));

		// STEP: password length > 255
		response = await apiAuth.signUp({
			login: userLogin,
			password: userLargePassword,
		});
		// RESULT: 400
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(
			ExceptionStrings.MUST_BE_SHORTER("password", 255)
		);

		// STEP: login length < 6
		response = await apiAuth.signUp({
			login: userLowLogin,
			password: userPassword,
		});
		// RESULT: 400
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER("login", 6));

		// STEP: login length > 20
		response = await apiAuth.signUp({
			login: userLargeLogin,
			password: userPassword,
		});
		// RESULT: 400
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_SHORTER("login", 20));

		// STEP: login not string type values
		const badValues = [null, 1, true, {
			login: "login"
		}, ["login"]];
		for (const badValue of badValues) {
			response = await apiAuth.signUp({
				login: badValue,
				password: userPassword,
			});
			// RESULT: 400
			json = await response.json();
			expect(response.status()).toBe(400);
			expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING("login"));
		}

		// STEP: password not string type values
		for (const badValue of badValues) {
			response = await apiAuth.signUp({
				login: userLogin,
				password: badValue,
			});
			// RESULT: 400
			json = await response.json();
			expect(response.status()).toBe(400);
			expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING("password"));
		}

		//STEP: no password given
		response = await apiAuth.signUp({
			login: userLogin
		});
		//RESULT: 400
		const validatePasswordStrings = [
			ExceptionStrings.MUST_BE_LONGER("password", 8),
			ExceptionStrings.MUST_BE_SHORTER("password", 255),
			ExceptionStrings.MUST_BE_A_STRING("password"),
			ExceptionStrings.SHOULD_NOT_BE_EMPTY("password"),
		];
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message.sort()).toEqual(validatePasswordStrings.sort());

		//STEP: no login given
		response = await apiAuth.signUp({
			password: userPassword
		});
		//RESULT: 400
		const validateLoginStrings = [
			ExceptionStrings.MUST_BE_LONGER("login", 6),
			ExceptionStrings.MUST_BE_SHORTER("login", 20),
			ExceptionStrings.MUST_BE_A_STRING("login"),
			ExceptionStrings.SHOULD_NOT_BE_EMPTY("login"),
		];
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message.sort()).toEqual(validateLoginStrings.sort());

		//STEP: give extra fields
		response = await apiAuth.signUp({
			login: userLogin,
			password: userPassword,
			extra_field: "extrafield",
		});
		//RESULT: 400
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(
			ExceptionStrings.SHOULD_NOT_EXIST("extra_field")
		);
	});

	test("sign_up with new user", async ({ apiAuth, deletion }) => {
		const user = deletion;

		//STEP: sign_up with new user
		const res = await apiAuth.signUp({
			login: user.login,
			password: user.password,
		});

		//RESULT: 200, tokens and user_id in res.body
		const json: Tokens = await res.json();
		const tokens = new Tokens(json.access_token, json.refresh_token, json.user);
		user.setId(new ObjectId(String(tokens.user)));

		expect(res.status()).toBe(200);
		for (const value of Object.values(json)) {
			expect(typeof value).toBe("string");
		}
		expect(String(tokens.getJWTInfo().userId)).toBe(String(user._id));
		expect(tokens.getJWTInfo().exp).toBeGreaterThan(Date.now() / 1000);
		const currentDateWithExpirationTime = Date.now() / 1000 + 900;
		expect(tokens.getJWTInfo().exp).toBeLessThanOrEqual(
			currentDateWithExpirationTime
		);
		// RESULT: new user and tokens have been saved into DB
		const db = new DBUsers();
		const usersInDb = await db.getUsersInfo(([new ObjectId(String(tokens.user))]));
		if (usersInDb) {
			const userInDb = usersInDb[0];
			expect(String(userInDb._id)).toBe(tokens.user);
			expect(userInDb.login).toBe(user.login);
			expect(userInDb.tokenDocument[0].access_token).toBe(tokens.access_token);
			expect(userInDb.tokenDocument[0].refresh_token).toBe(tokens.refresh_token);
			expect(String(userInDb.tokenDocument[0].user)).toBe(String(userInDb._id));
			// RESULT: password have been saved as hash into DB
			const comparePasswords = bcrypt.compareSync(String(user.password), String(userInDb.password));
			expect(comparePasswords).toBe(true);
			// RESULT: user have been saved with no admin access by default
			expect(userInDb.is_admin).toBe(false);
		}
		else {
			expect(1, "usersInDb is falsy, something wrong").toBeFalsy();
		}
	});
});
