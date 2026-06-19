import { getConfiguration } from "@/services/helper";
import { MongoClient } from "mongodb";

const config = getConfiguration();
interface IState {
  connections: any[];
  selectedConnectionIndex: number;
  selectedDatabaseIndex: number;
  selectedCollectionIndex: number;
  databases: string[];
  collections: string[];
  mongoClient: MongoClient | null;
  queryService: any;
}
export const state: IState = {
  connections: config.connections || [],
  selectedConnectionIndex: 0,
  selectedDatabaseIndex: 0,
  selectedCollectionIndex: 0,
  databases: [],
  collections: [],
  queryService: null,
  mongoClient: null as MongoClient | null,
};
