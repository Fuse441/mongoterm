import { eventBus } from "../core/eventBus.js";
import { screen } from "../core/screen.js";
import { state } from "../core/state.js";
import { EVENTS } from "./enum.js";
import { clearLoading, startLoading } from "./loading.js";
import { connect } from "./mongodb.js";

/*
|--------------------------------------------------------------------------
| EVENT: CONNECT DATABASE
|--------------------------------------------------------------------------
*/
screen.debug("mongoService loaded");
eventBus.on(EVENTS.DB_CONNECT, async (uri) => {
  try {
    startLoading();
    await connectMongo(uri);

    const dbs = await fetchDatabases();

    state.databases = dbs;

    //eventBus.emit("db:databasesLoaded", dbs);
    //    screen.debug("databases loaded");
    eventBus.emit(EVENTS.DB_DATABASES_LOADED, {
      statusCode: 200,
      developerMessage: `connected successfully`,
    });
  } catch (err) {
    clearLoading();
    eventBus.emit(EVENTS.DB_DATABASES_LOADED, {
      statusCode: 500,
      developerMessage: err,
    });
    screen.debug(err.message);
  } finally {
    clearLoading();
  }
});

/*
|--------------------------------------------------------------------------
| EVENT: LOAD COLLECTIONS
|--------------------------------------------------------------------------
*/

eventBus.on(EVENTS.DB_DATABASES_SELECTED, async (dbName) => {
  try {
    const cols = await fetchCollections(dbName);
    state.collections = cols;

    eventBus.emit(EVENTS.DB_COLLECTIONS_LOADED, cols);
  } catch (err) {
    screen.debug(err.message);
  }
});

/*
|--------------------------------------------------------------------------
| EVENT: RUN QUERY
|--------------------------------------------------------------------------
*/

eventBus.on(EVENTS.DB_COLLECTIONS_SELECTED, async (colName) => {
  try {
    const docs = await fetchQuery();
    eventBus.emit(EVENTS.QUERY_RESULT, docs);
  } catch (err) {
    screen.debug(`[fetchQueryError] ${err.message} `);
  }
});
eventBus.on(EVENTS.QUERY_SEND, async (query) => {
  const docs = await fetchQuery(query);
  eventBus.emit(EVENTS.QUERY_RESULT, docs);
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
function parseQuery(queryString) {
  if (!queryString) {
    return {}; // ← empty = find all
  }

  try {
    return JSON.parse(queryString);
  } catch {
    screen.debug(`Invalid JSON query: ${queryString}`);
    return {};
  }
}
async function fetchQuery(query) {
  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  const filter = parseQuery(query);
  screen.debug(`dbName ==> ${dbName}`);
  const docs = await state.mongoClient
    .db(dbName)
    .collection(colName)
    .find(filter || {})
    .limit(50)
    .toArray();

  return docs;
}
