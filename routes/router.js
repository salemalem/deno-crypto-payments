import { 
  Router, 
  helpers,
} from "../dependencies.js";
import { OAuth2Client } from "../dependencies.js";

// import { users } from "../database.js";
import { mysqlClient } from "../database.js";

import { ensureDir } from "../dependencies.js";

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

const router = new Router();

router
  .get("/get-started", async (context) => {
    context.render(`${Deno.cwd()}/views/get_started.ejs`, {
      userID: context.cookies.get("userID")
    });
  })
  .get("/login", async (context) => {
    // await mysqlClient.execute(`
    //   CREATE TABLE users (
    //       id int(11) NOT NULL AUTO_INCREMENT,
    //       name varchar(100) NOT NULL,
    //       created_at timestamp not null default current_timestamp,
    //       githubID varchar(100) NOT NULL,
    //       PRIMARY KEY (id)
    //   ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    // `);
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
    context.response.body = "download";
    // let filePathForUrl = filePath.split('static/');
    // console.log(filePathForUrl);
    // context.response.redirect(filePathForUrl[1]);
  })
  .get("/sellers", async (context) => {
    const {rows} = await mysqlClient.execute(`SELECT githubID, name FROM users`);
    context.response.body = rows;
  })
  .get("/seller/:githubID", async (context) => {
    const { githubID } = helpers.getQuery(context, { mergeParams: true });
    const {rows: seller} = await mysqlClient.execute(`SELECT name FROM users WHERE githubID=${githubID}`);
    if(!seller.length) {
      context.response.body = "404 Seller not found";
    } else{
      const {rows: uploads} = await mysqlClient.execute(`SELECT title, description, trx_amount, upload_key FROM uploads WHERE githubID=${githubID}`);
      context.render(`${Deno.cwd()}/views/pages/single_seller.ejs`, {
        name: seller[0]["name"],
        uploads: uploads,
      });
    }
    // TODO: 
    // before letting the user to download it copy it and rename as its original name
    // tutorial: https://www.woolha.com/tutorials/deno-rename-file-directory-examples
  })
  .get("/seller/:githubID/:uploadID/payment", async (context) => {
    const { githubID, uploadID } = helpers.getQuery(context, { mergeParams: true });
    const result = await mysqlClient.execute(`SELECT title, tron_address, trx_amount FROM uploads WHERE upload_key=${uploadID}`);
    //
    if (result["rows"].length === 0) {
      context.response.body = "404 Product is not found"
    } else {
      const { rows } = await mysqlClient.execute(`SELECT title, tron_address, trx_amount FROM uploads WHERE upload_key=${uploadID}`);
      const {rows: sellerName} = await mysqlClient.execute(`SELECT name FROM users WHERE githubID=${githubID}`);
      context.render(`${Deno.cwd()}/views/pages/payment_page.ejs`, {
        githubID: githubID,
        uploadID: uploadID,
        title: rows[0]["title"],
        tron_address: rows[0]["tron_address"],
        trx_amount: rows[0]["trx_amount"],
        sellerName: sellerName[0]["name"],
      });
    }
  })
  .get("/tools/checkhash/:hash", async (context) => {
    const { hash } = helpers.getQuery(context, { mergeParams: true });

    // let {rows: payments} = await mysqlClient.execute(`SELECT * FROM payments`);
    let result = await mysqlClient.execute(`DESCRIBE payments`);
    // console.log(result);
    result  = await mysqlClient.execute(`SELECT * FROM payments WHERE transactionHash='${hash}'`);
    console.log(result);
    // let jsonBodyOutput;
    // if(!payments.length) { // if no payment with this hash was made
    //   const jsonResult = fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${hash}`);

    //   jsonResult.then((response) => {
    //     return response.json();
    //   }).then((jsonData) => {s
    //     if (jsonData.length) {
    //       console.log(jsonData["contractData"]);
    //       console.log(jsonData["confirmed"]);
    //       console.log(jsonData["contractRet"]);
    //     } else {
    //       console.log("empty");
    //     }
    //   });
    // }

    context.response.body = "hi";
  })
  .get("/createTable", async (context) => {
    await mysqlClient.execute(`DROP TABLE IF EXISTS payments`);
    await mysqlClient.execute(`
        CREATE TABLE payments (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            transactionHash varchar(100) NOT NULL,
            created_at timestamp not null default current_timestamp,
            fromAddress varchar(100) NOT NULL,
            toAddress varchar(100) NOT NULL,
            amount varchar(100) NOT NULL,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    context.response.body = 'created';
  });


export { router };