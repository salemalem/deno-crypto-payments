import { 
  Router, 
  helpers,
} from "../dependencies.js";
import { OAuth2Client } from "../dependencies.js";

// import { users } from "../database.js";
import {mysqlClient} from "../database.js";

import { ensureDir } from "https://deno.land/std@0.97.0/fs/mod.ts";

const GITHUB_OAUTH_CLIENT_ID     = Deno.env.toObject().GITHUB_OAUTH_CLIENT_ID;
const GITHUB_OAUTH_CLIENT_SECRET = Deno.env.toObject().GITHUB_OAUTH_CLIENT_SECRET;

const oauth2Client = new OAuth2Client({
  clientId: GITHUB_OAUTH_CLIENT_ID,
  clientSecret: GITHUB_OAUTH_CLIENT_SECRET,
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  redirectUri: "https://deno-crypto-payments.herokuapp.com/oauth2/callback",
  defaults: {
    scope: "read:user",
  },
});

let filePath;

const router = new Router();

router
  .get("/get-started", async (context) => {
    context.render(`${Deno.cwd()}/views/get_started.ejs`, {
      userID: context.cookies.get("userID")
    });
  })
  .get("/login", async (context) => {
    context.response.redirect(
      oauth2Client.code.getAuthorizationUri(),
    );
  })
  .get("/oauth2/callback", async (context) => {
    // Exchange the authorization code for an access token
    const tokens = await oauth2Client.code.getToken(context.request.url);
  
    // Use the access token to make an authenticated API request
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    // const { name } = await userResponse.json();
    const { id, name } = await userResponse.json();

    let {rows: users} = await mysqlClient.execute(`SELECT * FROM users WHERE githubID=${id}`);
    if(!users.length) {
      // insert new user if his githubID isn't found in database
      await mysqlClient.execute(`INSERT INTO users(githubID, name) values(?, ?)`, [
        id,
        name,
      ]);
    }
    // let result = await client.execute("SELECT * FROM users");
    // { affectedRows: 1, lastInsertId: 1 }
    // context.response.body = `Hi, ${name}. You are logined. Now go to https://deno-crypto-payments.herokuapp.com/get-started`;
    context.cookies.set("userID", id);
    /* Mongodb doesn't support remote database connection yet so disabled these lines.
    users.insertOne({
      githubUserID: id,
      name: name,
    });
    */
    context.response.redirect("https://deno-crypto-payments.herokuapp.com/get-started");
  })
  .get("/protected", async (context) => {
    if (context.cookies.get("userID")) {
      context.response.body = `You are logined as ${context.cookies.get("userID")}. Now go to "https://deno-crypto-payments.herokuapp.com/get-started`;
    } else {
      context.response.redirect("https://deno-crypto-payments.herokuapp.com/get-started")
    }
  }, async(context) => {
    context.response.body = "hi";
  })
  .post("/upload", async (context) => {

    let currentUserID = context.cookies.get("userID");
    let outPathForFile = `${Deno.cwd()}/static/uploads/${currentUserID}`;
    await ensureDir(outPathForFile);
    let result = await context.request.body().value.read({outPath: outPathForFile});
    console.log(result); //"/app/static/uploads//1987657d41e3db0549ddc12d77df9d87a8ffc989.png",
    await mysqlClient.execute(`INSERT INTO uploads(githubID, title, description, tron_address, trx_amount, file_path, original_file_name) values(?, ?, ?, ?, ?, ?, ?)`, [
      currentUserID,
      result["fields"]["title"],
      result["fields"]["description"],
      result["fields"]["your-tron-address"],
      result["fields"]["amount"],
      result["files"][0]["filename"],
      result["files"][0]["originalName"],
    ]);
    context.response.body = "uploaded";
  })
  .get("/login_test", async (context) => {
    context.render(`${Deno.cwd()}/views/login_test.ejs`);
    // context.response.redirect("/");
  })
  .post("/login_test", async (context) => {
    console.log(await context.request.body().value.read());
    // const form = JSON.stringify(await multiParser(context.request.serverRequest));
    // const parse = JSON.parse(form);
    // console.log(parse["fields"]["username"]);
    context.response.redirect("/get-started");
  })
  .get("/download_file", async (context) => {
    let filePathForUrl = filePath.split('static/');
    console.log(filePathForUrl);
    context.response.redirect(filePathForUrl[1]);
  })
  .get("/sellers", async (context) => {
    const {users: sellers} = await mysqlClient.execute(`SELECT githubID, name FROM users`);
    context.response.body = sellers;
  })
  .get("/seller/:githubID", async (context) => {
    const { githubID } = helpers.getQuery(context, { mergeParams: true });
    const {rows: seller} = await mysqlClient.execute(`SELECT name FROM users WHERE githubID=${githubID}`);
    if(!seller.length) {
      context.response.body = "404 Seller not found";
    } else{
      const {rows: uploads} = await mysqlClient.execute(`SELECT title, description, trx_amount FROM uploads WHERE githubID=${githubID}`);
      // context.render(`${Deno.cwd()}/views/pages/single_seller.ejs`, {
      //   name: seller[0]["name"],
      //   uploads: uploads
      // });
    }
    context.response.body = uploads;
    // TODO: 
    // before letting the user to download it copy it and rename as its original name
    // tutorial: https://www.woolha.com/tutorials/deno-rename-file-directory-examples
    // select * from uploads where githubID = githubID
    // and list them on single page.
  })
  .get("/seller/:githubID/:uploadID/payment", async (context) => {
    const { githubID } = helpers.getQuery(context, { mergeParams: true });
  });


export { router };