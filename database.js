import { MongoClient } from "./dependencies.js"
// import { config }      from "./dependencies.js";

const client = new MongoClient();
client.connectWithUri(Deno.env.toObject().MONGODB_CONNECTION_KEY);

const database = client.database("deno-crypto-payments");

const users = database.collection("users");


export {database, users};