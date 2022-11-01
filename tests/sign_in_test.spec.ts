import { expect, test } from "../api/api.auth";
import { generator } from "../helpers/generator";
import { ExceptionStrings } from "./../helpers/exception_strings";
import { Tokens } from "./../models/tokens";

test("test sign_in with wrong credentials", async ({
	userCreation,
	apiAuth,
}) => {
	const [user] = userCreation;
	for (let data of [
		{ login: user.login, password: `${user.password}-wrong` },
		{ login: `${user.login}-wrong`, password: user.password },
	]) {
		const response = await apiAuth.signIn(data);
		const json = await response.json();
		expect(response.status()).toBe(401);
		expect(json.message).toBe(ExceptionStrings.INVALID_USER_OR_PASSWORD);
	}
});

test("test sign_in validation", async ({ userCreation, apiAuth }) => {
	const { randomString } = generator();
	const [user] = userCreation;
	const userLowPassword = randomString(7);
	const userLargePassword = randomString(256);
	const userLowLogin = randomString(5);
	const userLargeLogin = randomString(21);
	// STEP: password length < 8
	let response = await apiAuth.signIn({
		login: user.login,
		password: userLowPassword,
	});
	// RESULT: 400
	let json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message[0]).toBe(ExceptionStrings.PASSWORD_MUST_BE_LONGER);

	// STEP: password length > 255
	response = await apiAuth.signIn({
		login: user.login,
		password: userLargePassword,
	});
	// RESULT: 400
	json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message[0]).toBe(ExceptionStrings.PASSWORD_MUST_BE_SHORTER);

	// STEP: login length < 6
	response = await apiAuth.signIn({
		login: userLowLogin,
		password: user.password,
	});
	// RESULT: 400
	json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message[0]).toBe(ExceptionStrings.LOGIN_MUST_BE_LONGER);

	// STEP: login length > 20
	response = await apiAuth.signIn({
		login: userLargeLogin,
		password: user.password,
	});
	// RESULT: 400
	json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message[0]).toBe(ExceptionStrings.LOGIN_MUST_BE_SHORTER);

	// STEP: login not string type values
	const badValues = [null, 1, true, { login: "login" }, ["login"]];
	for (let badValue of badValues) {
		response = await apiAuth.signIn({
			login: badValue,
			password: user.password,
		});
		// RESULT: 400
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(ExceptionStrings.LOGIN_MUST_BE_A_STRING);
	}

	// STEP: password not string type values
	for (let badValue of badValues) {
		response = await apiAuth.signIn({
			login: user.login,
			password: badValue,
		});
		// RESULT: 400
		json = await response.json();
		expect(response.status()).toBe(400);
		expect(json.message[0]).toBe(ExceptionStrings.PASSWORD_MUST_BE_A_STRING);
	}

	//STEP: no password given
	response = await apiAuth.signIn({ login: user.login });
	//RESULT: 400
	const validatePasswordStrings = [
		ExceptionStrings.PASSWORD_MUST_BE_LONGER,
		ExceptionStrings.PASSWORD_MUST_BE_SHORTER,
		ExceptionStrings.PASSWORD_MUST_BE_A_STRING,
		ExceptionStrings.PASSWORD_SHOULD_NOT_BE_EMPTY,
	];
	json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message.sort()).toEqual(validatePasswordStrings.sort());

	//STEP: no login given
	response = await apiAuth.signIn({ password: user.password });
	//RESULT: 400
	const validateLoginStrings = [
		ExceptionStrings.LOGIN_MUST_BE_LONGER,
		ExceptionStrings.LOGIN_MUST_BE_SHORTER,
		ExceptionStrings.LOGIN_MUST_BE_A_STRING,
		ExceptionStrings.LOGIN_SHOULD_NOT_BE_EMPTY,
	];
	json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message.sort()).toEqual(validateLoginStrings.sort());

	//STEP: give extra fields
	response = await apiAuth.signIn({
		login: user.login,
		password: user.password,
		extra_field: "extrafield",
	});
	//RESULT: 400
	json = await response.json();
	expect(response.status()).toBe(400);
	expect(json.message[0]).toBe(
		ExceptionStrings.PROPERTY_SHOULD_NOT_EXIST("extra_field")
	);
});

test("test sign_in", async ({ userCreation, apiAuth }) => {
	//STEP: sign in with good credentials
	const [user] = userCreation;
	const response = await apiAuth.signIn({
		login: user.login,
		password: user.password,
	});
	//RESULT: 200, access_token/refresh_token/user_id
	const json: Tokens = await response.json();
	const tokens = new Tokens(json.access_token, json.refresh_token, json.user);
	const tokensJWT = tokens.getJWTInfo();
	expect(response.status()).toBe(200);
	for (let value of Object.values(tokens)) {
		expect(typeof value).toBe("string");
	}
	expect(String(tokensJWT.userId)).toBe(String(user.id));
	expect(tokensJWT.exp).toBeGreaterThan(Date.now() / 1000);
	const currentDateWithExpirationTime = Date.now() / 1000 + 900;
	expect(tokensJWT.exp).toBeLessThanOrEqual(currentDateWithExpirationTime);
});
