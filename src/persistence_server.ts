import express, { Request, Response } from 'express'
import { dbConnection } from './database/index'
import { Book } from './model/book'

dbConnection()

const port: number | undefined = parseInt(process.env.PORT as string) || 9001
const host = 'localhost'
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/book', (req: Request, res: Response): void => {
  Book.find({}, (err, books) => {
    try {
      books.forEach(b => console.log(b))
    } catch (error) {
      console.log(err)
      res.sendStatus(500)
    }
  })
  res.sendStatus(200)
})

app.get('/book/:id', (req: Request, res: Response): void => {
  Book.findById(req.params.id).exec().then(book => console.log(book.name))
  res.sendStatus(200)
})

app.post('/book', (req, res) => {
  // create book
  const book = new Book({ name: req.body.name })
  book.save()
  res.sendStatus(200)
})

app.put('/book/:id', (req, res) => {
  // update book
  Book.findByIdAndUpdate(req.params.id, { name: req.body.name }).exec()
  res.sendStatus(200)
})

app.delete('/book:id', (req, res) => {
  // deleete book
  Book.findByIdAndDelete(req.params.id).exec()
  res.sendStatus(200)
})

app.addListener('connection', () => console.log('Received new client connection'))

app.listen(port, host, () => {
  console.log(`App listening at http://${host}:${port}`)
})
