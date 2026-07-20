import { ObjectId } from "mongodb";

import { state } from "@/shared/state";

import { EVENTS, TYPE_LOGGER } from "@/services/enum";
import { clearLoading, startLoading } from "@/services/loading";

import { logger } from "@/utils/logger/logger.service";

import { showToast } from "@/panels/toast.panel";
import { appInstance } from "@/app";
import { renderResult } from "@/panels/result.panel";
import {
  deleteConnection,
  saveConnection,
  updateConnection,
} from "../helper";
import { IConfigurationMongoConnection } from "@/types/config";
import { EventMongoTerm } from "@/core/eventBus";
import { MongoRepository } from "./mongodb.repository";
export class EventMongoService {
  private eventBus: EventMongoTerm;
  constructor(
    eventBus: EventMongoTerm,
    private mongoRepository: MongoRepository,
  ) {
    this.eventBus = eventBus;
  }

  public async initEventMongoService() {
    this.registerConnectionEvents();
    this.registerDatabaseEvents();
    this.registerCollectionEvents();
    this.registerQueryEvents();
    this.registerRecordEvents();
    this.registerConnectionCrudEvents();
    this.registerCollectionCrudEvents();
    this.registerCollectionLoadedEvent();
    this.registerDatabaseLoadedEvent();
    this.registerQueryResultEvent();
    logger.debug({ message: "Mongo events initialized" });
  }

  private registerConnectionEvents() {
    this.eventBus.on(
      EVENTS.DB_CONNECT,
      async (connections: Record<string, any>, onSave: boolean) => {
        const { connectionString } = connections;
        try {
          logger.debug({
            message: "Connecting to MongoDB New",
            connectionString,
          });
          //  appInstance.clearWorkerScreen();
          startLoading();
          await this.mongoRepository.connectMongo(connectionString);
          if (onSave) {
            const savedConnection = saveConnection(connections);
            state.connections.push(savedConnection);
          }
          const databases = await this.mongoRepository.fetchDatabases();
          state.databases = databases;
          logger.debug({ message: "Databases loaded", databases });
          //        focusDropdown(appInstance.ui.dropdowns.databaseDD);
          appInstance.eventBus.emit(EVENTS.DB_DATABASES_LOADED, {
            statusCode: 200,
            typeLogger: TYPE_LOGGER.CONNECT_MONGO_DB,
            developerMessage: "connected successfully",
          });
        } catch (error: unknown) {
          if (error instanceof Error) {
            logger.error({ message: "Error connecting to MongoDB", error });
            appInstance.eventBus.emit(EVENTS.DB_DATABASES_LOADED, {
              statusCode: 500,
              developerMessage: error,
              typeLogger: TYPE_LOGGER.CONNECT_MONGO_DB,
            });
          }
        } finally {
          clearLoading();
        }
      },
    );
  }
  private registerCollectionLoadedEvent() {
    this.eventBus.on(EVENTS.DB_COLLECTIONS_LOADED, (collections) => {
      logger.debug({ message: "Collections loaded", collections });
      //    appInstance.renderWorkspace(collections);
    });
  }

  private registerDatabaseEvents() {
    this.eventBus.on(EVENTS.DB_DATABASES_SELECTED, async (dbName: string) => {
      const collections = await this.mongoRepository.fetchCollections(dbName);

      state.collections = collections;
      //     focusDropdown(appInstance.ui.dropdowns.collectionDD);

      this.eventBus.emit(EVENTS.DB_COLLECTIONS_LOADED, collections);
    });

    this.eventBus.on(
      EVENTS.DATABASE_CREATE,
      async (dbName: string, collectionName?: string) => {
        try {
          state.databases = await this.mongoRepository.createDatabase(
            dbName,
            collectionName,
          );
          this.eventBus.emit(EVENTS.DATABASE_CREATED, {
            dbName,
            databases: state.databases,
          });
        } catch (error: any) {
          logger.error({ message: "Failed to create database", error });
          showToast({
            statusCode: 500,
            message: `Failed to create database: ${error.message}`,
          });
        }
      },
    );

    this.eventBus.on(EVENTS.DATABASE_DROP, async (dbName: string) => {
      try {
        state.databases = await this.mongoRepository.dropDatabase(dbName);

        if (state.selectedDatabaseIndex >= state.databases.length) {
          state.selectedDatabaseIndex = 0;
        }
        this.eventBus.emit(EVENTS.DATABASE_DROPPED, {
          dbName,
          databases: state.databases,
        });
      } catch (error: any) {
        logger.error({ message: "Failed to drop database", error });
        showToast({
          statusCode: 500,
          message: `Failed to drop database: ${error.message}`,
        });
      }
    });
  }

  private registerCollectionEvents() {
    this.eventBus.on(EVENTS.DB_COLLECTIONS_SELECTED, async () => {
      const docs = await this.mongoRepository.fetchQuery();

      this.eventBus.emit(EVENTS.QUERY_RESULT, docs);
    });
  }

  private registerQueryEvents() {
    this.eventBus.on(EVENTS.QUERY_SEND, async (query?: string) => {
      const docs = await this.mongoRepository.fetchQuery(query, {
        page: state.page,
        pageSize: state.pageSize,
      });

      this.eventBus.emit(EVENTS.QUERY_RESULT, docs);
    });

    this.eventBus.on(EVENTS.QUERY_ERROR, (error) => {
      logger.error({ message: "Query error", error });
      showToast({
        statusCode: 400,
        message: String(error),
      });
    });
  }
  private registerQueryResultEvent() {
    this.eventBus.on(EVENTS.QUERY_RESULT, (result) => {
      renderResult(appInstance.ui.panels.workspace!, result);
    });
  }
  private registerDatabaseLoadedEvent() {
    this.eventBus.on(EVENTS.DB_DATABASES_LOADED, (res) => {
      const { statusCode, developerMessage } = res;
      if (statusCode !== 200) {
        logger.error({
          message: "Failed to load databases",
          details: developerMessage,
        });
        // return showToast(screen, {
        //   statusCode,
        //   message: "Failed to load databases",
        // });
      } else {
        //      ui.childConnection.databaseDD.header.focus();
      }
      appInstance.renderWorkspace({
        developerMessage,
        statusCode,
        howToFix:
          "Check your MongoDB connection URI and ensure the database server is running.",
        typeLogger: res.typeLogger,
      });
    });
  }

  private registerCollectionCrudEvents() {
    this.eventBus.on(
      EVENTS.COLLECTION_CREATE,
      async (dbName: string, collectionName: string) => {
        try {
          state.collections = await this.mongoRepository.createCollection(
            dbName,
            collectionName,
          );
          this.eventBus.emit(EVENTS.COLLECTION_CREATED, {
            dbName,
            colName: collectionName,
            collections: state.collections,
          });
        } catch (error: any) {
          logger.error({ message: "Failed to create collection", error });
          showToast({
            statusCode: 500,
            message: `Failed to create collection: ${error.message}`,
          });
        }
      },
    );

    this.eventBus.on(
      EVENTS.COLLECTION_DROP,
      async (dbName: string, collectionName: string) => {
        try {
          state.collections = await this.mongoRepository.dropCollection(
            dbName,
            collectionName,
          );
          if (state.selectedCollectionIndex >= state.collections.length) {
            state.selectedCollectionIndex = 0;
          }
          this.eventBus.emit(EVENTS.COLLECTION_DROPPED, {
            dbName,
            colName: collectionName,
            collections: state.collections,
          });
        } catch (error: any) {
          logger.error({ message: "Failed to drop collection", error });
          showToast({
            statusCode: 500,
            message: `Failed to drop collection: ${error.message}`,
          });
        }
      },
    );
  }

  private registerConnectionCrudEvents() {
    this.eventBus.on(
      EVENTS.CONNECTION_UPDATE,
      ({ id, data }: { id: string; data: Record<string, any> }) => {
        try {
          state.connections = updateConnection(id, data);
          this.eventBus.emit(EVENTS.CONNECTION_UPDATED, {
            id,
            connections: state.connections,
          });
          showToast({ statusCode: 200, message: "Connection updated" });
        } catch (error: any) {
          logger.error({ message: "Failed to update connection", error });
          showToast({
            statusCode: 500,
            message: `Failed to update connection: ${error.message}`,
          });
        }
      },
    );

    this.eventBus.on(EVENTS.CONNECTION_DELETE, (id: string) => {
      try {
        state.connections = deleteConnection(id);
        if (state.selectedConnectionIndex >= state.connections.length) {
          state.selectedConnectionIndex = 0;
        }
        this.eventBus.emit(EVENTS.CONNECTION_DELETED, {
          id,
          connections: state.connections,
        });
        showToast({ statusCode: 200, message: "Connection deleted" });
      } catch (error: any) {
        logger.error({ message: "Failed to delete connection", error });
        showToast({
          statusCode: 500,
          message: `Failed to delete connection: ${error.message}`,
        });
      }
    });
  }

  private registerRecordEvents() {
    this.eventBus.on(EVENTS.RECORD_DUPLICATE, async ({ id, query }) => {
      await this.mongoRepository.duplicateRecord(id);

      this.eventBus.emit(EVENTS.QUERY_SEND, query);
    });

    this.eventBus.on(EVENTS.RECORD_DELETE, async ({ id, query }) => {
      await this.mongoRepository.deleteRecord(id);

      this.eventBus.emit(EVENTS.QUERY_SEND, query);
    });

    this.eventBus.on(EVENTS.RECORD_UPDATE, async ({ updated, query }) => {
      try {
        const parsed = JSON.parse(updated);

        const { _id, ...updateFields } = parsed;

        const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);

        await this.mongoRepository.updateRecord(objectId, updateFields);

        this.eventBus.emit(EVENTS.QUERY_SEND, query);
      } catch (error: any) {
        showToast({
          statusCode: 400,
          message: String(`Invalid JSON: ${error.message}`),
        });
      }
    });
  }
}
