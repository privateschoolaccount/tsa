import { Context, Hono } from "hono";
import { swaggerUI } from '@hono/swagger-ui'
import { describeRoute, resolver, validator,openAPIRouteHandler } from "hono-openapi";
import { z } from "https://deno.land/x/zod@v3.25/mod.ts";
import { Handlebars, HandlebarsConfig } from 'https://deno.land/x/handlebars/mod.ts';
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  generateCookie,
  generateSignedCookie,
} from 'hono/cookie'
import {createMiddleware} from 'hono/factory'
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
const defaultCookieMiddleware = createMiddleware(async (c, next) =>   {
  console.log("Checking default cookies...");
  const existingCookies  = {
    "cellsPerLine":getCookie(c,"cellsPerLine"),
    "linesPerPage":getCookie(c,"linesPerPage"),
    "table":getCookie(c,"table"),
  }
  const defaultCookies = {
    "cellsPerLine":"25",
    "linesPerPage":"30",
    "table":"en-ueb-g2.ctb"
  }
  for(const key in existingCookies){
    console.log(`Trying to set default cookie ${key}=${defaultCookies[key as keyof typeof defaultCookies]}`);
    console.log(`Existing value: ${existingCookies[key as keyof typeof existingCookies]}`);
    if(existingCookies[key as keyof typeof existingCookies] == undefined){
      setCookie(c,key,defaultCookies[key as keyof typeof defaultCookies],{
        expires:new Date(Date.now()+1000*60*60*24*365),
      });
      
    }
  }
  await next();
});
app.use("*",defaultCookieMiddleware);
app.get("/",async (c)=>{
  return c.html(await handle.renderView("pages/index"));
})
app.get("/settings",async (c)=>{
  return c.html(await handle.renderView("pages/settings",{
    "return":c.req.query("return") || null,
  }));
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