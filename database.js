import { MongoClient } from "./dependencies.js"
import { config }      from "./dependencies.js";

const client = new MongoClient();
client.connectWithUri(config().MONGODB_CONNECTION_KEY);

const database = client.database("test");

const users = database.collection("users");


export {database, users};