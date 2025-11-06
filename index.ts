import sharp from 'sharp';
import fs from 'fs';

const API_URL = "https://sg-hyp-api.hoyoverse.com/hyp/hyp-connect/api/getAllGameBasicInfo?launcher_id=VYTpXlbWo8&language=en";


const api_data: any = await (await fetch(API_URL)).json();

const genshin_data: any = api_data.data.game_info_list[2];
const backgrounds: any = genshin_data.backgrounds;

const video_url = backgrounds[0].video.url;
const theme_url = backgrounds[0].theme.url;
const bg_url = backgrounds[0].background.url;

const dt = Date.now();

const outDir = './assets'
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// video
console.log(`Fetching url: ${video_url}`)
let res = await fetch(video_url);

if (!res.ok) {
  console.error(`Failed to fetch ${video_url}`)
}

fs.writeFileSync(`${outDir}/latest_video.webm`, Buffer.from(await res.arrayBuffer()));
fs.copyFileSync(`${outDir}/latest_video.webm`, `${outDir}/${dt}_video.webm`)

// theme
console.log(`Fetching url: ${theme_url}`)
res = await fetch(theme_url);

if (!res.ok) {
  console.error(`Failed to fetch ${theme_url}`)
}

let buf = Buffer.from(await res.arrayBuffer());
let png = await sharp(buf).png().toBuffer();

fs.writeFileSync(`${outDir}/latest_theme.png`, png);
fs.copyFileSync(`${outDir}/latest_theme.png`, `${outDir}/${dt}_theme.png`)

// bg
console.log(`Fetching url: ${bg_url}`)
res = await fetch(bg_url);

if (!res.ok) {
  console.error(`Failed to fetch ${bg_url}`)
}

buf = Buffer.from(await res.arrayBuffer());
png = await sharp(buf).png().toBuffer();

fs.writeFileSync(`${outDir}/latest_bg.png`, png);
fs.copyFileSync(`${outDir}/latest_bg.png`, `${outDir}/${dt}_bg.png`)


// $.data.game_info_list[2].backgrounds[0].background.url

