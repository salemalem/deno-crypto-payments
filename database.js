/*
IMPORTANT NOTICE:
MongoDB driver supports only local connection but not remote. 
So you can't use it to connect to remote clusters. Current version is 0.22.0
Enable mongodb when developers will fix this issue.
*/

import { MongoClient } from "./dependencies.js"
// import { config }      from "./dependencies.js";

const client = new MongoClient();
// await client.connect(Deno.env.toObject().MONGODB_CONNECTION_KEY);
// console.log("Succesfully connected to MongoDB");
// const database = client.database("deno-crypto-payments");

// const users = database.collection("users");


// export {database, users};