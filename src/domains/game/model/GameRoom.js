import { GameSession } from "GameSession.js"

export class GameRoom {
	constructor() {
		this.rooms = []; //GameSession 저장
		this.roomCount;
	}

	getRoomNum() {
		return this.roomCount;
	}
}
