/** @type {typeof import("blessed")} */
//import blessed from "neo-blessed";

import { MongoClient } from "mongodb";
import { getConfiguration } from "../services/helper.js";
import { connect } from "../services/mongodb.js";
const config = getConfiguration();

function getConnectionNames() {
  return (state.connections || [])
    .map((c) => c?.favorite?.name)
    .filter(Boolean);
}

//
// ──────────────────────────────────────────
// DROPDOWN FACTORY
// ──────────────────────────────────────────
//

function createDropdown(top) {
  const header = blessed.box({
    parent: connectionPanel,
    top,
    left: 1,
    width: "90%",
    height: 3,
    content: " ▼ ",
    border: "line",
    keys: true,
    mouse: true,
    style: {
      border: { fg: "cyan" },
      bg: "black",
    },
  });
  const list = blessed.list({
    parent: connectionPanel,
    top: top + 3,
    left: 1,
    width: "90%",
    height: 10,
    hidden: true,
    border: "line",
    keys: true,
    mouse: true,
    vi: true, // ✅ ถูกต้อง
    scrollable: true, // ✅ ใส่ที่ list
    alwaysScroll: true,
    scrollbar: {
      ch: " ",
      inverse: true,
    },
    style: {
      selected: {
        bg: "cyan",
        fg: "black",
      },
    },
  });
  const input = blessed.textbox({
    parent: connectionPanel,
    top: top + 3,
    left: 1,
    width: "90%",
    height: 3,
    hidden: true,
    border: "line",
    inputOnFocus: true,
  });
  header.on("focus", () => {
    header.style.bg = "#1e1e1e";
    header.style.border.fg = borderColor;
    screen.render();
  });

  header.on("blur", () => {
    header.style.bg = "black";
    header.style.border.fg = "cyan";
    screen.render();
  });

  return { header, list, input };
}

//
// ──────────────────────────────────────────
// CREATE DROPDOWNS
// ──────────────────────────────────────────
//

const connectionDD = createDropdown(1);
const databaseDD = createDropdown(15);
const collectionDD = createDropdown(30);

//
// ──────────────────────────────────────────
// GENERIC OPEN/CLOSE
// ──────────────────────────────────────────
//

//
// ──────────────────────────────────────────
// MONGO LOGIC
// ──────────────────────────────────────────
//

async function connectMongo(uri) {
  if (state.mongoClient) {
    await state.mongoClient.close();
  }
  screen.debug("connecting...");
  state.mongoClient = await connect(uri);

  screen.debug("connected!" + state.mongoClient);
}

async function fetchDatabases() {
  const admin = state.mongoClient.db().admin();
  const dbs = await admin.listDatabases();
  return dbs.databases.map((d) => d.name);
}

async function fetchCollections(dbName) {
  const db = state.mongoClient.db(dbName);
  const cols = await db.listCollections().toArray();
  return cols.map((c) => c.name);
}
async function fetchQuery(colName) {
  const dbName = state.databases[state.selectedDatabaseIndex];
  const datas = await state.mongoClient
    .db(dbName)
    .collection(colName)
    .find({})
    .toArray();
  return datas;
}
//
// ──────────────────────────────────────────
// CONNECTION SELECT
// ──────────────────────────────────────────
//

connectionDD.header.setContent(" Select Connection ▼ ");

connectionDD.header.key("enter", () => {
  screen.debug("on connectionDD");

  // connectionDD.input.show();
  // connectionDD.input.focus();
  // connectionDD.input.clearValue();

  openDropdown(connectionDD, getConnectionNames());
});
connectionDD.list.on("select", async (_, index) => {
  try {
    screen.debug(`on select ${_}`);
    state.selectedConnectionIndex = index;

    const conn = state.connections[index];
    const uri = conn.connectionOptions.connectionString;

    connectionDD.header.setContent(` ${conn.favorite.name} ▼ `);
    closeDropdown(connectionDD);

    workspacePanel.setContent(" Connecting...");
    screen.render();

    await connectMongo(uri);
    //   workspacePanel.setContent(msg);
    state.databases = await fetchDatabases();
    state.collections = [];

    databaseDD.header.setContent(" Select Database ▼ ");
    databaseDD.header.focus();
    collectionDD.header.setContent(" Select Collection ▼ ");

    //workspacePanel.setContent();
    screen.render();
  } catch (err) {
    workspacePanel.setContent(`${err.message}`);
    screen.render();
  }
});

//
// ──────────────────────────────────────────
// DATABASE SELECT
// ──────────────────────────────────────────
//

databaseDD.header.setContent(" Select Database ▼ ");

databaseDD.header.key("enter", () => {
  openDropdown(databaseDD, state.databases);
});

databaseDD.list.on("select", async (_, index) => {
  try {
    state.selectedDatabaseIndex = index;

    const dbName = state.databases[index];

    databaseDD.header.setContent(` ${dbName} ▼ `);
    const wsContent = workspacePanel.getContent();
    workspacePanel.setContent(`${wsContent}\nSelected Database : ${dbName}`);

    closeDropdown(databaseDD);

    state.collections = await fetchCollections(dbName);

    collectionDD.header.setContent(" Select Collection ▼ ");
    collectionDD.header.focus();
    screen.render();
  } catch (err) {
    workspacePanel.setContent(` Error: ${err.message}`);
    screen.render();
  }
});

//
// ──────────────────────────────────────────
// COLLECTION SELECT
// ──────────────────────────────────────────
//

collectionDD.header.setContent(" Select Collection ▼ ");

collectionDD.header.key("enter", () => {
  openDropdown(collectionDD, state.collections);
});

collectionDD.list.on("select", async (_, index) => {
  state.selectedCollectionIndex = index;

  const name = state.collections[index];
  collectionDD.header.setContent(` ${name} ▼ `);
  closeDropdown(collectionDD);
  const query = await fetchQuery(name);

  workspacePanel.setContent(JSON.stringify(query));

  screen.render();
});

//
// ──────────────────────────────────────────
// GLOBAL KEYS
// ──────────────────────────────────────────
//

screen.key(["tab"], () => {
  if (screen.focused === workspacePanel) {
    connectionDD.header.focus();
  } else {
    workspacePanel.focus();
  }
});

screen.key(["q", "C-c"], async () => {
  if (state.mongoClient) {
    await state.mongoClient.close();
  }
  process.exit(0);
});

//
// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
//

connectionDD.header.focus();
screen.render();
