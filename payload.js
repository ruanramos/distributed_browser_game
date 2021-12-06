class Payload {
    constructor(clientId, method) {
        this.clientId = clientId;
        this.method = method;
    }

    stringify() {
        return JSON.stringify({
            clientId: this.clientId,
            method: this.method
        })
    }
}

class GamePayload {
    constructor(method, game) {
        this.method = method;
        this.game = game;
        this.clients = []
    }

    stringify() {
        return JSON.stringify({
            gameId: this.game.gameId,
            method: this.method,
            clients: this.clients
        })
    }
}


module.exports = { Payload, GamePayload };