import { MongoClient } from "mongodb";

let client = null;

export async function connect(uri) {
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
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
