import { Router } from "../dependencies.js";
import { OAuth2Client } from "../dependencies.js";

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
    // context.response.body = `Hi, ${name}. You are logined. Now go to https://deno-crypto-payments.herokuapp.com/get-started`;
    context.cookies.set("userID", id);
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
  });


export { router };