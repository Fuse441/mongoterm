import fs, { readFileSync } from "fs";
import { ObjectId } from "mongodb";
import { IConfigurationMongoConnection } from "@/types/config";
import { logger } from "@/utils/logger/logger.service";
import { CONFIG_PATH } from "@/config/app.paths";

export function getConfiguration() {
if(!fs.existsSync(CONFIG_PATH)) {
  return {};
}
return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

export function saveConnection(
  connection: Record<string, any>,
): IConfigurationMongoConnection {
  try {
    logger.debug({ message: `Saving connection: ${JSON.stringify(connection)}` });

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
      CONFIG_PATH,
      JSON.stringify(newConfig, null, 2),
      "utf-8",
    );
    logger.debug({ message: `Configuration saved: ${JSON.stringify(updatedConnections)}` });
    return newConnection;
  } catch (err: any) {
    logger.error({
      message: `Failed to save connection: ${err.message}`,
    });
    throw err;
  }
}

export function updateConnection(
  id: string,
  connection: Record<string, any>,
): IConfigurationMongoConnection[] {
  try {
    const currentConfig = getConfiguration();
    const connections: IConfigurationMongoConnection[] =
      currentConfig.connections || [];

    const index = connections.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Connection with id ${id} not found`);
    }

    const updatedConnection: IConfigurationMongoConnection = {
      ...connections[index],
      favorite: { name: connection.connectionName },
      connectionOptions: {
        ...connections[index].connectionOptions,
        connectionString: connection.connectionString,
      },
    };

    const updatedConnections = [...connections];
    updatedConnections[index] = updatedConnection;

    const newConfig = { ...currentConfig, connections: updatedConnections };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");

    logger.debug({ message: `Connection updated: ${JSON.stringify(updatedConnection)}` });
    return updatedConnections;
  } catch (err: any) {
    logger.error({
      message: `Failed to update connection: ${err.message}`,
    });
    throw err;
  }
}

export function deleteConnection(id: string): IConfigurationMongoConnection[] {
  try {
    const currentConfig = getConfiguration();
    const connections: IConfigurationMongoConnection[] =
      currentConfig.connections || [];

    const updatedConnections = connections.filter((c) => c.id !== id);
    if (updatedConnections.length === connections.length) {
      throw new Error(`Connection with id ${id} not found`);
    }

    const newConfig = { ...currentConfig, connections: updatedConnections };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");

    logger.debug({ message: `Connection deleted: ${id}` });
    return updatedConnections;
  } catch (err: any) {
    logger.error({
      message: `Failed to delete connection: ${err.message}`,
    });
    throw err;
  }
}

export function getTimestamp() {
  return new Date().toISOString();
}


