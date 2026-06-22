import fs, { readFileSync } from "fs";
import os from "os";
import path from "path";
import { ObjectId } from "mongodb";
import { IConfigurationMongoConnection } from "@/types/config";
import { logger } from "@/utils/logger/logger.service";
import { state } from "@/shared/state";

export function getConfiguration() {
const configDir = path.join(os.homedir(), ".mongoterm");
const configPath = path.join(configDir, "compass.json");
if(!fs.existsSync(configPath)) {
  return {};
}
return JSON.parse(readFileSync(configPath, "utf-8"));
}

export function saveConnection(
  connection: Record<string, any>,
): IConfigurationMongoConnection {
  try {
    logger.debug({ message: `Saving connection: ${JSON.stringify(connection)}` });
    const configDir = path.join(os.homedir(), ".mongoterm");
const configPath = path.join(configDir, "compass.json");

    const newConnection: IConfigurationMongoConnection = {
      id: new ObjectId().toHexString(),
      lastUsed: {
        $date: {
          $numberLong: Date.now().toString(),
        },
      },
      favorite: {
        name: connection.connectionName,
      },
      savedConnectionType: "recent",
      connectionOptions: {
          connectionString: connection.connectionString,
          oidc: {},
        }, 
    };
    const currentConfig = getConfiguration();
    const updatedConnections = [...(currentConfig.connections || []), newConnection];
    const newConfig = { ...currentConfig, connections: updatedConnections };
   fs.writeFileSync(
      configPath,
      JSON.stringify(newConfig, null, 2),
      "utf-8",
    );
    logger.debug({ message: `Configuration saved: ${JSON.stringify(state.connections)}` });
    return newConnection;
  } catch (err: any) {
    logger.error({
      message: `Failed to save connection: ${err.message}`,
    });
    throw err;
  }
}export function getTimestamp() {
  return new Date().toISOString();
}


