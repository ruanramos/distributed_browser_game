const express = require('express');
const websocketServer = require('websocket').server;
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

// mongoose.connect()

const port = 3000;
const host = "0.0.0.0";
// const host = "localhost";
const app = express();

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.delete("/game/:id", function (req, res) {
    // delete game
    delete games[req.params.id];
    res.sendStatus(200);
})

app.delete("/game", function (req, res) {
    // delete all games
    for (const member in games) delete games[member];
    res.sendStatus(200);
});

let clients = {};
let games = {};

const METHODS = { PLAY: 'play', CREATE: 'create', JOIN: 'join', CONNECT: 'connect', UPDATE: 'update' };
const MAX_PLAYERS = 3;

// TODO make colors bound to game, not to server
let COLORS = ['red', 'green', 'yellow', 'black', 'blue', 'purple', 'orange', 'Maroon', 'Salmon', 'Silver', 'Lime', 'Aqua', 'Fuchsia', 'Navy', 'Teal'];
let usedColors = [];

app.addListener('connection', () => console.log('Received new client connection'));

const server = app.listen(process.env.PORT || port, host, () => {
    console.log(`App listening at http://${host}:${port}`);
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
    });

    // send back the client connect
    connection.send(JSON.stringify({
        method: METHODS.CONNECT,
        clientId: clientId,
        games: gameIds
    }));

    connection.on('open', () => console.log('opened!'));

    connection.on('close', () => {
        delete clients[clientId];

        // delete client from games it had joined previously
        Object.keys(games).forEach(g => {
            const clientsAfterRemoval = games[g].clients.filter(client => client.clientId !== clientId);
            if (clientsAfterRemoval.length !== games[g].clients.length) {
                games[g].clients = clientsAfterRemoval;
                console.log(`Removing client ${clientId} from game ${g} due to closed connection`);
            }
        });

        console.log("Client Closed!");
    });
    connection.on('message', (message) => {
        // TODO Can fail if client dont send json
        const clientMessage = JSON.parse(message.utf8Data);

        // received message from client
        if (clientMessage.method === METHODS.CREATE) {
            const gameId = uuidv4();
            const newGame = {
                gameCreator: clientId,
                gameId: gameId,
                clients: [],
                ballsNum: 20,
                state: new Array(20).fill(0)
            }

            games[gameId] = newGame;
            console.log(`Game ${gameId} created by client ${clientMessage.clientId}`);

            const payload = {
                method: METHODS.CREATE,
                game: {
                    gameCreator: clientId,
                    gameId: gameId,
                    clients: [],
                    ballsNum: 20
                }
            };

            Object.keys(clients).forEach(c => {
                clients[c].send(JSON.stringify(payload));
            });

            console.log(`Broadcasting new game ${gameId} to all clients`);

            broadcastGameState(gameId, clientId);
            console.log(`Starting periodic broadcast of game ${gameId} to clients that joined it`);

        }

        // a client want to join
        if (clientMessage.method === METHODS.JOIN) {
            const gameId = clientMessage.gameId;
            const clientId = clientMessage.clientId;
            const color = COLORS.pop();
            usedColors.push(color);

            // check if game is full
            if (games[gameId].clients.length >= MAX_PLAYERS) {
                console.log(`Client ${clientId} could not join game ${gameId} because it is full`);
                return;
            }

            // Client cant join a game he has already joined
            if (games[gameId].clients.filter(c => c.clientId === clientId).length > 0) {
                console.log(`Client ${clientId} could not join game ${gameId} because it has already joined`);
                return;
            }

            games[gameId].clients.push({
                clientId: clientId,
                color: color
            });
            console.log(`Client ${clientId} joined game ${gameId} as color ${color}`);

            // tell all clients in this game a new client has joined
            const payload = {
                method: METHODS.JOIN,
                game: games[gameId]
            };
            games[gameId].clients.forEach(c => {
                clients[c.clientId].send(JSON.stringify(payload));
            });

            console.log(`Broadcasting to all clients that ${clientId} joined game ${gameId} as color ${color}`);

        }

        // a client made a move
        if (clientMessage.method === METHODS.PLAY) {
            const gameId = clientMessage.gameId;
            const client = clientMessage.client;
            const ballId = clientMessage.ballId;
            const game = games[gameId];

            // update game state server side
            game.state[ballId] = client.color;

            console.log(`Client ${client.clientId} played on ball ${ballId + 1}`);
        }
    });
})

function broadcastGameState(gameId, client) {
    const game = games[gameId];

    setInterval(() => {
        const payload = {
            method: METHODS.UPDATE,
            game: {
                gameId: gameId,
                state: game.state
            }
        };

        if (game.clients.length > 0) {
            game.clients.forEach(c => {
                if (c.clientId !== client.clientId) clients[c.clientId].send(JSON.stringify(payload));
            });
            console.log(`Broadcasting game state to all clients in game ${gameId}`);
        }

    }, 100);
}