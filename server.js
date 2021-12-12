const express = require('express');
const websocketServer = require('websocket').server;
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

// mongoose.connect()

const port = 3000;
const app = express();

const client = express();
client.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

client.listen(3001, () => console.log('listening on http port 3001'));

let clients = {};
let games = {};

const METHODS = { PLAY: 'play', CREATE: 'create', JOIN: 'join', CONNECT: 'connect' };
const MAX_PLAYERS = 3;
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
    clients[clientId] = connection;

    let gameIds = [];
    Object.keys(games).forEach(g => {
        gameIds.push(g);
    })

    // send back the client connect
    connection.send(JSON.stringify({
        clientId: clientId,
        method: METHODS.CONNECT,
        games: gameIds
    }));

    connection.on('open', () => console.log('opened!'));
    connection.on('close', () => {
        delete clients[clientId];
        // TODO delete client from games it had joined
        console.log("Client Closed!");
    });
    connection.on('message', (message) => {
        // TODO Can fail if client dont send json
        const response = JSON.parse(message.utf8Data);

        // received message from client
        if (response.method === METHODS.CREATE) {
            const gameId = uuidv4();
            const newGame = {
                gameCreator: clientId,
                gameId: gameId,
                clients: [],
                ballsNum: 20
            }
            games[gameId] = newGame;
            console.log(`Game ${gameId} created by client ${response.clientId}`);

            // TODO broadcast a new game was created

            connection.send(JSON.stringify({
                method: METHODS.CREATE,
                game: newGame
            }));
            console.log(games)
        }

        // a client want to join
        if (response.method === METHODS.JOIN) {
            const gameId = response.gameId;
            const clientId = response.clientId;
            const color = COLORS.pop();
            usedColors.push(color);
            if (games[gameId].clients.length >= MAX_PLAYERS) {
                console.log(`Client ${clientId} could not join game ${gameId} because it is full`);
                return;
            }

            games[gameId].clients.push({ clientId: color });
            console.log(`Client ${clientId} joined game ${gameId}`);

            // tell all clients in this game a new client has joined
            const payload = {
                method: METHODS.JOIN,
                game: games[gameId]
            };
            games[gameId].clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload));
            });

        }

        if (response.method === 'list') {
            const p = JSON.stringify({ method: 'list', games: games });
            connection.send(p);
        }
    });
})