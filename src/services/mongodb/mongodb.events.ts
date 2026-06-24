import { ObjectId } from "mongodb";

import { state } from "@/shared/state";

import { EVENTS, TYPE_LOGGER } from "@/services/enum";
import { clearLoading, startLoading } from "@/services/loading";

import { logger } from "@/utils/logger/logger.service";

import { showToast } from "@/panels/toast.panel";
import { appInstance } from "@/app";
import { renderResult } from "@/panels/result.panel";
import { focusDropdown } from "@/panels/dropdown/dropdown.event";
import { getConfiguration, saveConnection } from "../helper";
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
            getConfiguration().connections.push(saveConnection(connections));
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
