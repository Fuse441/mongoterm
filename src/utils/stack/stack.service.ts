import { get } from "stack-trace";

export function getCaller() {
  const trace = get();

  // 0 = getCaller
  // 1 = logger.info
  // 2 = caller จริง

  const caller = trace[2];

  return {
    file: caller.getFileName().split("/").slice(-2).join("/"),
    //    function: caller.getFunctionName(),
    line: caller.getLineNumber(),
    column: caller.getColumnNumber(),
  };
}
