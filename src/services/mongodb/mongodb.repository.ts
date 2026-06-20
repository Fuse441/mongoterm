import { ObjectId } from "mongodb";
import { state } from "@/shared/state";
import { EVENTS } from "@/services/enum";
import { connect } from "./mongodb.connector";
import { QueryService } from "@/services/query.service";
import { logger } from "@/utils/logger/logger.service";
import { appInstance } from "@/app";

function getClient() {
  if (!state.mongoClient) {
    throw new Error("MongoDB not connected");
  }

  return state.mongoClient;
}

export async function connectMongo(uri: string) {
  if (state.mongoClient) {
    await state.mongoClient.close();
  }

  state.mongoClient = await connect(uri);

  const clusterName = state.mongoClient.options.hosts?.[0]?.host ?? "localhost";

  state.queryService = new QueryService(clusterName);
}

export async function fetchDatabases() {
  const admin = getClient().db().admin();

  const result = await admin.listDatabases();

  return result.databases.map((db) => db.name);
}

export async function fetchCollections(dbName: string) {
  const db = getClient().db(dbName);

  const collections = await db.listCollections().toArray();

  return collections.map((c) => c.name);
}

export function parseQuery(query?: string): Record<string, unknown> {
  if (!query?.trim()) {
    return {};
  }

  try {
    return JSON.parse(query, (_, value) => {
      if (
        typeof value === "string" &&
        ObjectId.isValid(value) &&
        value.length === 24
      ) {
        return new ObjectId(value);
      }

      return value;
    });
  } catch (error) {
    // logger.error({
    //   message: "Error parsing query",
    //   error,
    //   query,
    // });

 appInstance.eventBus.emit(EVENTS.TOAST_SHOW, {
      statusCode: 400,
      message: "Invalid query format",
    });
    appInstance.renderScreen();
    return {};
  }
}
export async function fetchQuery(
  query?: string,
  {
    page = state.page,
    pageSize =state.pageSize,
  }: {
    page?: number;
    pageSize?: number;
  } = {},
) {
    logger.debug({ message: "Fetching query", query, page, pageSize });
  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  const filter = parseQuery(query);
  logger.debug({ message: "Parsed query filter", filter });
  state.queryService.saveQuery(query ?? "{}");

  const collection = getClient().db(dbName).collection(colName);

  const skip = (page - 1) * pageSize;

  const [docs, total] = await Promise.all([
    collection.find(filter).skip(skip).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);
   state.totalPages = Math.ceil(total / pageSize); 
  return {
    docs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: state.totalPages    },
  };
}

export async function updateRecord(
  _id: ObjectId,
  updateFields: Record<string, unknown>,
) {
  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  await getClient().db(dbName).collection(colName).updateOne(
    { _id },
    {
      $set: updateFields,
    },
    {
      upsert: true,
    },
  );

  appInstance.eventBus.emit(EVENTS.TOAST_SHOW, {
    statusCode: 200,
    message: "record saved!",
  });
}

export async function deleteRecord(id: string) {
  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  await getClient()
    .db(dbName)
    .collection(colName)
    .deleteOne({
      _id: new ObjectId(id),
    });

  appInstance.eventBus.emit(EVENTS.TOAST_SHOW, {
    statusCode: 200,
    message: "record deleted!",
  });
}

export async function duplicateRecord(id: string) {
  const result = await fetchQuery(
    JSON.stringify({
      _id: id,
    }),
  );
  logger.debug({ message: "Duplicate record result", result });
  const doc = result.docs[0];

  if (!doc) {
   appInstance.eventBus.emit(EVENTS.TOAST_SHOW, {
      statusCode: 404,
      message: "Document not found",
    });
//    throw new Error("Document not found");
  }

  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  await getClient()
    .db(dbName)
    .collection(colName)
    .insertOne({
      ...(doc as object),
      _id: new ObjectId(),
    });
  appInstance.eventBus.emit(EVENTS.TOAST_SHOW, {
    statusCode: 200,
    message: "record duplicated!",
  });
}
