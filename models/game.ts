import { ObjectId } from "mongodb";

interface TestData {
  index: number,
  question: string,
  answers: string[],
  right_answer: number
}

export class Game {
	_id: ObjectId | null;
	constructor (    public title: string,
    public description: string,
    public link: string,
		public persons: string[] | ObjectId[],
		public test_data: TestData[]
	){
		this._id = null;
		this.title = title;
		this.description = description;
	}
}