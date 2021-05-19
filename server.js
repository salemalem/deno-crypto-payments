// externals
import { 
  Application, 
  send 
}                              from "./dependencies.js";
import {
  viewEngine,
  engineFactory,
  adapterFactory
}                              from "./dependencies.js";

// internals
import { router }              from "./routes/router.js";

import { flags }               from "./dependencies.js";



const ejsEngine = await engineFactory.getEjsEngine();
const oakAdapter = await adapterFactory.getOakAdapter();

const app = new Application();

const {args} = Deno;
const DEFAULT_PORT = 8000;
const argPort = flags.parse(args).port;
const port = argPort ? Number(argPort) : DEFAULT_PORT;

app.use(viewEngine(oakAdapter,ejsEngine));

app.use(router.routes());
app.use(router.allowedMethods());

// enabling static files like css, js
// use it after routers because it will interrupt them
// see this for more: https://stackoverflow.com/questions/62443440/the-system-cannot-find-the-file-specified-os-error-2-in-deno
app.use(async (ctx,next) => {
  await send(ctx, ctx.request.url.pathname,{
    root: `${Deno.cwd()}/static`
  });
  next();
});

/*
When I enable lines below it gives an error when I try to enable static files.
When I disable no error and pages work too.
I think it's a bug of oak.
*/
app.addEventListener('error', event => {
  console.log(event.error);
});


console.log(`Server is running 🦕 on port ${port}`)
await app.listen({ port: port });
