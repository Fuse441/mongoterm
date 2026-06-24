import { EventMongoService } from "./mongodb.events";
import { MongoRepository } from "./mongodb.repository";

export class MongodbBuilder {
  constructor(private eventBus: any) { }

  public async initMongoBuilder() {
    const mongoRepository = new MongoRepository(this.eventBus);
    await new EventMongoService(
      this.eventBus,
      mongoRepository,
    ).initEventMongoService();
  }
}
