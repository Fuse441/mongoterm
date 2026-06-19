import { TYPE_LOGGER } from "@/services/enum";

export type TLogLevel = "error" | "warn" | "debug" | "info";
export interface ILevelLogger {
  [key: string]: TLogLevel;
}

export interface IWorkspaceLogger {
  developerMessage: string;
  statusCode: number;
  howToFix?: string;
  version?: string;
  typeLogger: TYPE_LOGGER;
}
