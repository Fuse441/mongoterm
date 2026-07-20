export const EVENTS = Object.freeze({
  DB_CONNECT: "db:connect",
  DB_FETCH_DB: "db:fetchDatabases",
  DB_DATABASES_SELECTED: "db:databaseSelected",
  DB_DATABASES_LOADED: "db:databasesLoaded",
  DB_COLLECTIONS_SELECTED: "db:collectionSelected",
  DB_COLLECTIONS_LOADED: "db:collectionsLoaded",
  QUERY_RESULT: "query:result",
  QUERY_SEND: "query:send",
  QUERY_ERROR: "query:error",
  RECORD_UPDATE: "record:update",
  TOAST_SHOW: "show:toast",
  RECORD_DELETE: "delete:record",
  RECORD_DUPLICATE: "duplicate:record",
  CONNECTION_UPDATE: "connection:update",
  CONNECTION_DELETE: "connection:delete",
  DATABASE_CREATE: "database:create",
  DATABASE_DROP: "database:drop",
});

export enum TYPE_LOGGER {
  CONNECT_MONGO_DB = "connectMongoDB",
}
