/* eslint-disable no-mixed-spaces-and-tabs */
import { Filter, ObjectId } from 'mongodb'
import { Tokens } from './../models/tokens'
import { User } from './../models/user'
import { DBBase } from './db_base'

type UserWithTokens = User & { tokenDocument: Tokens[] };
export class DBUsers extends DBBase {
  async addUsers (users: User[]) {
    try {
      const usersIntoDb: User[] = []
      for (const user of users) {
        usersIntoDb.push(
          new User(user.login, await user.getHashPassword(), user.is_admin)
        )
      }
      const createdUsers = await this.usersCollection.insertMany(usersIntoDb)
      return Object.values(createdUsers.insertedIds)
    } catch (e) {
      console.log(e)
    } finally {
      await this.client.close()
    }
  }

  async deleteUsers (users: User[] | ObjectId[]) {
    try {
      const usersDeleteFilter: Filter<User> =
				users[0] instanceof User
				  ? { login: { $in: (users as User[]).map((e) => e.login) } }
				  : { _id: { $in: users as ObjectId[] } }
      let tokensDeleteFilter: Filter<Tokens> | null = null
      if (users[0] instanceof User) {
        const idsToDelete = await this.usersCollection.find(usersDeleteFilter).toArray()
        tokensDeleteFilter = { user: { $in: (idsToDelete.map((e) => (e._id as ObjectId))) } }
      } else {
        tokensDeleteFilter = { user: { $in: users as ObjectId[] } }
      }
      if (tokensDeleteFilter) {
        await this.tokenCollection.deleteMany(tokensDeleteFilter)
      }
      await this.usersCollection.deleteMany(usersDeleteFilter)
    } catch (e) {
      console.log(e)
    } finally {
      await this.client.close()
    }
  }

  async updatedUserToken (data: {
		user: ObjectId | User | null;
		accessToken: string;
		refreshToken: string;
	}) {
    try {
      const userId = data.user instanceof User ? data.user._id : data.user
      if (userId) {
        await this.tokenCollection.updateOne({ user: userId },
          { $set: { access_token: data.accessToken, refresh_token: data.refreshToken } },
          { upsert: false }
        )
      }
    } catch (e) {
      console.log(e)
    }
  }

  async getUsersInfo (userIds: ObjectId[]): Promise<Array<UserWithTokens> | undefined> {
    try {
      const foundedUsers = await this.usersCollection.aggregate<UserWithTokens>()
        .match({ _id: { $in: userIds } })
        .lookup({
          from: 'tokens',
          localField: '_id',
          foreignField: 'user',
          as: 'tokenDocument'
        })
        .toArray()
      return foundedUsers
    } catch (e) {
      console.log(e)
    } finally {
      await this.client.close()
    }
  }
}
