import { getConfiguration } from "../services/helper.js";

const config = getConfiguration();

export const state = {
  connections: config.connections || [],
  selectedConnectionIndex: 0,
  selectedDatabaseIndex: 0,
  selectedCollectionIndex: 0,
  databases: [],
  collections: [],
  mongoClient: null,
};
