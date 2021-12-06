class Game {
    constructor(clientId, gameId) {
        this.gameCreator = clientId;
        this.gameId = gameId;
        this.clients = [];
        this.ballsNum = 20;
    }
}

module.exports = Game;