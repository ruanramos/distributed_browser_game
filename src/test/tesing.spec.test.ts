import { Book } from '../model/book'

test('should be ok', () => {
  const myBook = new Book({ name: 'Harry Potter' })
  expect(myBook.name).toBe('Harry Potter')
})
