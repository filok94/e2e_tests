import { ObjectId } from "mongodb";
import { expect, test } from "../api/api.auth";
import { generator } from "../helpers/generator";
import { DBUsers } from "./../db/db_users";
import { ExceptionStrings } from "./../helpers/exception_strings";
import { Tokens } from "./../models/tokens";

test("test refresh_token with expired token", async ({
	apiAuth,
	userCreation,
}) => {
	//STEP: sign_in with existing user
	const [user] = userCreation;
	const signInResponse = await apiAuth.signIn({
		login: user.login,
		password: user.password,
	});
	const json: Tokens = await signInResponse.json();
	const tokens = new Tokens(json.access_token, json.refresh_token, json.user);

	//STEP: create expired refresh_token for the existing user
	const expiredToken = tokens.createSignJWTToken("1s");
	const db = new DBUsers();
	await db.updatedUserToken({
		user: user._id,
		accessToken: tokens.access_token,
		refreshToken: expiredToken,
	});

	//STEP: request refresh_token with expired token
	const res = await apiAuth.refreshTokens({ refresh_token: expiredToken });
	const jsonRefresh: { message: string } = await res.json();

	//RESULT: 401 token expired
	expect(res.status()).toBe(401);
	expect(jsonRefresh.message).toBe(ExceptionStrings.TOKEN_EXPIRED);
});

test("test validation refresh_token", async ({ apiAuth, userCreation }) => {
	const [user] = userCreation;
	const { randomString } = generator();
	const refreshToken: string = (
		await (
			await apiAuth.signIn({ login: user.login, password: user.password })
		).json()
	).refresh_token;
	// STEP: request with extra field and no refresh_token field
	const extra_field = refreshToken;
	const res = await apiAuth.refreshTokens({
		refresh_token: randomString(20),
		extra_field,
	});
	const json = await res.json();
	//RESULT: 400
	expect(res.status()).toBe(400);
	expect(json.message.sort()).toEqual(
		[
			ExceptionStrings.SHOULD_NOT_EXIST(Object.keys({ extra_field })[0]),
			ExceptionStrings.MUST_BE_A_JWT("refresh_token"),
		].sort()
	);
	//STEP: request with bad types, not JWT
	for (const badType of [
		1,
		[1],
		{ refresh_token: refreshToken },
		randomString(40),
	]) {
		const res = await apiAuth.refreshTokens({ refresh_token: badType });
		const json: { message: string[] } = await res.json();
		//RESULT: 400
		expect(res.status()).toBe(400);
		expect(json.message).toContain(
			ExceptionStrings.MUST_BE_A_JWT("refresh_token")
		);
	}
});

test("test refresh_token and get tokens info", async ({
	apiAuth,
	userCreation,
}) => {
	//PREREQ: user is signed in
	const [user] = userCreation;
	const signInResponse = await apiAuth.signIn({
		login: user.login,
		password: user.password,
	});
	let json: Tokens = await signInResponse.json();
	const db = new DBUsers();
	//STEP: request refresh_token with existing refresh token
	const refreshResponse = await apiAuth.refreshTokens({
		refresh_token: json.refresh_token,
	});
	//RESULT: 200 and new tokens
	json = await refreshResponse.json();
	expect(json).toHaveProperty("access_token");
	expect(json).toHaveProperty("refresh_token");
	expect(json).toHaveProperty("user");
	//RESULT: new tokens have been saved into DB
	const usersInfo = await db.getUsersInfo([user._id as ObjectId]);
	if (usersInfo) {
		const dbUserTokens = usersInfo[0].tokenDocument[0];
		expect(dbUserTokens.access_token).toBe(json.access_token);
		expect(dbUserTokens.refresh_token).toBe(json.refresh_token);
		expect(String(dbUserTokens.user)).toBe(String(json.user));
	} else {
		expect(1, "usersInfo is falsy, something wrong").toBeFalsy()
	}
});

