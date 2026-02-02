
import { load as dotenv } from "jsr:@std/dotenv";
import srtParser2 from "npm:srt-parser-2@1.2.3";
import { GoogleGenAI } from 'npm:@google/genai@1.39.0';
await dotenv({ envPath: ".env", export: true });



export async function getCaptionsYouTube(video: YoutubeVideo) {

    const link = `https://youtube.com/watch?v=${video.id}`;
    const captionsPath = `./temp/youtubeCaptions/${crypto.randomUUID()}`;

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
    return captionsPath+".en.srt";
}
export function convertSRTToText(directory: string) {
    const srtParser = new srtParser2();
    const file = Deno.readTextFileSync(directory);
    const text =srtParser.fromSrt(file).map(i=>i.text).join(" ");
    return text;
}
export async function createRecipeCard(text: string){
    const genAI = new GoogleGenAI({});
    const recipe = (await genAI.models.generateContent({
        model:"gemini-2.5-flash-lite",
        contents:`
        Generate a quick recipe card for this AI transcript of a cooking video. only use alphanumeric characters and newlines:
        ${text}
        `
    })).text;
    return recipe;
}
export async function saveTextToTemp(text:string,folder:string,ext:string){
    const path = `./temp/${folder}/${crypto.randomUUID()}.${ext}`
    await Deno.writeTextFile(path,text);
    return path;
}
export async function convertTextToBraille(text:string,table:string="en-ueb-g2.ctb",cellsPerLine:number=40,linesPerPage:number=25,formatFor:string="textDevice"){
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
