import * as cheerio from 'cheerio';
import { htmlUnescape } from 'escape-goat';
import { PromisePool } from '@supercharge/promise-pool';
import type { Database } from './types';
import { client } from './client';
import { toretry } from './utils';
import { jacket_dir } from './config';

if (argv._.length !== 1) {
  throw new Error('no hdd path (specify like `pnpm tsx src/main.ts --mode=hdd <path>`)');
}
const base = argv._[0];

const musicDirs = [
  ...(await glob(path.join(base, 'data', 'A000', 'music', 'music*'), { onlyDirectories: true })),
  ...(await glob(path.join(base, 'bin', 'option', '*', 'music', 'music*'), { onlyDirectories: true })),
];

const music_to_upsert = new Map<number, Omit<Database['public']['Tables']['music']['Insert'], 'id'>>();
const chart_to_upsert = new Map<number, Omit<Database['public']['Tables']['chart']['Insert'], 'id'>>();
const jacket_to_convert: { id: number; jacket: string }[] = [];

for (let dir of musicDirs) {
  const content = await fs.readFile(path.join(dir, 'Music.xml'), 'utf-8');
  const $ = cheerio.load(content, { xml: true });

  // music
  const id = Number($('name id').text());
  const artist = htmlUnescape($('artistName str').text());
  const genre = $('genreNames list StringID:last-child str').text();

  const we_kanji = $('worldsEndTagName str').text();
  const we_star = Number($('starDifType').text());
  const title = htmlUnescape($('name str').text()) + (we_kanji === 'Invalid' ? '' : `【${we_kanji}】`);

  let bpm: number | undefined = undefined;

  // chart
  for (const el of $('fumens MusicFumenData')) {
    const $ = cheerio.load(el);
    if ($('enable').text() === 'false') continue;
    const chart_path = path.join(dir, $('file path').text());
    if (!(await fs.pathExists(chart_path))) continue;
    const diff = Number($('type id').text());
    const const_hdd = diff === 5 ? we_star : Number($('level').text() + '.' + $('levelDecimal').text());
    const chart = await fs.readFile(chart_path, 'utf-8');
    const charter = /^CREATOR\t(.*?)$/m.exec(chart)?.[1];
    bpm = Math.floor(Number(/^BPM_DEF\t.*?\t(.*?)\t.*?\t.*?$/m.exec(chart)?.[1])) || undefined;

    chart_to_upsert.set(id * 10 + diff, {
      music_id: id,
      diff,
      charter,
      const_hdd,
    });
  }

  music_to_upsert.set(id, {
    title,
    artist,
    genre,
    bpm,
    available_hdd: true,
  });

  // jacket
  const jacket = path.join(dir, $('jaketFile path').text());
  jacket_to_convert.push({ id, jacket });
}

argv['skip-data'] ||
  (await Promise.all([
    toretry(() => client.from('music').upsert([...music_to_upsert.entries()].map(([id, e]) => ({ id, ...e })))),
    toretry(() => client.from('chart').upsert([...chart_to_upsert.entries()].map(([id, e]) => ({ id, ...e })))),
  ]));

argv['skip-jacket'] ||
  (await PromisePool.for(jacket_to_convert).process(async ({ id, jacket }) => {
    await $`magick convert ${jacket} ${path.join(jacket_dir, 'webp', `${id}.webp`)}`;
    await $`magick convert ${jacket} ${path.join(jacket_dir, 'jpg', `${id}.jpg`)}`;
  }));
