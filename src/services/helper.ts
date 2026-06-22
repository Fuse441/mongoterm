import defaultConfig from "../../compass.json";
import { IConfigurationMongoConnection } from "@/types/config";
import { MongoClient, ObjectId } from "mongodb";
import { logger } from "@/utils/logger/logger.service";
import fs from "fs";
import os from "os";
import path from "path";
let configuration = structuredClone(defaultConfig);
export function getConfiguration() {
  return configuration;
}
export function saveConnection(
  connection: Record<string, any>,
): IConfigurationMongoConnection {
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

  configuration = {
    ...configuration,
    connections: [...configuration.connections, newConnection],
  };

  fs.writeFileSync(
    path.join("compass.json"),
    JSON.stringify(configuration, null, 2),
  );
logger.debug({message: path.join("compass.json")})
  return newConnection;
}export function getTimestamp() {
  return new Date().toISOString();
}


