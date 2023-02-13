/* eslint-disable camelcase */
import * as bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'
import { generator } from '../helpers/generator'

const { randomString } = generator()

export class User {
  _id: ObjectId | null
  constructor (
		public login: string | null = null,
		public password: string | null = null,
		public is_admin: boolean | null = null
  ) {
    this.login = login || randomString()
    this.password = password || randomString()
    this._id = null
  }

  getAuthJson = () => {
    return { login: this.login, password: this.password }
  }

  getHashPassword = async () => this.password ? await bcrypt.hash(this.password, 12) : null

  setId = (id: ObjectId) => (this._id = id)
}
