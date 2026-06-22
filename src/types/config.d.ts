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
  };
  savedConnectionType: "recent" | "favorite";
  connectionOptions: {
    connectionString: string;
    oidc: Record<string, unknown>;
  };
}
