import { ObjectId } from 'mongodb'
import { expect, test } from '../fixtures/api.fixture'
import { generator } from '../helpers/generator'
import { DBUsers } from './../db/db_users'
import { ExceptionStrings } from './../helpers/exception_strings'
import { Tokens } from './../models/tokens'

test.describe('tests sign in', async () => {
  test('test sign_in with wrong credentials', async ({
    userCreation,
    apiAuth
  }) => {
    const [user] = userCreation
    for (const data of [
      {
        login: user.login, password: `${user.password}-wrong`
      },
      {
        login: `${user.login}-wrong`, password: user.password
      }
    ]) {
      const response = await apiAuth.signIn(data)
      const json = await response.json()
      expect(response.status()).toBe(401)
      expect(json.message).toBe(ExceptionStrings.INVALID_USER_OR_PASSWORD)
    }
  })

  test('test sign_in validation', async ({ userCreation, apiAuth }) => {
    const { randomString } = generator()
    const [user] = userCreation
    const userLowPassword = randomString(7)
    const userLargePassword = randomString(256)
    const userLowLogin = randomString(5)
    const userLargeLogin = randomString(21)
    // STEP: password length < 8
    let response = await apiAuth.signIn({
      login: user.login,
      password: userLowPassword
    })
    // RESULT: 400
    let json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER('password', 8))

    // STEP: password length > 255
    response = await apiAuth.signIn({
      login: user.login,
      password: userLargePassword
    })
    // RESULT: 400
    json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message[0]).toBe(
      ExceptionStrings.MUST_BE_SHORTER('password', 255)
    )

    // STEP: login length < 6
    response = await apiAuth.signIn({
      login: userLowLogin,
      password: user.password
    })
    // RESULT: 400
    json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER('login', 6))

    // STEP: login length > 20
    response = await apiAuth.signIn({
      login: userLargeLogin,
      password: user.password
    })
    // RESULT: 400
    json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_SHORTER('login', 20))

    // STEP: login not string type values
    const badValues = [null, 1, true, {
      login: 'login'
    }, ['login']]
    for (const badValue of badValues) {
      response = await apiAuth.signIn({
        login: badValue,
        password: user.password
      })
      // RESULT: 400
      json = await response.json()
      expect(response.status()).toBe(400)
      expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING('login'))
    }

    // STEP: password not string type values
    for (const badValue of badValues) {
      response = await apiAuth.signIn({
        login: user.login,
        password: badValue
      })
      // RESULT: 400
      json = await response.json()
      expect(response.status()).toBe(400)
      expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING('password'))
    }

    // STEP: no password given
    response = await apiAuth.signIn({
      login: user.login
    })
    // RESULT: 400
    const validatePasswordStrings = [
      ExceptionStrings.MUST_BE_LONGER('password', 8),
      ExceptionStrings.MUST_BE_SHORTER('password', 255),
      ExceptionStrings.MUST_BE_A_STRING('password'),
      ExceptionStrings.SHOULD_NOT_BE_EMPTY('password')
    ]
    json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message.sort()).toEqual(validatePasswordStrings.sort())

    // STEP: no login given
    response = await apiAuth.signIn({
      password: user.password
    })
    // RESULT: 400
    const validateLoginStrings = [
      ExceptionStrings.MUST_BE_LONGER('login', 6),
      ExceptionStrings.MUST_BE_SHORTER('login', 20),
      ExceptionStrings.MUST_BE_A_STRING('login'),
      ExceptionStrings.SHOULD_NOT_BE_EMPTY('login')
    ]
    json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message.sort()).toEqual(validateLoginStrings.sort())

    // STEP: give extra fields
    response = await apiAuth.signIn({
      login: user.login,
      password: user.password,
      extra_field: 'extrafield'
    })
    // RESULT: 400
    json = await response.json()
    expect(response.status()).toBe(400)
    expect(json.message[0]).toBe(
      ExceptionStrings.SHOULD_NOT_EXIST('extra_field')
    )
  })

  test('test sign_in', async ({ userCreation, apiAuth }) => {
    // STEP: sign in with good credentials
    const [user] = userCreation
    const response = await apiAuth.signIn({
      login: user.login,
      password: user.password
    })
    // RESULT: 200, access_token/refresh_token/user_id
    const json: Tokens = await response.json()
    const tokens = new Tokens(json.access_token, json.refresh_token, json.user)
    expect(response.status()).toBe(200)
    for (const value of Object.values(json)) {
      expect(typeof value).toBe('string')
    }
    expect(String(tokens.getJWTInfo().userId)).toBe(String(user._id))
    expect(tokens.getJWTInfo().exp).toBeGreaterThan(Date.now() / 1000)
    const currentDateWithExpirationTime = Date.now() / 1000 + 900
    expect(tokens.getJWTInfo().exp).toBeLessThanOrEqual(
      currentDateWithExpirationTime
    )
    // RESULT: user tokens have been saved into DB
    const db = new DBUsers()
    const dbUsers = await db.getUsersInfo([user._id as ObjectId])
    if (dbUsers) {
      const dbUserTokens = dbUsers[0].tokenDocument[0]
      expect(dbUserTokens.access_token).toBe(tokens.access_token)
      expect(dbUserTokens.refresh_token).toBe(tokens.refresh_token)
      expect(String(dbUserTokens.user)).toBe(String(user._id))
    } else {
      expect(1, 'dbUsers is falsy, something wrong').toBeFalsy()
    }
  })
})
