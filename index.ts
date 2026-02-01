import { YtDlp } from "npm:ytdlp-nodejs@3.4.2";
import { Hono } from "jsr:@hono/hono@4.11.7";
import { load as dotenv } from "jsr:@std/dotenv";
await dotenv({ envPath: ".env", export: true });
console.log(Deno.env.get("YT_DLP"));
const ytdlp = new YtDlp({
    binaryPath: Deno.env.get("YT_DLP"),
});

/*
const app = new Hono()

app.get('/captions', (c) => c.text('Hello Deno!'))

Deno.serve(app.fetch)
*/

async function getCaptionsYouTube(video: YoutubeVideo) {

    const link = `https://youtube.com/watch?v=${video.id}`;
    const subtitlePath = `./temp/youtubeCaptions/${crypto.randomUUID()}.%(ext)s`;
    await ytdlp.execBuilder(link).cookies(
        Deno.env.get("COOKIES")!,
    ).writeAutoSubs().options({
        skipDownload: true,
        output: subtitlePath,
        convertSubs:"srt"
    }).run();
    //const convertCommand = new Deno.Command("ffmpeg")
}
await getCaptionsYouTube({ id: "277lI9iBPFU" });
