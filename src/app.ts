#!/usr/bin/env node
import fs from "fs/promises";
import os from "os";
import path from "path";
import { MongoTermApp } from "@/core/screen";
import { logger } from "./utils/logger/logger.service";
import { initEventMongoService } from "./services/mongodb/mongodb.events";
import { WorkspaceLogger } from "./utils/logger/logger";
import { getConfiguration } from "./services/helper";

export let appInstance: MongoTermApp;
export let appReady: Promise<MongoTermApp>;

const APP_ROOT = path.join(os.homedir(), "mongoterm");

async function createApplicationDirectory(): Promise<void> {
  try {
    await fs.mkdir(APP_ROOT, { recursive: true });
    logger.info({ message: `Application directory created  at: ${APP_ROOT}` });
    //    logger("Application directory created successfully.");
  } catch (err: any) {
    logger.error({
      message: `Failed to create application directory: ${err.message}`,
    });
    throw new Error(`Failed to create application directory: ${err.message}`);
  }
}

async function initializeApp(): Promise<MongoTermApp> {
  getConfiguration()
  const app = new MongoTermApp(new WorkspaceLogger());
  appInstance = app;
  setTimeout(() => {
    initEventMongoService();

  },3000);

  try {
    await app.init();
    logger.debug({ message: "Application initialized successfully." });
    return app;
  } catch (initErr: any) {
    logger.error({
      message: `Failed to initialize application: ${initErr.message}`,
    });
    throw initErr; // Rethrow the error for further handling or logging
  }
}

async function bootstrap(): Promise<void> {
  try {
    await createApplicationDirectory();
    appReady = initializeApp();

    // Import services and handle errors
    await import("./services/mongodb/mongodb.events");
    logger.debug({ message: "Services loaded successfully." });
  } catch (importErr: any) {
    logger.error({
      message: `Failed to load services: ${importErr.message}`,
    });
    throw importErr; // Rethrow the error for further handling or logging
  }
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
});
