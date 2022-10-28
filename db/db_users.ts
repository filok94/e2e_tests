import { User } from "./../models/user";
import { Db, MongoClient, Collection } from "mongodb";

class DBBase {
	public db: Db;
	public usersCollection: Collection<User>;
	public client: MongoClient;
	constructor() {
		this.client = new MongoClient(process.env.DB_URI);
		this.db = this.client.db(process.env.DB_NAME);
		this.usersCollection = this.db.collection<User>("users");
	}
}

export class DBUsers extends DBBase {
	async addUsers(users: User[]) {
		try {
			await this.usersCollection.insertMany([...users]);
		} catch (e) {
		} finally {
			await this.client.close();
		}
	}
	async deleteUsers(users: User[]) {
		try {
			await this.usersCollection.deleteMany({
				login: { $in: users.map((e) => e.login) },
			});
			// await this.usersCollection.deleteMany({
			// 	login: { $regex: "autoqa", $options: "i" },
			// });
		} catch (e) {
			console.log(e);
		}
	}
}
