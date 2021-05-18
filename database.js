import { MongoClient } from "./dependencies.js"
// import { config }      from "./dependencies.js";

const client = new MongoClient();
await client.connect(Deno.env.toObject().MONGODB_CONNECTION_KEY);
console.log("Succesfully connected to MongoDB");
const database = client.database("deno-crypto-payments");

const users = database.collection("users");


export {database, users};