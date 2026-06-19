import { MongoClient } from "mongodb";

//let client = null;

export async function connect(uri: string) {
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
    });

    await client.connect();
    return client;
  } catch (error: any) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}
