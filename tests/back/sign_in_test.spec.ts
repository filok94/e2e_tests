import { ObjectId } from 'mongodb'
import { expect, test } from '../../fixtures/api.fixture'
import { generator } from '../../helpers/generator'
import { DBUsers } from '../../db/db_users'
import { ExceptionStrings } from '../../helpers/exception_strings'
import { Tokens } from '../../models/tokens'

test.describe('SUITE: tests sign in', async () => {
  test('TEST: test sign_in with wrong credentials', async ({
    userCreation,
    apiAuth
  }) => {
    await test.step('DO: sign in with wrong credentials', async () => {
      const [user] = userCreation
      for (const data of [{ login: user.login, password: `${user.password}-wrong` },
        { login: `${user.login}-wrong`, password: user.password }]) {
        const response = await apiAuth.signIn(data)
        const json = await response.json()

        await test.step('EXPECT: 401', async () => {
          expect(response.status()).toBe(401)
          expect(json.message).toBe(ExceptionStrings.INVALID_USER_OR_PASSWORD)
        })
      }
    })
  })

  test('TEST: test sign_in validation', async ({ userCreation, apiAuth }) => {
    const {
      user,
      userLowPassword,
      userLargePassword,
      userLowLogin,
      userLargeLogin,
      badValues
    } = await test.step('DO: generate incorrect data and sign in', async () => {
      const { randomString } = generator()
      const [user] = userCreation
      const userLowPassword = randomString(7)
      const userLargePassword = randomString(256)
      const userLowLogin = randomString(5)
      const userLargeLogin = randomString(21)
      const badValues = [null, 1, true, { login: 'login' }, ['login']]
      return { user, userLowPassword, userLargePassword, userLowLogin, userLargeLogin, badValues }
    })

    await test.step('DO: request with password length < 8', async () => {
      const response = await apiAuth.signIn({
        login: user.login,
        password: userLowPassword
      })

      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER('password', 8))
      })
    })

    await test.step('DO: request with password length > 255', async () => {
      const response = await apiAuth.signIn({
        login: user.login,
        password: userLargePassword
      })
      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(
          ExceptionStrings.MUST_BE_SHORTER('password', 255)
        )
      })
    })

    await test.step('DO: request with login length < 6', async () => {
      const response = await apiAuth.signIn({
        login: userLowLogin,
        password: user.password
      })
      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER('login', 6))
      })
    })

    await test.step('DO: request with login length > 20', async () => {
      const response = await apiAuth.signIn({
        login: userLargeLogin,
        password: user.password
      })

      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_SHORTER('login', 20))
      })
    })

    await test.step('DO: request with login not string type values', async () => {
      for (const badValue of badValues) {
        const response = await apiAuth.signIn({ login: badValue, password: user.password })

        await test.step('EXPECT: 400', async () => {
          const json = await response.json()
          expect(response.status()).toBe(400)
          expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING('login'))
        })
      }
    })

    await test.step('DO: request with password not string type values', async () => {
      for (const badValue of badValues) {
        const response = await apiAuth.signIn({
          login: user.login,
          password: badValue
        })

        await test.step('EXPECT: 400', async () => {
          const json = await response.json()
          expect(response.status()).toBe(400)
          expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING('password'))
        })
      }
    })

    await test.step('DO: request with no "password" key', async () => {
      const response = await apiAuth.signIn({
        login: user.login
      })

      await test.step('EXPECT: 400', async () => {
        const validatePasswordStrings = [
          ExceptionStrings.MUST_BE_LONGER('password', 8),
          ExceptionStrings.MUST_BE_SHORTER('password', 255),
          ExceptionStrings.MUST_BE_A_STRING('password'),
          ExceptionStrings.SHOULD_NOT_BE_EMPTY('password')
        ]
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message.sort()).toEqual(validatePasswordStrings.sort())
      })
    })

    await test.step('DO: request with no "login" key', async () => {
      const response = await apiAuth.signIn({ password: user.password })

      await test.step('EXPECT: 400', async () => {
        const validateLoginStrings = [
          ExceptionStrings.MUST_BE_LONGER('login', 6),
          ExceptionStrings.MUST_BE_SHORTER('login', 20),
          ExceptionStrings.MUST_BE_A_STRING('login'),
          ExceptionStrings.SHOULD_NOT_BE_EMPTY('login')
        ]
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message.sort()).toEqual(validateLoginStrings.sort())
      })
    })

    await test.step('DO: request with an extra field', async () => {
      const response = await apiAuth.signIn({ login: user.login, password: user.password, extra_field: 'extrafield' })

      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(
          ExceptionStrings.SHOULD_NOT_EXIST('extra_field')
        )
      })
    })
  })

  test('TEST: positive sign_in', async ({ userCreation, apiAuth }) => {
    await test.step('DO: sign in with existing  credentials', async () => {
      const [user] = userCreation
      const response = await apiAuth.signIn({ login: user.login, password: user.password })

      const { tokens } = await test.step('EXPECT: 200, access_token/refresh_token/user_id/is_admin', async () => {
        const json: Tokens = await response.json()
        const tokens = new Tokens(json.access_token, json.refresh_token, json.user)
        expect(response.status()).toBe(200)

        expect(String(tokens.getJWTInfo().userId)).toBe(String(user._id))
        expect(tokens.getJWTInfo().exp).toBeGreaterThan(Date.now() / 1000)
        const currentDateWithExpirationTime = Date.now() / 1000 + 900
        expect(tokens.getJWTInfo().exp).toBeLessThanOrEqual(
          currentDateWithExpirationTime
        )
        return { tokens }
      })

      await test.step('EXPECT: user tokens saved into the DB', async () => {
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
  })
})
