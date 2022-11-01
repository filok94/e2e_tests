import { Collection, Db, Filter, MongoClient, ObjectId } from "mongodb";
import { Tokens } from "./../models/tokens";
import { User } from "./../models/user";

class DBBase {
	public db: Db;
	public usersCollection: Collection<User>;
	public tokenCollection: Collection<Tokens>;
	public client: MongoClient;
	constructor() {
		this.client = new MongoClient(process.env.DB_URI);
		this.db = this.client.db(process.env.DB_NAME);
		this.usersCollection = this.db.collection<User>("users");
		this.tokenCollection = this.db.collection<Tokens>("tokens");
	}
}

export class DBUsers extends DBBase {
	async addUsers(users: User[]) {
		try {
			const usersIntoDb = [];
			for (let user of users) {
				usersIntoDb.push(
					new User(user.login, await user.getHashPassword(), user.is_admin)
				);
			}
			const createdUsers = await this.usersCollection.insertMany(usersIntoDb);
			return Object.values(createdUsers.insertedIds);
		} catch (e) {
		} finally {
			await this.client.close();
		}
	}
	async deleteUsers(users: User[] | ObjectId[]) {
		try {
			const usersDeleteFilter: Filter<User> =
				users[0] instanceof User
					? {
							login: { $in: users.map((e) => e.login) },
					  }
					: { _id: { $in: users as ObjectId[] } };
			let tokensDeleteFilter: Filter<Tokens> = null;
			if (users[0] instanceof User) {
				const idsToDelete = await this.usersCollection
					.find(usersDeleteFilter)
					.toArray();
				tokensDeleteFilter = { user: { $in: idsToDelete.map((e) => e._id) } };
			} else {
				tokensDeleteFilter = { user: { $in: users as ObjectId[] } };
			}
			await this.tokenCollection.deleteMany(tokensDeleteFilter);
			await this.usersCollection.deleteMany(usersDeleteFilter);
		} catch (e) {
			console.log(e);
		} finally {
			await this.client.close();
		}
	}

	async deleteTokens(userIds: ObjectId[]) {
		try {
			await this.tokenCollection.deleteMany({ _id: { $in: userIds } });
		} catch (e) {
			console.log(e);
		} finally {
			await this.client.close();
		}
	}
}
