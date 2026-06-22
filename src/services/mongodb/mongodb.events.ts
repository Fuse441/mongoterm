import { ObjectId } from "mongodb";

import { state } from "@/shared/state";

import { EVENTS, TYPE_LOGGER } from "@/services/enum";
import { clearLoading, startLoading } from "@/services/loading";

import { logger } from "@/utils/logger/logger.service";

import {
  connectMongo,
  deleteRecord,
  duplicateRecord,
  fetchCollections,
  fetchDatabases,
  fetchQuery,
  updateRecord,
} from "./mongodb.repository";
import { showToast } from "@/panels/toast.panel";
import { appInstance } from "@/app";
import { renderResult } from "@/panels/result.panel";
import { focusDropdown } from "@/panels/dropdown/dropdown.event";
import { getConfiguration, saveConnection } from "../helper";
import { IConfigurationMongoConnection } from "@/types/config";

export function initEventMongoService() {
  logger.debug({ message: "appInstance", appInstance });
  logger.debug({ message: "eventBus " + appInstance?.eventBus });
  registerConnectionEvents();
  registerDatabaseEvents();
  registerCollectionEvents();
  registerQueryEvents();
  registerRecordEvents();
  registerCollectionLoadedEvent();
  registerDatabaseLoadedEvent();
  registerQueryResultEvent();
  logger.debug({ message: "Mongo events initialized" });
}
function registerConnectionEvents() {
  appInstance.eventBus.on(
    EVENTS.DB_CONNECT,
    async (connections: Record<string, any>, onSave: boolean) => {
      const { connectionString } = connections;
      try {
        appInstance.clearWorkerScreen();
        startLoading();
        await connectMongo(connectionString);
        if (onSave) {
          getConfiguration().connections.push(saveConnection(connections));
        }
        const databases = await fetchDatabases();
        state.databases = databases;
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
function registerCollectionLoadedEvent() {
  appInstance.eventBus.on(EVENTS.DB_COLLECTIONS_LOADED, (collections) => {
    logger.debug({ message: "Collections loaded", collections });
    //    appInstance.renderWorkspace(collections);
  });
}

function registerDatabaseEvents() {
  appInstance.eventBus.on(
    EVENTS.DB_DATABASES_SELECTED,
    async (dbName: string) => {
      const collections = await fetchCollections(dbName);

      state.collections = collections;
      //     focusDropdown(appInstance.ui.dropdowns.collectionDD);

      appInstance.eventBus.emit(EVENTS.DB_COLLECTIONS_LOADED, collections);
    },
  );
}

function registerCollectionEvents() {
  appInstance.eventBus.on(EVENTS.DB_COLLECTIONS_SELECTED, async () => {
    const docs = await fetchQuery();

    appInstance.eventBus.emit(EVENTS.QUERY_RESULT, docs);
  });
}

function registerQueryEvents() {
  appInstance.eventBus.on(EVENTS.QUERY_SEND, async (query?: string) => {
    const docs = await fetchQuery(query, {
      page: state.page,
      pageSize: state.pageSize,
    });

    appInstance.eventBus.emit(EVENTS.QUERY_RESULT, docs);
  });

  appInstance.eventBus.on(EVENTS.QUERY_ERROR, (error) => {
    logger.error({ message: "Query error", error });
    showToast({
      statusCode: 400,
      message: String(error),
    });
  });
}
function registerQueryResultEvent() {
  appInstance.eventBus.on(EVENTS.QUERY_RESULT, (result) => {
    renderResult(appInstance.ui.panels.workspace!, result);
  });
}
function registerDatabaseLoadedEvent() {
  appInstance.eventBus.on(EVENTS.DB_DATABASES_LOADED, (res) => {
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

function registerRecordEvents() {
  appInstance.eventBus.on(EVENTS.RECORD_DUPLICATE, async ({ id, query }) => {
    await duplicateRecord(id);

    appInstance.eventBus.emit(EVENTS.QUERY_SEND, query);
  });

  appInstance.eventBus.on(EVENTS.RECORD_DELETE, async ({ id, query }) => {
    await deleteRecord(id);

    appInstance.eventBus.emit(EVENTS.QUERY_SEND, query);
  });

  appInstance.eventBus.on(EVENTS.RECORD_UPDATE, async ({ updated, query }) => {
    try {
      const parsed = JSON.parse(updated);

      const { _id, ...updateFields } = parsed;

      const objectId = _id instanceof ObjectId ? _id : new ObjectId(_id);

      await updateRecord(objectId, updateFields);

      appInstance.eventBus.emit(EVENTS.QUERY_SEND, query);
    } catch (error: any) {
      showToast({
        statusCode: 400,
        message: String(`Invalid JSON: ${error.message}`),
      });
    }
  });
}
