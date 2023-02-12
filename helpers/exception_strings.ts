export class ExceptionStrings {
  static WRONG_USER_OR_PASSWORD = 'Wrong login or password'
  static INVALID_USER_OR_PASSWORD = 'invalid user or password'
  static DUPLICATES = 'duplicates existing'
  static PERSON_NOT_FOUND = 'One of persons not found'
  static LENGTH_IS_BAD = 'length is bad'
  static TOKEN_EXPIRED = 'token has expired'
  static CANNOT_FIND_GAME = 'Cannot find game by this id'
  static CANNOT_FIND_AVATAR = 'Cannot find avatar with this id'
  static CANNOT_FIND_PERSON = 'Cannot find person with this id'
  static CANNOT_FIND_TOKEN = 'cannot find user with this token'
  static LINK_NOT_RELATE_TO_AVATAR = 'link does not relate to this avatar id'
  static CANNOT_FIND_LOGIN = 'Cannot find user with this login'
  static DUPLICATES_10011 = 'duplicate key error collection'
  static WRONG_QUESTION_DATA = 'wrong questions data'
  static WRONG_GAME_ID = 'wrong game id'
  static CANNOT_FIND_RESULTS = 'user have no results on this game'
  static MUST_BE_LONGER = (property: string, longerThan: number) =>
		`${property} must be longer than or equal to ${longerThan} characters`

  static MUST_BE_SHORTER = (property: string, shorterThan: number) =>
		`${property} must be shorter than or equal to ${shorterThan} characters`

  static SHOULD_NOT_EXIST = (property: string) =>
		`property ${property} should not exist`

  static SHOULD_NOT_BE_EMPTY = (property: string) =>
		`${property} should not be empty`

  static MUST_BE_A_STRING = (property: string) =>
		`${property} must be a string`

  static MUST_BE_A_JWT = (property: string) =>
		`${property} must be a jwt string`
}
