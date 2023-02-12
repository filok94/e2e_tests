import { DBGames } from './../db/db_games'
import { expect, test } from '../fixtures/api.fixture'

test.describe('tests get all games', async () => {
  test('test auth get_all_games', async ({ apiGames }) => {
    // STEP: request without token
    const res = await apiGames.getAll()
    let json = await res.json()
    // RESULT: 401
    expect(res.status()).toBe(401)
    expect(json.message).toBe('Unauthorized')

    // STEP: request with bad tokenJson
    for (const badToken of ['123', 123, [], {
      token: 123
    }]) {
      const res = await apiGames.getAll({
        token: badToken
      })
      json = await res.json()
      // RESULT: 401
      expect(res.status()).toBe(401)
      expect(json.message).toBe('Unauthorized')
    }
  })

  test('test schema get_all_games', async ({ apiAuth, userCreation, apiGames }) => {
    const [user] = userCreation
    const token = await apiAuth.signIn(user.getAuthJson())
    const tokenJson = await token.json()
    // STEP: request the game
    const res = await apiGames.getAll({
      token: tokenJson.access_token
    })
    const resJson = await res.json()
    // RESULT: 200
    expect(res.status()).toBe(200)
    // RESULT: schema is with expected type
    expect(typeof resJson[0]._id).toBe('string')
    expect(typeof resJson[0].title).toBe('string')
    expect(typeof resJson[0].description).toBe('string')
    expect(resJson[0].persons.length).toBeGreaterThan(0)
    for (const person of resJson[0].persons) {
      expect(typeof person).toBe('string')
    }
    // RESULT: first game is as in the db
    const db = new DBGames()
    const dbGame = await db.getGameByTitle(String(resJson[0].title))
    expect(dbGame?.title).toBe(resJson[0].title)
    expect(dbGame?.description).toBe(resJson[0].description)
    expect(dbGame?.link).toBe(resJson[0].link)
    for (const person of resJson[0].persons) {
      const dbPerson: string | undefined = (dbGame?.persons as Array<string | undefined>).find((e) => e === person)
      expect(String(dbPerson)).toBe(person)
    }
  })
})
