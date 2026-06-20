import { EventEmitter } from "events";
import { state } from "@/shared/state";
import { EVENTS } from "../services/enum.js";
import { renderResult } from "../panels/result.panel.js";
import { showToast } from "../panels/toast.panel.js";
import { logger } from "@/utils/logger/logger.service.js";

export class EventMongoTerm {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();

    this.on(EVENTS.TOAST_SHOW, (rest) => {
      logger.debug({ message: "Event received: TOAST_SHOW", rest });
      showToast(rest);
    });
  }
  private getEventName(event: string) {
    return event;
  }
  emit(event: string, ...args: any[]) {
    logger.debug({ message: `Emitting event: ${event}`, args });
    this.emitter.emit(this.getEventName(event), ...args);
  }
  on(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(this.getEventName(event), listener);
  }
}
