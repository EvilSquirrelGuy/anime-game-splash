import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface HasURL {
  url?: string
}

interface BackgroundAsset {
  id: string,
  background: HasURL,
  video: HasURL,
  theme: HasURL,
  type: string,
}

const API_URL = "https://sg-hyp-api.hoyoverse.com/hyp/hyp-connect/api/getAllGameBasicInfo?launcher_id=VYTpXlbWo8&language=en";

const api_res: any = await (await fetch(API_URL)).json();
const api_data: any = api_res.data.game_info_list;

const genshin_data: any = api_data.find((item: any) => item.game.biz === "hk4e_global");
const backgrounds: BackgroundAsset[] = genshin_data.backgrounds;

// const video_urls: (string)[] = backgrounds.map(x => x.video.url).filter(x => x !== "").filter(x => x !== undefined);
// const background_urls: (string | undefined)[] = backgrounds.map(x => x.background.url).filter(x => x !== null);

const ASSETS = './assets';
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS);

/**
 * Download all assets relating to a background.
 * @param asset The JSON object containing URLs and definitions
 */
async function download_background(asset: BackgroundAsset) {
  // extract data objects
  const { id, background, video, theme } = asset;

  const out_dir = path.join(ASSETS, id);

  if (fs.existsSync(out_dir)) {
    console.log(`Already downloaded background with ID ${id}, skipping...`);
    return;
  } else {
    fs.mkdirSync(out_dir, { recursive: true });
  }

  // GET VIDEO IF EXISTS

  if (video.url) {
    try {
      let res = await fetch(video.url);
      if (!res.ok) throw new Error;

      const split_url = video.url.split("/");
      const filename = split_url[split_url.length - 1] || "video.webm";

      fs.writeFileSync(path.join(out_dir, filename), Buffer.from(await res.arrayBuffer()));
    } catch (e) {
      console.error(`An error occurred while fetching:\n${e}`);
    }
  
  }

  if (background.url) {
    try {
      let res = await fetch(background.url);
      if (!res.ok) throw new Error;

      const split_url = background.url.split("/");
      const filename = split_url[split_url.length - 1] || "background.webp";

      fs.writeFileSync(path.join(out_dir, filename), Buffer.from(await res.arrayBuffer()));
    } catch (e) {
      console.error(`An error occurred while fetching:\n${e}`);
    }

  }


  if (theme.url) {
    try {
      let res = await fetch(theme.url);
      if (!res.ok) throw new Error;

      const split_url = theme.url.split("/");
      const filename = split_url[split_url.length - 1] || "theme.webp";

      fs.writeFileSync(path.join(out_dir, filename), Buffer.from(await res.arrayBuffer()));
    } catch (e) {
      console.error(`An error occurred while fetching:\n${e}`);
    }
  
  }

}


for (const background of backgrounds) {
  download_background(background);
}

