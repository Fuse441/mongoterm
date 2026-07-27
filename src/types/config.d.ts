import { ObjectId, MongoClient, MongoOptions } from "mongodb";
export interface IConfigurationMongoConnection {
  id: string;
  lastUsed: {
    $date: {
      $numberLong: string;
    };
  };
  favorite: {
    name: MongoClient["name"];
    color?: string;
    group?: string;
  };
  savedConnectionType: "recent" | "favorite";
  connectionOptions: {
    connectionString: string;
    oidc: Record<string, unknown>;
  };
}
