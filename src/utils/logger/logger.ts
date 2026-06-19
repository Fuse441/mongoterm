import { state } from "@/shared/state";
import { IWorkspaceLogger } from "./logger.interface";
import { TYPE_LOGGER } from "@/services/enum";
import { workspaceTemplate } from "./logger.workspace.template";

export abstract class Logger {
  constructor() {}
  abstract log(message: string | Record<string, any>): void;
}

class FileLogger extends Logger {
  log(message: string): void {}
}

export class WorkspaceLogger extends Logger {
  log(message: IWorkspaceLogger): string {
    return workspaceTemplate[message.typeLogger](message);
  }
}
