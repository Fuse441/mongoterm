import { connectionPanel, createDropdown } from "../panels/connection.panel.js";
import { queryInput } from "../panels/query.panel.js";
import { workspacePanel } from "../panels/workspace.panel.js";
export const mogonTermLayout = (screen) => {
  const connection = connectionPanel();
  const workspace = workspacePanel();
  const query = queryInput(workspace);
  screen.append(connection);
  const connectionDD = createDropdown(1, connection);
  const databaseDD = createDropdown(15, connection);
  const collectionDD = createDropdown(30, connection);
  const childConnection = { connectionDD, databaseDD, collectionDD };
  screen.append(workspace);
  screen.append(query);

  screen.render();

  return { connection, childConnection, workspace, query };
};
