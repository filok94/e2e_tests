/* eslint-disable camelcase */
import { ObjectId } from 'mongodb'
import { expect, test } from '../../fixtures/api.fixture'
import { generator } from '../../helpers/generator'
import { DBUsers } from '../../db/db_users'
import { ExceptionStrings } from '../../helpers/exception_strings'
import { Tokens } from '../../models/tokens'

test.describe('SUITE: refresh_token tests', async () => {
  test('TEST: test refresh_token with expired token', async ({
    apiAuth,
    userCreation
  }) => {
    const { tokens, user } = await test.step('DO: sign in with existing\'s user credentials', async () => {
      const [user] = userCreation
      const signInResponse = await apiAuth.signIn({
        login: user.login,
        password: user.password
      })
      const json: Tokens = await signInResponse.json()
      const tokens = new Tokens(json.access_token, json.refresh_token, json.user)
      return { tokens, user }
    })

    const { expiredToken } = await test.step('DO: create expired refresh_token for the existing user', async () => {
      const expiredToken = tokens.createSignJWTToken('1s')
      const db = new DBUsers()
      await db.updatedUserToken({
        user: user._id,
        accessToken: String(tokens.access_token),
        refreshToken: expiredToken
      })

      return { expiredToken }
    })

    await test.step('DO: request refresh_token with expired token', async () => {
      const res = await apiAuth.refreshTokens({ refresh_token: expiredToken })
      const jsonRefresh: { message: string } = await res.json()

      await test.step('EXPECT: 401 token expired', async () => {
        expect(res.status()).toBe(401)
        expect(jsonRefresh.message).toBe(ExceptionStrings.TOKEN_EXPIRED)
      })
    })
  })

  test('TEST: test validation refresh_token', async ({ apiAuth, userCreation }) => {
    const { randomString } = generator()

    const { refreshToken } = await test.step('DO: sign in with existing\'s user credentials', async () => {
      const [user] = userCreation
      const refreshToken: string = (
        await (
          await apiAuth.signIn({
            login: user.login, password: user.password
          })
        ).json()
      ).refresh_token

      return { refreshToken }
    })

    await test.step('DO: request with extra field and no refresh_token field', async () => {
      const extra_field = refreshToken
      const res = await apiAuth.refreshTokens({
        refresh_token: randomString(20),
        extra_field
      })
      const json = await res.json()

      await test.step('EXPECT: 400', async () => {
        expect(res.status()).toBe(400)
        expect(json.message.sort())
          .toEqual([ExceptionStrings.SHOULD_NOT_EXIST(Object.keys({ extra_field })[0]), ExceptionStrings.MUST_BE_A_JWT('refresh_token')].sort())
      })
    })

    await test.step('DO: request with bad types, not JWT', async () => {
      for (const badType of [1, [1], { refresh_token: refreshToken }, randomString(40)]) {
        const res = await apiAuth.refreshTokens({ refresh_token: badType })
        const json: { message: string[] } = await res.json()

        await test.step('EXPECT: 400', async () => {
          expect(res.status()).toBe(400)
          expect(json.message).toContain(
            ExceptionStrings.MUST_BE_A_JWT('refresh_token'))
        })
      }
    })
  })

  test('TEST: test refresh_token and get tokens info', async ({
    apiAuth,
    userCreation
  }) => {
  // PREREQ: user is signed in
    let { json, db, user } = await test.step('DO: sign in with existing\'s user credentials', async () => {
      const [user] = userCreation
      const signInResponse = await apiAuth.signIn({
        login: user.login,
        password: user.password
      })
      const json: Tokens = await signInResponse.json()
      const db = new DBUsers()
      return { json, db, user }
    })

    await test.step('DO: request refresh_token with existing refresh token', async () => {
      const refreshResponse = await apiAuth.refreshTokens({
        refresh_token: json.refresh_token
      })

      await test.step('EXPECT: 200 and new tokens', async () => {
        json = await refreshResponse.json()
        expect(json).toHaveProperty('access_token')
        expect(json).toHaveProperty('refresh_token')
        expect(json).toHaveProperty('user')
      })

      await test.step('EXPECT: new tokens saved into the DB', async () => {
        const usersInfo = await db.getUsersInfo([user._id as ObjectId])
        if (usersInfo) {
          const dbUserTokens = usersInfo[0].tokenDocument[0]
          expect(dbUserTokens.access_token).toBe(json.access_token)
          expect(dbUserTokens.refresh_token).toBe(json.refresh_token)
          expect(String(dbUserTokens.user)).toBe(String(json.user))
        } else {
          expect(1, 'usersInfo is falsy, something wrong').toBeFalsy()
        }
      })
    })
  })
})
