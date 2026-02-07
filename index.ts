import { Context, Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import {
  describeRoute,
  openAPIRouteHandler,
  resolver,
  validator,
} from "hono-openapi";
import { z } from "https://deno.land/x/zod@v3.25/mod.ts";
import {
  Handlebars,
  HandlebarsConfig,
} from "https://deno.land/x/handlebars/mod.ts";
import {
  deleteCookie,
  generateCookie,
  generateSignedCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "hono/cookie";
import { createMiddleware } from "hono/factory";
import {
  convertSRTToText,
  convertTextToBraille,
  createRecipeCard,
  getCaptionsYouTube,
} from "./utils.ts";
import { serveStatic } from 'hono/deno'
const app = new Hono();

const youtubeQuerySchema = z.object({
  id: z.string(),
  linesPerPage: z.optional(z.number()),
  cellsPerLine: z.optional(z.number()),
  table: z.optional(z.enum(["en-ueb-g2.ctb", "en-ueb-g1.ctb"])),
});
const youtubeQuerySchemaWithCookies = z.object({
  id: z.string(),
});
const youtubeResultSchema = z.object({
  braille: z.string(),
  text: z.string(),
});
const handle = new Handlebars({
  baseDir: "./html",
  layoutsDir: "layouts/",
  partialsDir: "partials/",
  extname: ".hbs",
  defaultLayout: "boilerplate",
  helpers: {
    "eq": function (v1: any, v2: any) {
      return v1 === v2;
    },
  },
  compilerOptions: undefined,
});

const defaultCookies = {
  "cellsPerLine": "25",
  "linesPerPage": "30",
  "table": "en-ueb-g2.ctb",
};
const defaultCookieMiddleware = createMiddleware(async (c, next) => {
  //console.log("Checking default cookies...");
  const existingCookies = {
    "cellsPerLine": getCookie(c, "cellsPerLine"),
    "linesPerPage": getCookie(c, "linesPerPage"),
    "table": getCookie(c, "table"),
  };

  for (const key in existingCookies) {
    /*console.log(
      `Trying to set default cookie ${key}=${
        defaultCookies[key as keyof typeof defaultCookies]
      }`,
    );*/
    /*console.log(
      `Existing value: ${existingCookies[key as keyof typeof existingCookies]}`,
    );*/
    if (existingCookies[key as keyof typeof existingCookies] == undefined) {
      setCookie(c, key, defaultCookies[key as keyof typeof defaultCookies], {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      });
    }
  }
  await next();
});
app.use("*", defaultCookieMiddleware);
app.get("/", async (c) => {
  return c.html(await handle.renderView("pages/index"));
});
app.get("/home", async (c) => {
  return c.html(await handle.renderView("pages/home"));
});
app.get("/delete", async (c) => {
  return c.html(await handle.renderView("pages/delete"));
});
app.get("/settings", async (c) => {
  /*
  console.log("Rendering settings page with cookies:");
  console.log("cellsPerLine:", getCookie(c, "cellsPerLine"));
  console.log("linesPerPage:", getCookie(c, "linesPerPage"));
  console.log("table:", getCookie(c, "table"));
  */
  return c.html(
    await handle.renderView("pages/settings", {
      "return": c.req.query("return") || null,
      "cellsPerLine": getCookie(c, "cellsPerLine") ||
        defaultCookies.cellsPerLine,
      "linesPerPage": getCookie(c, "linesPerPage") ||
        defaultCookies.linesPerPage,
      "table": getCookie(c, "table") || defaultCookies.table,
      "tableOptions": youtubeQuerySchema.shape.table.unwrap().options,
    }),
  );
});
app.get("/download",async(c)=>{
  return c.html(await handle.renderView("pages/download"));
});
app.get("/share-target/", async (c) => {
  const url = c.req.query("text");
  const title = c.req.query("title");
  let videoId;
  if(url!.includes("shorts")){
    videoId = new URL(url!).pathname.split("/")[2];
  } else{
    videoId = new URL(url!).searchParams.get("v");
  }
  //add failure condition
  
  return c.html(await handle.renderView("pages/generate", { id: videoId,title }));
});
app.get(
  "/api/youtube/withParameters",
  describeRoute({
    description:
      "Generate BRF braille recipe card file for a YouTube Recipe Video using URL params",
    responses: {
      200: {
        description: "Successful recipe card generated",
        content: {
          "application/json": { schema: resolver(youtubeResultSchema) },
        },
      },
    },
  }),
  validator("query", youtubeQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const captionsPath = await getCaptionsYouTube({ id: query.id });
    const text = await convertSRTToText(captionsPath);
    const recipe = await createRecipeCard(text);
    const braillePath = await convertTextToBraille(
      recipe!,
      query.table,
      query.cellsPerLine,
      query.linesPerPage,
    );
    return c.json({
      braille: await Deno.readTextFile(braillePath),
      text: recipe!,
    });
  },
);
app.get(
  "/api/youtube/withCookies",
  describeRoute({
    description:
      "Generate BRF braille recipe card file for a YouTube Recipe Video using cookies for parameters",
    responses: {
      200: {
        description: "Successful recipe card generated",
        content: {
          "application/json": { schema: resolver(youtubeResultSchema) },
        },
      },
    },
  }),
  validator("query", youtubeQuerySchemaWithCookies),
  async (c) => {
    const query = c.req.valid("query");
    const captionsPath = await getCaptionsYouTube({ id: query.id });
    const text = await convertSRTToText(captionsPath);
    const recipe = await createRecipeCard(text);
    const braillePath = await convertTextToBraille(
      recipe!,
      getCookie(c, "table"),
      Number(getCookie(c, "cellsPerLine")) || 25,
      Number(getCookie(c, "linesPerPage") || 30),
    );
    return c.json({
      braille: await Deno.readTextFile(braillePath),
      text: recipe!,
    });
  },
);
app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "BlindCook API",
        version: "1.0.0",
        description: "BlindCook API",
      },
    },
  }),
);
app.get('*', serveStatic({root:"./static"}));
app.get(
  "/docs",
  swaggerUI({
    url: "/openapi",
  }),
);
app.notFound((c) => {
  console.log(`404 Not Found for URL: ${c.req.url}`); // Custom logging
  return c.text('Custom 404 Message: Resource Not Found', 404); // Custom response
});
Deno.serve(app.fetch);
