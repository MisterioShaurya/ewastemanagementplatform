import { MongoClient } from 'mongodb'

const options = {}
let clientPromise: Promise<MongoClient> | undefined

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const getClient = () => {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Please add MONGODB_URI to .env.local')
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) global._mongoClientPromise = new MongoClient(uri, options).connect()
    return global._mongoClientPromise
  }
  clientPromise ??= new MongoClient(uri, options).connect()
  return clientPromise
}

export const listingsCollection = async () => {
  const mongo = await getClient()
  return mongo.db(process.env.MONGODB_DB || 'scrapeconnect').collection('listings')
}
