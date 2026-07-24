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

/**
 * Writes connections to disk in one of two interoperable formats:
 * - "compass": the same `{ connections: [...] }` shape MongoDB Compass
 *   itself uses for its own connection export, so the file can be opened
 *   directly by Compass (or re-imported here).
 * - "uri": a plain-text list of `mongodb://`/`mongodb+srv://` URIs (one per
 *   connection, `# name` comment above each), the format any mongosh-style
 *   tool accepts as a connection string.
 */
export function exportConnections(
  filePath: string,
  format: "compass" | "uri",
  connections: IConfigurationMongoConnection[],
): void {
  if (format === "compass") {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ connections }, null, 2),
      "utf-8",
    );
  } else {
    const lines = connections.flatMap((c) => [
      `# ${c.favorite.name}`,
      c.connectionOptions.connectionString,
      "",
    ]);
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  }
}

/**
 * Reads connections from a "compass" or "uri" file (see `exportConnections`)
 * and merges them into the existing store, skipping any connection string
 * that's already saved. Returns the full, merged connection list.
 */
export function importConnections(
  filePath: string,
  format: "compass" | "uri",
): IConfigurationMongoConnection[] {
  const raw = readFileSync(filePath, "utf-8");
  const currentConfig = getConfiguration();
  const existing: IConfigurationMongoConnection[] =
    currentConfig.connections || [];
  const existingUris = new Set(
    existing.map((c) => c.connectionOptions.connectionString),
  );

  const incoming: { name: string; connectionString: string }[] = [];

  if (format === "compass") {
    const parsed = JSON.parse(raw);
    const list: any[] = Array.isArray(parsed) ? parsed : parsed.connections || [];
    for (const c of list) {
      const connectionString =
        c?.connectionOptions?.connectionString ?? c?.connectionString;
      if (!connectionString) continue;
      incoming.push({
        name: c?.favorite?.name ?? c?.name ?? "Imported connection",
        connectionString,
      });
    }
  } else {
    let pendingName: string | null = null;
    for (const rawLine of raw.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith("#")) {
        pendingName = line.replace(/^#\s*/, "");
        continue;
      }
      if (/^mongodb(\+srv)?:\/\//.test(line)) {
        incoming.push({
          name: pendingName ?? `Imported ${incoming.length + 1}`,
          connectionString: line,
        });
        pendingName = null;
      }
    }
  }

  const newConnections: IConfigurationMongoConnection[] = incoming
    .filter((c) => !existingUris.has(c.connectionString))
    .map((c) => ({
      id: new ObjectId().toHexString(),
      lastUsed: { $date: { $numberLong: Date.now().toString() } },
      favorite: { name: c.name },
      savedConnectionType: "recent" as const,
      connectionOptions: { connectionString: c.connectionString, oidc: {} },
    }));

  const updatedConnections = [...existing, ...newConnections];
  const newConfig = { ...currentConfig, connections: updatedConnections };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");

  logger.debug({
    message: `Imported ${newConnections.length} new connection(s) from ${filePath}`,
  });
  return updatedConnections;
}

export function getTimestamp() {
  return new Date().toISOString();
}


