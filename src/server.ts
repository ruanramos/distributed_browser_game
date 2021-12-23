import express, { Request, Response } from 'express'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { connection, request, server } from 'websocket'
import { game } from './@types/types'

const WebsocketServer = server

const port: number | undefined = parseInt(process.env.PORT as string) || 9001
// const host = "0.0.0.0";
const host = 'localhost'
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', function (req: Request, res: Response): void {
  res.sendFile(path.join(__dirname, '/views/index.html'))
})

app.delete('/game/:id', function (req: Request, res: Response): void {
  // delete game
  delete games[req.params.id]
  res.sendStatus(200)
})

app.delete('/game', function (req: Request, res: Response): void {
  // delete all games
  for (const member in games) delete games[member]
  res.sendStatus(200)
})

const clients: Record<string, connection> = {}
const games: Record<string, any> = {}

const METHODS = { PLAY: 'play', CREATE: 'create', JOIN: 'join', CONNECT: 'connect', UPDATE: 'update', REMOVE: 'remove', REFRESH: 'refresh' }
const MAX_PLAYERS = 3

// TODO make colors bound to game, not to server
const COLORS = ['red', 'green', 'yellow', 'black', 'blue', 'purple', 'orange', 'Maroon', 'Salmon', 'Silver', 'Lime', 'Aqua', 'Fuchsia', 'Navy', 'Teal']
const usedColors = []

app.addListener('connection', () => console.log('Received new client connection'))

const myServer = app.listen(port, host, () => {
  console.log(`App listening at http://${host}:${port}`)
})

const wsServer = new WebsocketServer({
  httpServer: myServer
})

wsServer.on('request', (req: request) => {
  // new client connection
  const connection = req.accept(undefined, req.origin)

  // generate new client id
  const clientId = uuidv4()
  clients[clientId] = connection

  const gameIds: string[] = []
  Object.keys(games).forEach(g => {
    gameIds.push(g)
  })

  // send back the client connect
  connection.send(JSON.stringify({
    method: METHODS.CONNECT,
    clientId: clientId,
    games: gameIds
  }))

  connection.on('close', () => {
    delete clients[clientId]

    // delete client from games it had joined previously
    Object.keys(games).forEach(g => {
      const clientsAfterRemoval = games[g].clients.filter((client: { clientId: string }) => client.clientId !== clientId)
      if (clientsAfterRemoval.length !== games[g].clients.length) {
        games[g].clients = clientsAfterRemoval
        console.log(`Removing client ${clientId} from game ${g} due to closed connection`)
      }
    })

    console.log('Client Closed!')
  })
  connection.on('message', (message: any) => {
    // TODO Can fail if client dont send json
    const clientMessage = JSON.parse(message.utf8Data)

    // received message from client
    if (clientMessage.method === METHODS.CREATE) {
      const gameId = uuidv4()
      const newGame: game = {
        gameCreator: clientId,
        gameId: gameId,
        clients: [],
        ballsNum: 20,
        state: new Array(20).fill(0)
      }

      games[gameId] = newGame
      console.log(`Game ${gameId} created by client ${clientMessage.clientId}`)

      const payload = {
        method: METHODS.CREATE,
        game: {
          gameCreator: clientId,
          gameId: gameId,
          clients: [],
          ballsNum: 20
        }
      }

      Object.keys(clients).forEach(c => {
        clients[c].send(JSON.stringify(payload))
      })

      console.log(`Broadcasting new game ${gameId} to all clients`)

      broadcastGameState(gameId, clientId)
      console.log(`Starting periodic broadcast of game ${gameId} to clients that joined it`)
    }

    // a client removed a game
    if (clientMessage.method === METHODS.REFRESH) {
      broadcastExistentGames()
    }

    // a client want to join
    if (clientMessage.method === METHODS.JOIN) {
      const gameId = clientMessage.gameId
      const clientId = clientMessage.clientId
      const color = COLORS.pop()
      usedColors.push(color)

      // check if game is full
      if (games[gameId].clients.length >= MAX_PLAYERS) {
        console.log(`Client ${clientId} could not join game ${gameId} because it is full`)
        return
      }

      // Client cant join a game he has already joined
      if (games[gameId].clients.filter((c: { clientId: string }) => c.clientId === clientId).length > 0) {
        console.log(`Client ${clientId} could not join game ${gameId} because it has already joined`)
        return
      }

      games[gameId].clients.push({
        clientId: clientId,
        color: color
      })
      console.log(`Client ${clientId} joined game ${gameId} as color ${color}`)

      // tell all clients in this game a new client has joined
      const payload = {
        method: METHODS.JOIN,
        game: games[gameId]
      }
      games[gameId].clients.forEach((c: { clientId: string | number }) => {
        clients[c.clientId].send(JSON.stringify(payload))
      })

      console.log(`Broadcasting to all clients that ${clientId} joined game ${gameId} as color ${color}`)
    }

    // a client made a move
    if (clientMessage.method === METHODS.PLAY) {
      const gameId = clientMessage.gameId
      const client = clientMessage.client
      const ballId = clientMessage.ballId
      const game = games[gameId]

      // update game state server side
      game.state[ballId] = client.color

      console.log(`Client ${client.clientId} played on ball ${ballId + 1}`)
    }
  })
})

function broadcastGameState (gameId: string, clientId: string) {
  const game = games[gameId]

  setInterval(() => {
    const payload = {
      method: METHODS.UPDATE,
      game: {
        gameId: gameId,
        state: game.state
      }
    }

    if (game.clients.length > 0) {
      game.clients.forEach((c: { clientId: string | number }) => {
        if (c.clientId !== clientId) clients[c.clientId].send(JSON.stringify(payload))
      })
      console.log(`Broadcasting game state to all clients in game ${gameId}`)
    }
  }, 100)
}

function broadcastExistentGames () {
  const gameIds: string[] = []
  Object.keys(games).forEach(g => {
    gameIds.push(g)
  })

  const payload = {
    method: METHODS.REFRESH,
    games: gameIds
  }

  Object.keys(clients).forEach(c => {
    clients[c].send(JSON.stringify(payload))
  })

  console.log('Broadcasting existing games to all clients')
}
