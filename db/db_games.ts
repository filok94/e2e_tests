import { Game } from '../models/game'
import { DBBase } from './db_base'

export class DBGames extends DBBase {
  async getGameByTitle (id: string): Promise<Game | null | undefined> {
    try {
      return await this.gameCollection.findOne({ title: id })
    } catch (e) {
      console.log(e)
    } finally {
      this.client.close()
    }
  }
}
