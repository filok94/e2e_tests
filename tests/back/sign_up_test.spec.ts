import * as bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'
import { expect, test as base } from '../../fixtures/api.fixture'
import { FxitureDeletion } from '../../fixtures/test.fixtures'
import { ExceptionStrings } from '../../helpers/exception_strings'
import { generator } from '../../helpers/generator'
import { Tokens } from '../../models/tokens'
import { User } from '../../models/user'
import { DBUsers } from '../../db/db_users'

export type ServerError = {
	message: string[];
};
const test = base.extend<FxitureDeletion>({
  useAndDelete: async ({ }, use) => {
    const user = new User()
    const db = new DBUsers()
    await use(user)
    await db.deleteUsers([user])
  }
})

test.describe('SUITE: tests sign up', () => {
  test('TEST: test sign_up with existing user credentials', async ({ apiAuth, userCreation }) => {
    const { existingUser } = await test.step('DO: generate existing user', async () => {
      const [existingUser] = userCreation
      return { existingUser }
    })

    const { res } = await test.step('DO: sign_up with existing credentials', async () => {
      const res = await apiAuth.signUp({ login: existingUser.login, password: existingUser.password })
      return { res }
    })

    await test.step('EXPECT: 409', async () => {
      const json: ServerError = await res.json()
      expect(res.status()).toBe(409)
      expect(json.message).toBe('Conflict')
    })
  })

  test('TEST: test sign_up validation', async ({ apiAuth }) => {
    const { userLowPassword, userLargePassword, userLowLogin, userLargeLogin, userLogin, userPassword, badValues } = await test.step('DO: generate incorrect data', async () => {
      const { randomString } = generator()
      const userLowPassword = randomString(7)
      const userLargePassword = randomString(256)
      const userLowLogin = randomString(5)
      const userLargeLogin = randomString(21)
      const [userLogin, userPassword] = [randomString(10), randomString(10)]
      const badValues = [null, 1, true, { login: 'login' }, ['login']]
      return { userLowPassword, userLargePassword, userLowLogin, userLargeLogin, userLogin, userPassword, badValues }
    })

    await test.step('DO: request with password length < 8', async () => {
      const response = await apiAuth.signUp({
        login: userLogin,
        password: userLowPassword
      })
      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER('password', 8))
      })
    })

    await test.step('DO: request with password length > 255', async () => {
      const response = await apiAuth.signUp({ login: userLogin, password: userLargePassword })

      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_SHORTER('password', 255))
      })
    })

    await test.step('DO: request with login length < 6', async () => {
      const response = await apiAuth.signUp({ login: userLowLogin, password: userPassword })
      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_LONGER('login', 6))
      })
    })

    await test.step('DO: request with login length > 20', async () => {
      const response = await apiAuth.signUp({ login: userLargeLogin, password: userPassword })

      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_SHORTER('login', 20))
      })
    })

    await test.step('DO: request with login not string type values', async () => {
      for (const badValue of badValues) {
        const response = await apiAuth.signUp({ login: badValue, password: userPassword })

        await test.step('EXPECT: 400', async () => {
          const json = await response.json()
          expect(response.status()).toBe(400)
          expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING('login'))
        })
      }
    })

    await test.step('DO: request with password not string type values', async () => {
      for (const badValue of badValues) {
        const response = await apiAuth.signUp({ login: userLogin, password: badValue })

        await test.step('EXPECT: 400', async () => {
          const json = await response.json()
          expect(response.status()).toBe(400)
          expect(json.message[0]).toBe(ExceptionStrings.MUST_BE_A_STRING('password'))
        })
      }
    })

    await test.step('DO: request with no password', async () => {
      const response = await apiAuth.signUp({
        login: userLogin
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

    await test.step('DO: request with no login', async () => {
      const response = await apiAuth.signUp({ password: userPassword })

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
      const response = await apiAuth.signUp({ login: userLogin, password: userPassword, extra_field: 'extrafield' })

      await test.step('EXPECT: 400', async () => {
        const json = await response.json()
        expect(response.status()).toBe(400)
        expect(json.message[0]).toBe(ExceptionStrings.SHOULD_NOT_EXIST('extra_field'))
      })
    })
  })

  test('TEST: sign_up with new user', async ({ apiAuth, useAndDelete }) => {
    const { user } = await test.step('DO: generate user ', async () => {
      const user = useAndDelete
      return { user }
    })

    const { res } = await test.step("DO: request sign_up with new user's credentials", async () => {
      const res = await apiAuth.signUp({
        login: user.login,
        password: user.password
      })
      return { res }
    })

    const { tokens } = await test.step('EXPECT: 200, the tokens and the user_id are in the response body', async () => {
      const json: Tokens = await res.json()
      const tokens = new Tokens(json.access_token, json.refresh_token, json.user)
      user.setId(new ObjectId(String(tokens.user)))

      expect(res.status()).toBe(200)
      expect(String(tokens.getJWTInfo().userId)).toBe(String(user._id))
      expect(tokens.getJWTInfo().exp).toBeGreaterThan(Date.now() / 1000)
      const currentDateWithExpirationTime = Date.now() / 1000 + 900
      expect(tokens.getJWTInfo().exp).toBeLessThanOrEqual(currentDateWithExpirationTime)
      return { tokens }
    })

    await test.step('EXPECT: new user and his tokens have been saved into the DB', async () => {
      const db = new DBUsers()
      const usersInDb = await db.getUsersInfo(([new ObjectId(String(tokens.user))]))
      if (usersInDb) {
        const userInDb = usersInDb[0]
        expect(String(userInDb._id)).toBe(tokens.user)
        expect(userInDb.login).toBe(user.login)
        expect(userInDb.tokenDocument[0].access_token).toBe(tokens.access_token)
        expect(userInDb.tokenDocument[0].refresh_token).toBe(tokens.refresh_token)
        expect(String(userInDb.tokenDocument[0].user)).toBe(String(userInDb._id))

        await test.step('EXPECT: password have been saved as hash into DB', async () => {
          const comparePasswords = bcrypt.compareSync(String(user.password), String(userInDb.password))
          expect(comparePasswords).toBe(true)
        })

        await test.step('EXPECT: user have been saved with no admin access by default', async () => {
          expect(userInDb.is_admin).toBe(false)
        })
      } else {
        expect(1, 'usersInDb is falsy, something wrong').toBeFalsy()
      }
    })
  })
})
