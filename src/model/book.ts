import { model, Schema } from 'mongoose'

const bookSchema = new Schema({
  name: String
})

const Book = model('Book', bookSchema)

export { Book }
