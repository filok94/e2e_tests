import { Game } from "../models/game";
import { DBBase } from "./db_base";

export class DBGames extends DBBase {
	async getGameById (id: string): Promise<Game | undefined> {
		try {
			const games = await this.gameCollection.aggregate<Game>().match({
				_id: id
			}).toArray();
			return games[0];
		}
		catch (e) {
			console.log(e);

		}
	}
}