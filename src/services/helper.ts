import blessed from "neo-blessed";
import config from "../../compass.json";
import { state } from "@/shared/state";

export function getConfiguration() {
  return config;
}

export function getTimestamp() {
  return new Date().toISOString();
}

export function resetDBSelection(
  databaseDD: blessed.Widgets.BoxOptions,
  collectionDD: blessed.Widgets.BoxOptions,
) {
  state.databases = [];
  state.collections = [];

  databaseDD.header.setContent(" Select Database ▼ ");
  collectionDD.header.setContent(" Select Collection ▼ ");
}

export function resetCollectionSelection(
  collectionDD: blessed.Widgets.BoxOptions,
) {
  state.collections = [];
  collectionDD.header.setContent(" Select Collection ▼ ");
}
