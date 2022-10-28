export class ExceptionStrings {
	static BAD_REQUEST = "Bad request";
	static ALREADY_IN_USE = "Already in use";
	static WRONG_USER_OR_PASSWORD = "Wrong login or password";
	static DUPLICATES = "duplicates existing";
	static NOT_FOUND = "Not found";
	static PERSON_NOT_FOUND = "One of persons not found";
	static LENGTH_IS_BAD = "length is bad";
	static CANNOT_FIND_GAME = "Cannot find game by this id";
	static CANNOT_FIND_AVATAR = "Cannot find avatar with this id";
	static CANNOT_FIND_PERSON = "Cannot find person with this id";
	static CANNOT_FIND_TOKEN = "cannot find user with this token";
	static LINK_NOT_RELATE_TO_AVATAR = "link does not relate to this avatar id";
	static CANNOT_FIND_LOGIN = "Cannot find user with this login";
	static DUPLICATES_10011 = "duplicate key error collection";
	static WRONG_QUESTION_DATA = "wrong questions data";
	static WRONG_GAME_ID = "wrong game id";
	static CANNOT_FIND_RESULTS = "user have no results on this game";
	static PASSWORD_MUST_BE_LONGER =
		"password must be longer than or equal to 8 characters";
	static PASSWORD_MUST_BE_SHORTER =
		"password must be shorter than or equal to 255 characters";
	static LOGIN_MUST_BE_LONGER =
		"login must be longer than or equal to 6 characters";
	static LOGIN_MUST_BE_SHORTER =
		"login must be shorter than or equal to 20 characters";
	static LOGIN_MUST_BE_A_STRING = "login must be a string";
	static PASSWORD_MUST_BE_A_STRING = "password must be a string";
	static PASSWORD_SHOULD_NOT_BE_EMPTY = "password should not be empty";
	static LOGIN_SHOULD_NOT_BE_EMPTY = "login should not be empty";
	static PROPERTY_SHOULD_NOT_EXIST = (property: string) =>
		`property ${property} should not exist`;
	static INVALID_USER_OR_PASSWORD = "invalid user or password";
}
