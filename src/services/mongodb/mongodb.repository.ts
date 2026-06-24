import { ObjectId } from "mongodb";
import { state } from "@/shared/state";
import { EVENTS } from "@/services/enum";
import { connect } from "./mongodb.connector";
import { QueryService } from "@/services/query.service";
import { logger } from "@/utils/logger/logger.service";
import { appInstance } from "@/app";
import { EventMongoTerm } from "@/core/eventBus";

export class MongoRepository {
  private eventBus: EventMongoTerm;
  constructor(eventBus: EventMongoTerm) {
    this.eventBus = eventBus;
  }
    



public getClient() {
  if (!state.mongoClient) {
    throw new Error("MongoDB not connected");
  }

  return state.mongoClient;
}

public async connectMongo(uri: string) {
  if (state.mongoClient) {
    await state.mongoClient.close();
  }

  state.mongoClient = await connect(uri);

  const clusterName = state.mongoClient.options.hosts?.[0]?.host ?? "localhost";

  state.queryService = new QueryService(clusterName);
}

public async  fetchDatabases() {
  const admin = this.getClient().db().admin();

  const result = await admin.listDatabases();

  return result.databases.map((db) => db.name);
}

public async  fetchCollections(dbName: string) {
  const db = this.getClient().db(dbName);

  const collections = await db.listCollections().toArray();

  return collections.map((c) => c.name);
}

public parseQuery(query?: string): Record<string, unknown> {
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

 this.eventBus.emit(EVENTS.TOAST_SHOW, {
      statusCode: 400,
      message: "Invalid query format",
    });
    appInstance.renderScreen();
    return {};
  }
}
public async fetchQuery(
  query?:  string, 
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

  const filter = this.parseQuery(query);
  logger.debug({ message: "Parsed query filter", filter });
  state.queryService.saveQuery(query ?? "{}");

  const collection = this.getClient().db(dbName).collection(colName);
  logger.debug({ message: "Fetching documents from collection", dbName, colName, filter });
  const skip = (page - 1) * pageSize;

  const [docs, total] = await Promise.all([
    collection.find(filter).skip(skip).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);
  logger.debug({ message: "Query result", docs, total });
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

public async updateRecord(
  _id: ObjectId,
  updateFields: Record<string, unknown>,
) {
  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  await this.getClient().db(dbName).collection(colName).updateOne(
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

public async  deleteRecord(id: string) {
  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  await this.getClient()
    .db(dbName)
    .collection(colName)
    .deleteOne({
      _id: new ObjectId(id),
    });

  this.eventBus.emit(EVENTS.TOAST_SHOW, {
    statusCode: 200,
    message: "record deleted!",
  });
}

public async duplicateRecord(id: string) {
  const result = await this.fetchQuery(
    JSON.stringify({
      _id: id,
    }),
  );
  logger.debug({ message: "Duplicate record result", result });
  const doc = result.docs[0];

  if (!doc) {
   this.eventBus.emit(EVENTS.TOAST_SHOW, {
      statusCode: 404,
      message: "Document not found",
    });
//    throw new Error("Document not found");
  }

  const dbName = state.databases[state.selectedDatabaseIndex];
  const colName = state.collections[state.selectedCollectionIndex];

  await this.getClient()
    .db(dbName)
    .collection(colName)
    .insertOne({
      ...(doc as object),
      _id: new ObjectId(),
    });
  this.eventBus.emit(EVENTS.TOAST_SHOW, {
    statusCode: 200,
    message: "record duplicated!",
  });
}
}
