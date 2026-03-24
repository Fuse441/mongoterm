import os from "os";
import path from "path";
import fs from "fs";
let historyFile = path.join(os.homedir(), ".mongoterm_history");
let stateCluster = "";
let statePath = "";
export class QueryService {
  constructor(cluster) {
    stateCluster = cluster || stateCluster;
    statePath = path.join(historyFile, stateCluster);
    !fs.existsSync(historyFile) &&
      fs.mkdirSync(historyFile, { recursive: true });
  }
  clearHistory() {
    // Clear the history file
    fs.writeFileSync(historyFile, "", "utf-8");
  }
  getPath() {
    return historyFile;
  }
  saveQuery(query) {
    const history = this.getHistory();

    const deduped = history.filter((h) => h.query !== query);
    const newEntry = { query, timestamp: Date.now() };
    const trimmed = [newEntry, ...deduped].slice(0, 100);
    //    console.log("Saving query to history:", trimmed);
    fs.writeFileSync(
      `${statePath}.json`,
      trimmed.map((h) => JSON.stringify(h)).join("\n"),
      "utf-8",
    );
  }
  getHistory() {
    if (!fs.existsSync(`${statePath}.json`)) return [];
    return fs
      .readFileSync(`${statePath}.json`, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
  viewHistory() {
    //how to read the history file and return an array of queries
    const history = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    return history;
  }
}
