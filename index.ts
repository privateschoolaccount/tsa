import { Context, Hono } from "hono";
import { swaggerUI } from '@hono/swagger-ui'
import { describeRoute, resolver, validator,openAPIRouteHandler } from "hono-openapi";
import { z } from "https://deno.land/x/zod@v3.25/mod.ts";
import { Handlebars, HandlebarsConfig } from 'https://deno.land/x/handlebars/mod.ts';


import {
    convertSRTToText,
    convertTextToBraille,
    createRecipeCard,
    getCaptionsYouTube,
} from "./utils.ts";
const app = new Hono();

const youtubeQuerySchema = z.object({
    id: z.string(),
    linesPerPage: z.optional(z.number()),
    cellsPerLine: z.optional(z.number()),
    table: z.optional(z.enum(["en-ueb-g2.ctb","en-ueb-g1.ctb"])),
});
const youtubeResultSchema = z.string();
const handle = new Handlebars({
  baseDir:"./html",
  layoutsDir:"layouts/",
  partialsDir:"partials/",
  extname:".hbs",
  defaultLayout:"boilerplate",
  helpers: undefined,
  compilerOptions: undefined,
});
function defaultCookieMiddleware(c:Context){
  

}
app.get("/",async (c)=>{
  return c.html(await handle.renderView("pages/index"));
})
app.get("/settings",async (c)=>{
  return c.html(await handle.renderView("pages/settings"));
})
app.get("/share-target/",async (c)=>{
  const link = c.req.query("link");
  //add failure condition
  const videoId = new URL(link!).searchParams.get("v");
  return c.html(await handle.renderView("pages/generate",{id:videoId}));
})
app.get(
    "/api/youtube",
    describeRoute({
        description:
            "Generate BRF braille recipe card file for a YouTube Recipe Video",
        responses: {
            200: {
                description: "Successful recipe card generated",
                content: {
                    "text/plain": { schema: resolver(youtubeResultSchema) },
                },
            },
        },
    }),
    validator("query", youtubeQuerySchema),
    async (c) => {
        const query = c.req.valid("query");
        const captionsPath = await getCaptionsYouTube({ id:query.id });
        const text = await convertSRTToText(captionsPath);
        const recipe = await createRecipeCard(text);
        const braillePath = await convertTextToBraille(recipe!,query.table,query.cellsPerLine,query.linesPerPage);
        return c.text(await Deno.readTextFile(braillePath));
    },
);
app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'BlindCook API',
        version: '1.0.0',
        description: 'BlindCook API',
      },
    },
  })
)

app.get(
  '/docs',
  swaggerUI({
    url: '/openapi',
  })
)
Deno.serve(app.fetch)