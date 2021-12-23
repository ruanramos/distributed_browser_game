import { connect } from 'mongoose'

export const dbConnection = async () => {
  async function main () {
    const a = await connect('mongodb://localhost:27017/shop')
    console.log('Connected to database')
    return a
  }
  main().catch(err => console.log(err))
}
