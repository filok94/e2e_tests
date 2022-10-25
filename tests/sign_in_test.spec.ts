import { generator } from "../helpers/generator";
import { test, expect } from "../api/api.auth";

test("sign_in with wrong credentials", async ({ request, userCreation }) => {
	const user = userCreation;
	for (let data of [
		{ login: user.login, password: `${user.password}-wrong` },
		{ login: `${user.login}-wrong`, password: user.password },
	]) {
		const response = await request.post(`/auth/sign_in`, {
			data,
		});

		expect(response.status()).toBe(401);
	}
});

test("sign_in validation checks", async ({ userCreation, apiAuth }) => {
	const { randomString } = generator();
	const user = userCreation;
	const user_bad_password = randomString(7);
	// STEP: password length < 8
	let response = await apiAuth.signIn({
		login: user.login,
		password: user_bad_password,
	});
	// RESULT: 400
	expect(response.status()).toBe(400);

	// STEP: password length > 255
	const largePassword = randomString(256);
	response = await apiAuth.signIn({
		login: user.login,
		password: largePassword,
	});
	// RESULT: 400
	expect(response.status()).toBe(400);

	// STEP: login length < 6
	const minLogin = randomString(5);
	response = await apiAuth.signIn({ login: minLogin, password: user.password });
	// RESULT: 400
	expect(response.status()).toBe(400);

	// STEP: login length > 20
	const maxLogin = randomString(21);
	response = await apiAuth.signIn({ login: maxLogin, password: user.password });
	// RESULT: 400
	expect(response.status()).toBe(400);

	// STEP: login not string type values
	const badValues = [1, null, true, { login: "login" }, ["login"]];
	for (let badValue of badValues) {
		response = await apiAuth.signIn({
			login: badValue,
			password: user.password,
		});
		// RESULT: 400
		expect(response.status()).toBe(400);
	}

	// STEP: password not string type values
	for (let badValue of badValues) {
		response = await apiAuth.signIn({
			login: user.login,
			password: badValue,
		});
		// RESULT: 400
		expect(response.status()).toBe(400);
	}

	//STEP: no password given
	response = await apiAuth.signIn({ login: user.login });
	//RESULT: 400
	expect(response.status()).toBe(400);

	//STEP: no login given
	response = await apiAuth.signIn({ password: user.password });
	//RESULT: 400
	expect(response.status()).toBe(400);

	//STEP: give extra fields
	response = await apiAuth.signIn({
		login: user.login,
		password: user.password,
		extra_field: "extrafield",
	});
	//RESULT: 400
	expect(response.status()).toBe(400);
});
