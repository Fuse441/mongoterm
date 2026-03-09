import { eventBus } from "../core/eventBus.js";
import { screen } from "../core/screen.js";
import { state } from "../core/state.js";
import { connect } from "./mongodb.js";

/*
|--------------------------------------------------------------------------
| EVENT: CONNECT DATABASE
|--------------------------------------------------------------------------
*/
screen.debug("mongoService loaded");
eventBus.on("db:connect", async (uri) => {
  try {
    screen.debug("connecting...");

    await connectMongo(uri);

    const dbs = await fetchDatabases();

    state.databases = dbs;

    eventBus.emit("db:databasesLoaded", dbs);

    screen.debug("databases loaded");
  } catch (err) {
    screen.debug(err.message);
  }
});

/*
|--------------------------------------------------------------------------
| EVENT: LOAD COLLECTIONS
|--------------------------------------------------------------------------
*/

eventBus.on("db:databaseSelected", async (dbName) => {
  try {
    const cols = await fetchCollections(dbName);
    state.collections = cols;
    //eventBus.emit("db:collectionsLoaded", cols);
  } catch (err) {
    screen.debug(err.message);
  }
});

/*
|--------------------------------------------------------------------------
| EVENT: RUN QUERY
|--------------------------------------------------------------------------
*/

eventBus.on("db:collectionSelected", async (colName) => {
  try {
    const docs = await fetchQuery(colName);

    eventBus.emit("query:result", docs);
  } catch (err) {
    screen.debug(err.message);
  }
});

/*
|--------------------------------------------------------------------------
| FUNCTIONS
|--------------------------------------------------------------------------
*/

async function connectMongo(uri) {
  if (state.mongoClient) {
    await state.mongoClient.close();
  }

  state.mongoClient = await connect(uri);

  screen.debug("connected!");
}

async function fetchDatabases() {
  const admin = state.mongoClient.db().admin();

  const dbs = await admin.listDatabases();

  return dbs.databases.map((d) => d.name);
}

async function fetchCollections(dbName) {
  const db = state.mongoClient.db(dbName);

  const cols = await db.listCollections().toArray();

  return cols.map((c) => c.name);
}

async function fetchQuery(colName) {
  const dbName = state.databases[state.selectedDatabaseIndex];

  const docs = await state.mongoClient
    .db(dbName)
    .collection(colName)
    .find({})
    .limit(50)
    .toArray();

  return docs;
}
