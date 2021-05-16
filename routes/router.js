import { Router } from "../dependencies.js";
import { OAuth2Client } from "../dependencies.js";

const oauth2Client = new OAuth2Client({
  clientId: "<your client id>",
  clientSecret: "<your client secret>",
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  redirectUri: "http://localhost:8000/oauth2/callback",
  defaults: {
    scope: "read:user",
  },
});

const router = new Router();

router
  .get("/get-started", async (context) => {
    context.render(`${Deno.cwd()}/views/get_started.ejs`);
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
    const { name } = await userResponse.json();
  
    context.response.body = `Hello, ${name}!`;
  })
  .post("/register", async (context) => {
    const form = JSON.stringify(await multiParser(context.request.serverRequest));
    const parse = JSON.parse(form);
    console.log(parse["fields"]["username"]);
    context.response.redirect("/")
  })
  // .get("/login", async (context) => {
    // context.render(`${Deno.cwd()}/views/login.ejs`);
    // context.response.redirect("/");
  // })
  .post("/login", async (context) => {
    const form = JSON.stringify(await multiParser(context.request.serverRequest));
    const parse = JSON.parse(form);
    console.log(parse["fields"]["username"]);
    context.response.redirect("/")
  });

export { router };