import { Db, Collection, MongoClient } from "mongodb";
import { Game } from "../models/game";
import { Tokens } from "../models/tokens";
import { User } from "../models/user";

export class DBBase {
	public db: Db;
	public usersCollection: Collection<User>;
	public tokenCollection: Collection<Tokens>;
	public gameCollection: Collection<Game>;
	public client: MongoClient;
	constructor () {
		this.client = new MongoClient(String(process.env.DB_URI));
		this.db = this.client.db(process.env.DB_NAME);
		this.usersCollection = this.db.collection<User>("users");
		this.tokenCollection = this.db.collection<Tokens>("tokens");
		this.gameCollection = this.db.collection<Game>("games");
	}
}
