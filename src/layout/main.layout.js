import { connectionPanel, createDropdown } from "../panels/connection.panel.js";
import { monitorPanel, startMonitor } from "../panels/monitor.panel.js";
import { queryInput } from "../panels/query.panel.js";
import { renderResult } from "../panels/result.panel.js";
import { workspacePanel } from "../panels/workspace.panel.js";
export const mogonTermLayout = (screen) => {
  const connection = connectionPanel();
  const workspace = workspacePanel();
  const query = queryInput();
  const monitor = monitorPanel();

  startMonitor(screen, monitor);
  //const result = resultPanel();

  screen.append(connection);

  const connectionDD = createDropdown(1, connection);
  const databaseDD = createDropdown(15, connection);
  const collectionDD = createDropdown(30, connection);

  const childConnection = { connectionDD, databaseDD, collectionDD };

  screen.append(workspace);
  //  workspace.append(result);
  //  result.setData([["No Results"]]);
  screen.append(query);
  screen.append(monitor);

  screen.render();

  return { connection, childConnection, workspace, query };
};
