const express = require('express');
const websocketServer = require('websocket').server;
const mongoose = require('mongoose');

const payload = require('./payload');
const game = require('./game.ts');

const { v4: uuidv4 } = require('uuid');

const port = 3000;
const app = express();

const client = express();
client.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

client.listen(3001, () => console.log('listening on http port 3001'));

class Client {
    constructor(clientId, connection) {
        this.clientId = clientId;
        this.connection = connection;
    }
}

let clients = {};
let games = {};

const METHODS = { PLAY: 'play', CREATE: 'create', JOIN: 'join', CONNECT: 'connect' };
let COLORS = ['red', 'green', 'yellow', 'black', 'blue', 'purple', 'orange'];
let usedColors = [];

app.addListener('connection', () => console.log('Received new client connection'));

const server = app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

const wsServer = new websocketServer({
    httpServer: server
});

wsServer.on('request', (req, res) => {
    // new client connection
    const connection = req.accept(null, req.origin);

    // generate new client id
    const clientId = uuidv4();
    clients[clientId] = new Client(clientId, connection);

    // TODO send already created games to client
    const p = new payload.Payload(clientId, METHODS.CONNECT);

    // send back the client connect
    connection.send(p.stringify());

    connection.on('open', () => console.log('opened!'));
    connection.on('close', () => {
        delete clients[clientId];
        // TODO delete client from games it had joined
        console.log("Client Closed!");
    });
    connection.on('message', (message) => {
        // TODO Can fail if client dont send json
        const result = JSON.parse(message.utf8Data);

        // received message from client
        if (result.method === METHODS.CREATE) {
            const gameId = uuidv4();
            const newGame = new game(clientId, gameId);
            games[gameId] = newGame;
            console.log('Game created ' + gameId);
            const p = new payload.GamePayload(METHODS.CREATE, newGame);
            connection.send(p.stringify());
        } else if (result.method === METHODS.JOIN) {
            console.log(result);
            const gameId = result.gameId;
            const clientId = result.clientId;
            const color = COLORS.pop();
            usedColors.push(color);
            // TODO add max clients per game check
            games[gameId].clients.push({ clientId: color });
            const p = new payload.GamePayload(METHODS.JOIN, games[gameId]);
            connection.send(p.stringify());
        } else if (result.method === 'list') {
            console.log(games);
            // console.log(JSON.stringify(games));
            const p = JSON.stringify({ method: 'list', games: games });
            connection.send(p);
        }
    });
})