import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface Options {
  force?: boolean,
  skip?: string[]
}

interface HasURL {
  url?: string,
}

interface BackgroundAsset {
  id: string,
  background: HasURL,
  video: HasURL,
  theme: HasURL,
}

interface FileResult {
  data: Buffer,
  filename?: string,
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
 * Download a single asset
 * @param url The URL of the asset
 * @returns A FileResult of the result, or undefined if it failed
 */
async function fetch_asset(url: string): Promise<FileResult | undefined> {
  try {
    console.log(`🕗 Downloading ${url}...`)
    let res = await fetch(url);
    console.log(`✅ Downloaded`)
    if (!res.ok) throw new Error;

    const split_url = url.split("/");
    const filename = split_url[split_url.length - 1];

    return {
      data: Buffer.from(await res.arrayBuffer()),
      filename
    }

  } catch (e) {
    console.error(`❌ An error occurred while fetching:\n${e}`);
    return undefined;
  }
}


/**
 * Download all assets relating to a background.
 * @param asset The JSON object containing URLs and definitions
 */
async function download_background(asset: BackgroundAsset, options: Options) {
  // extract data objects
  const { id, background, video, theme } = asset;

  const out_dir = path.join(ASSETS, id);

  if (fs.existsSync(out_dir)) {
    if (!options.force) {
      console.log(`⏭️ Skipping asset '${id}': Already downloaded`);
      return;
    }
  } else {
    if (options.skip?.includes(id)) {
      console.log(`⏭️ Skipping asset '${id}': Manually skipped`)
    }
    fs.mkdirSync(out_dir, { recursive: true });
  }

  if (video.url) {
    const res = await fetch_asset(video.url);
    if (res === undefined || res.filename === undefined) return;

    const { filename } = res;
    const file_path = path.join(out_dir, filename);
    fs.writeFileSync(file_path, res.data);

    const symlink_path = path.join(out_dir, "video.webm");
    if (!fs.existsSync(symlink_path))
      fs.symlinkSync(filename, symlink_path, "file");
  }

  if (background.url) {
    const res = await fetch_asset(background.url);
    if (res === undefined || res.filename === undefined) return;
    
    // save webp
    const { filename } = res;
    let file_path = path.join(out_dir, filename);
    fs.writeFileSync(file_path, res.data);
    
    // symlink it
    let symlink_path = path.join(out_dir, "background.webp");
    if (!fs.existsSync(symlink_path))
      fs.symlinkSync(filename, symlink_path, "file");


    // convert to png
    file_path = path.join(out_dir, filename.replace("webp", "png"));
    fs.writeFileSync(file_path, await sharp(res.data).png().toBuffer());

    // symlink
    symlink_path = path.join(out_dir, "background.png");
    if (!fs.existsSync(symlink_path))
      fs.symlinkSync(filename, symlink_path, "file");
  }


  if (theme.url) {
    const res = await fetch_asset(theme.url);
    if (res === undefined || res.filename === undefined) return;
    
    // save webp
    const { filename } = res;
    let file_path = path.join(out_dir, filename);
    fs.writeFileSync(file_path, res.data);
    
    // symlink it
    let symlink_path = path.join(out_dir, "theme.webp");
    if (!fs.existsSync(symlink_path))
      fs.symlinkSync(filename, symlink_path, "file");


    // convert to png
    file_path = path.join(out_dir, filename.replace("webp", "png"));
    fs.writeFileSync(file_path, await sharp(res.data).png().toBuffer());

    // symlink
    symlink_path = path.join(out_dir, "theme.png");
    if (!fs.existsSync(symlink_path))
      fs.symlinkSync(filename, symlink_path, "file");
  }

  console.log("💾 Saving manifest.json...")
  fs.writeFileSync(path.join(out_dir, "manifest.json"), JSON.stringify(asset, [
    "id",
    "video",
    "background",
    "theme",
    "url"
  ], 2));

  // add symlink
  if (video.url) {
    try {
      console.log("Attempting to remove 'latest' symlink")
      fs.unlinkSync("assets/latest");
    } catch {
      console.log("'latest' symlink does not exist...")
    }
    finally {
      console.log("Updating 'latest' symlink...")
      const symlink_path = path.join("assets", "latest");
      const relative_target = path.relative(path.dirname(symlink_path), out_dir);
      fs.symlinkSync(relative_target, symlink_path, "dir");
    }
  }

}

// --- main code ---

import { program } from 'commander';

program
  .option('-f, --force')
  .option('-s, --skip <id>');

program.parse();

const options: Options = {
  force: program.opts().force,
  skip: program.opts().skip?.split(',')
};


for (const background of backgrounds) {
  download_background(background, options);
}

