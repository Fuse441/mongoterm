#!/usr/bin/env node
import { MongoTermApp } from "@/core/screen";
import { logger } from "./utils/logger/logger.service";
import { WorkspaceLogger } from "./utils/logger/logger";
import { getConfiguration } from "./services/helper";
import { existsSync, readFileSync } from "fs";
import { defaultConfig } from "./config/app.config";
import { APP_ROOT, APP_VERSION, CONFIG_DIR, CONFIG_PATH } from "./config/app.paths";
import { MongodbBuilder } from "./services/mongodb/mongodb.builder";
import { EventMongoTerm } from "./core/eventBus";
import { ensureSecureDir, writeFileSecure } from "./utils/secureFs";
import { checkForUpdate } from "./services/updateCheck.service";
import { showToast } from "./panels/toast.panel";
import { setUpdateBadge } from "./panels/titlebar.panel";
export let appInstance: MongoTermApp;
export let appReady: Promise<MongoTermApp>;

var configuration: any = null;

async function  ensureLoaded() {
  if (configuration) return;

  ensureSecureDir(CONFIG_DIR);

  if (!existsSync(CONFIG_PATH)) {
    writeFileSecure(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
  }

  configuration = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

async function createApplicationDirectory(): Promise<void> {
  try {
    ensureSecureDir(APP_ROOT);
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
 const eventBus = new EventMongoTerm();
const app = new MongoTermApp(eventBus,
  new WorkspaceLogger(),new MongodbBuilder(eventBus));
  appInstance = app;
//  await initEventMongoService();

 
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

// Fire-and-forget: never let a network hiccup delay or fail startup. Waits
// for the screen to exist (appReady) before showing anything, since
// showToast needs appInstance.
function checkForUpdateInBackground(): void {
  appReady
    .then(() => checkForUpdate())
    .then((info) => {
      if (!info.hasUpdate) return;
      // Toast for an immediate nudge; title bar badge because the toast
      // auto-dismisses (8s) and is easy to miss during the initial
      // connection screen — the badge stays until the app is restarted
      // on the new version.
      showToast({
        statusCode: 200,
        message: `Update available: ${info.latestVersion} (you have v${APP_VERSION}) — npm i -g mongoterm@latest`,
        duration: 8000,
      });
      setUpdateBadge(info.latestVersion ?? null);
    })
    .catch((error) => {
      logger.debug({ message: "Update check failed", error });
    });
}

async function bootstrap(): Promise<void> {
  try {
    await createApplicationDirectory();
    await ensureLoaded();

    appReady = initializeApp();
    checkForUpdateInBackground();

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
