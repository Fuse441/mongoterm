import { MongoClient } from "mongodb";

let client;

export async function connect(uri) {
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000, // ดีกว่า connectTimeoutMS
    });

    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}

function getDb(name) {
  return client.db(name);
}
