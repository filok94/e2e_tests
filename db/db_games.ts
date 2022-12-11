import { Game } from "../models/game";
import { DBBase } from "./db_base";

export class DBGames extends DBBase {
	async getGameByTitle (id: string): Promise<Game | null | undefined> {
		try {
			const games = await this.gameCollection
				.findOne({
					title: id
				});
			return games;
		}
		catch (e) {
			console.log(e);
		}
		finally{
			this.client.close();
		}
	}
}
