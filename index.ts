import { YtDlp } from "npm:ytdlp-nodejs@3.4.2";
import { Hono } from "jsr:@hono/hono@4.11.7";
import { load as dotenv } from "jsr:@std/dotenv";
import srtParser2 from "npm:srt-parser-2@1.2.3";
import { GoogleGenAI } from 'npm:@google/genai@1.39.0';
await dotenv({ envPath: ".env", export: true });
console.log(Deno.env.get("YT_DLP"));
const ytdlp = new YtDlp({
    binaryPath: Deno.env.get("YT_DLP"),
});
const srtParser = new srtParser2();
const genAI = new GoogleGenAI({});

/*
const app = new Hono()

app.get('/captions', (c) => c.text('Hello Deno!'))

Deno.serve(app.fetch)
*/

async function getCaptionsYouTube(video: YoutubeVideo) {

    const link = `https://youtube.com/watch?v=${video.id}`;
    const captionsPath = `./temp/youtubeCaptions/${crypto.randomUUID()}`;
    /*const captionsCommand = await (ytdlp.execBuilder(link).cookies(
        Deno.env.get("COOKIES")!,
    ).writeAutoSubs().options({
        skipDownload: true,
        output: captionsPath,
        convertSubs:"srt"
    })).exec();*/
    await (new Deno.Command("yt-dlp",{
        args:[
            "--skip-download",
            "-o",
            captionsPath,
            "--write-auto-sub",
            "--remote-components",
            "ejs:github",
            "--cookies",
            Deno.env.get("COOKIES")!,
            link
        ],
        stdin:"inherit",
        stdout:"inherit",
        stderr:"inherit"
    })).output();
    await (new Deno.Command("ffmpeg",{
        args:[
            "-i",
            captionsPath+".en.vtt",
            captionsPath+".en.srt"
        ]
    })).output()
    //const convertCommand = new Deno.Command("ffmpeg")
    return captionsPath+".en.srt";
}
function convertSRTToText(directory: string) {
    const file = Deno.readTextFileSync(directory);
    const text =srtParser.fromSrt(file).map(i=>i.text).join(" ");
    return text;
}
async function createRecipeCard(text: string){
    const recipe = (await genAI.models.generateContent({
        model:"gemini-2.5-flash-lite",
        contents:`
        Generate a quick recipe card for this AI transcript of a cooking video. only use alphanumeric characters and newlines:
        ${text}
        `
    })).text;
    return recipe;
}
async function saveTextToTemp(text:string,folder:string,ext:string){
    const path = `./temp/${folder}/${crypto.randomUUID()}.${ext}`
    await Deno.writeTextFile(path,text);
    return path;
}
async function convertTextToBraille(text:string,table:string="en-ueb-g2.ctb",cellsPerLine:number=40,linesPerPage:number=25,formatFor:string="textDevice"){
    const textPath = await saveTextToTemp(text,"text","txt");

    const braillePath = `./temp/brf/${crypto.randomUUID()}.brf`;
    await (new Deno.Command("file2brl",{
        args:[
            "-C",
            `cellsPerLine=${cellsPerLine}`,
            "-C",
            `linesPerPage=${linesPerPage}`,
            "-C",
            `literaryTextTable=${table}`,
            "-C",
            `formatFor=${formatFor}`,
            textPath,
            braillePath
        ],
        stdin:"inherit",
        stdout:"inherit",
        stderr:"inherit"
    })).output()
    return braillePath;
}
const captionsPath = await getCaptionsYouTube({ id: "_uqlYtgRZXY" });

const captionsText = convertSRTToText(captionsPath);
const recipe = await createRecipeCard(captionsText);
await convertTextToBraille(recipe!);


console.log(recipe);