import { DBGames } from './../db/db_games'
import { expect, test } from '../fixtures/api.fixture'
import { Tokens } from '../models/tokens'

test.describe('SUITE: tests get all games', async () => {
  test('TEST: test auth get_all_games', async ({ apiGames }) => {
    await test.step('DO: request without token', async () => {
      const res = await apiGames.getAll()
      const json = await res.json()

      await test.step('EXPECT: 401', async () => {
        expect(res.status()).toBe(401)
        expect(json.message).toBe('Unauthorized')
      })
    })

    await test.step('DO: request with bad tokenJson', async () => {
      for (const badToken of ['123', 123, [], {
        token: 123
      }]) {
        const res = await apiGames.getAll({
          token: badToken
        })
        const json = await res.json()
        test.step('EXPECT: 401', async () => {
          expect(res.status()).toBe(401)
          expect(json.message).toBe('Unauthorized')
        })
      }
    })
  })

  test('TEST: test schema get_all_games', async ({ apiAuth, userCreation, apiGames }) => {
    const token = await test.step<Tokens>('DO: sign in', async () => {
      const [user] = userCreation
      const token = await apiAuth.signIn(user.getAuthJson())
      const tokenJson = await token.json()
      return tokenJson
    })

    const { res, resJson } = await test.step('DO: request the game', async () => {
      const res = await apiGames.getAll({ token: token.access_token })
      const resJson = await res.json()
      return { res, resJson }
    })

    await test.step('EXPECT: 200', async () => {
      expect(res.status()).toBe(200)
    })

    await test.step('EXPECT: schema has expected type', async () => {
      expect(typeof resJson[0]._id).toBe('string')
      expect(typeof resJson[0].title).toBe('string')
      expect(typeof resJson[0].description).toBe('string')
      expect(resJson[0].persons.length).toBeGreaterThan(0)
      for (const person of resJson[0].persons) {
        expect(typeof person).toBe('string')
      }
    })

    await test.step('EXPECT: first game has the same properties as in the db', async () => {
      const db = new DBGames()
      const dbGame = await db.getGameByTitle(String(resJson[0].title))
      expect(dbGame?.title).toBe(resJson[0].title)
      expect(dbGame?.description).toBe(resJson[0].description)
      expect(dbGame?.link).toBe(resJson[0].link)
      for (const person of resJson[0].persons) {
        const dbPerson: string | undefined = (dbGame?.persons as Array<string | undefined>).find((e) => String(e) === person)
        expect(String(dbPerson)).toBe(person)
      }
    })
  })
})
