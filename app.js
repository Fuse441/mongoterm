// import { QueryService } from "./src/services/query.service.js";
// const cluster = {
//   name: "cluster0",
//   uri: "mongodb+srv://<username>:<password>@cluster0.mongodb.net/test?retryWrites=true&w=majority",
// };
// const queryService = new QueryService(cluster.name);
// //queryService.clearHistory();
// queryService.saveQuery("{ find: 'users' }");
//queryService.clearHistory();

import { screen } from "./src/core/screen.js";
import "./src/services/mongodb.service.js";
console.log("Application start");

function initLayout() {
  screen.debug("Init Layout MongoTerm");
}

initLayout();
