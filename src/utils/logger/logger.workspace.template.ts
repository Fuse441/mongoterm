import { state } from "@/shared/state";
import { IWorkspaceLogger } from "./logger.interface";
import { TYPE_LOGGER } from "@/services/enum";

export const workspaceTemplate = {
  [TYPE_LOGGER.CONNECT_MONGO_DB]: (payload: IWorkspaceLogger) => {
    return connectMongoDB(payload);
  },
};

function connectMongoDB(payload: IWorkspaceLogger): string {
  const color = payload.statusCode != 200 ? "#FF0000-fg" : "#00ff00-fg";
  if (payload.statusCode === 200) {
    return `
{${color}}● ${payload.developerMessage} {/}
{bold}Database{/}   : ${state.databases ?? "-"}
{bold}Collection{/} : ${state.collections ?? "-"}
`;
  }
  return `
{${color}}● ${payload.developerMessage} {/}

{bold}how to fix this{/}: ${payload.howToFix ?? "-"}
`;
}
