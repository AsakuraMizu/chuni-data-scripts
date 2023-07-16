import { PromisePool } from '@supercharge/promise-pool';

import { client } from './client';
import { chunirecToken, jacket_dir } from './config';
import { toretry } from './utils';
import type { Database } from './types';

interface SegaMusicEntry {
  id: string;
  catname: string;
  // newflag: string;
  title: string;
  // reading: string;
  artist: string;
  // lev_bas: string;
  // lev_adv: string;
  // lev_exp: 8string;
  // lev_mas: string;
  // lev_ult: string;
  we_kanji: string;
  we_star: string;
  // image: string;
}

interface ChunirecMusicEntry {
  meta: {
    id: string;
    title: string;
    genre: string;
    artist: string;
    // release: string;
    bpm: number;
  };
  data: Record<
    'BAS' | 'ADV' | 'EXP' | 'MAS' | 'ULT' | 'WE',
    {
      level: number;
      const: number;
      // maxcombo: number;
      // is_const_unknown: 0 | 1;
    }
  >;
}

const sega_music: SegaMusicEntry[] = await (await fetch('https://chunithm.sega.jp/storage/json/music.json')).json();
const chunirec_music: ChunirecMusicEntry[] = await (
  await fetch(`https://api.chunirec.net/2.0/music/showall.json?region=jp2&token=${chunirecToken}`)
).json();

sega_music.forEach((e) => {
  if (e.we_kanji !== '') {
    e.title += `【${e.we_kanji}】`;
  }
  if (e.artist === 'EBIMAYO ') {
    e.artist = 'EBIMAYO';
  }
});

chunirec_music.forEach((e) => {
  if (e.meta.genre === 'POPS&ANIME') {
    e.meta.genre = 'POPS & ANIME';
  }
  if (e.meta.artist.startsWith('Black Raison d’être')) {
    e.meta.artist = e.meta.artist.replace('Black Raison d’être', "Black Raison d'être");
  }
  if (e.meta.artist === 'Official髭男dism「東京リベンジャーズ」') {
    e.meta.artist = 'Official髭男dism TVアニメ『東京リベンジャーズ』';
  }
  if (e.meta.artist === 'YOASOBI テレビアニメ『BEASTARS』第二期') {
    e.meta.artist = 'YOASOBI  テレビアニメ『BEASTARS』第2期';
  }
  if (e.meta.artist === 'LiSA テレビアニメ「鬼滅の刃」無限列車編') {
    e.meta.artist = 'LiSA  テレビアニメ「鬼滅の刃」無限列車編';
  }
  if (e.meta.artist === 'koyori（電ポルＰ）') {
    e.meta.artist = 'koyori（電ポルP）';
  }
  if (e.meta.artist === '星街すいせい(ホロライブ)') {
    e.meta.artist = '星街すいせい（ホロライブ）';
  }
  if (e.meta.title === 'Quon' && e.meta.artist === 'DJ Noriken') {
    e.meta.artist = 'DJ Noriken「WACCA」';
  }
  if (e.meta.artist === '“漆黒”の堕天使《Gram》†Versus† “聖刻”の熾天使《Gram》「WACCA」') {
    e.meta.artist = '"漆黒"の堕天使《Gram》†Versus† "聖刻"の熾天使《Gram》「WACCA」';
  }
  if (e.meta.title === 'Scythe of Death' && e.meta.artist === 'Masahiro “Godspeed” Aoki') {
    e.meta.artist = 'Masahiro "Godspeed" Aoki';
  }
  if (
    (e.meta.title === 'UTAKATA' || e.meta.title === 'Rule the World!!' || e.meta.title === 'どうぶつ☆パラダイス') &&
    !e.meta.artist.startsWith('曲：')
  ) {
    e.meta.artist = '曲：' + e.meta.artist;
  }
});

const music_to_upsert: Database['public']['Tables']['music']['Insert'][] = [];
const chart_to_upsert: Database['public']['Tables']['chart']['Insert'][] = [];
const jacket_to_download: { id: number; chunirec_id: string }[] = [];

sega_music.forEach(({ id: id_, title, artist, catname: genre, we_star }) => {
  const id = parseInt(id_);
  const e1 = chunirec_music.find(
    (e1) =>
      e1.meta.artist == artist && e1.meta.title === title && (e1.meta.genre == genre || e1.meta.genre === "WORLD'S END")
  );
  if (!e1) {
    console.error(chalk.red(`${title}-${artist}(${genre}) not found!?`));
    return;
  }

  // music
  music_to_upsert.push({
    id,
    title,
    artist,
    genre,
    bpm: e1.meta.bpm,
    available_jp: true,
  });

  // jacket
  jacket_to_download.push({ id: id, chunirec_id: e1.meta.id });

  // chart
  chart_to_upsert.push(
    ...Object.entries(e1.data).map(([diffName, c]): Database['public']['Tables']['chart']['Insert'] => {
      const diff = { BAS: 0, ADV: 1, EXP: 2, MAS: 3, ULT: 4, WE: 5 }[diffName]!;
      return { id: id * 10 + diff, music_id: id, diff, const_jp: c.const || c.level || Number(we_star) };
    })
  );
});

argv['skip-data'] ||
  (await Promise.all([
    toretry(() => client.from('music').upsert(music_to_upsert)),
    toretry(() => client.from('chart').upsert(chart_to_upsert)),
  ]));

argv['skip-jacket'] ||
  (await PromisePool.for(jacket_to_download).process(async ({ id: sega_id, chunirec_id }) => {
    const page = await (await fetch(`https://db.chunirec.net/music/_/${chunirec_id}`)).text();
    if (page.includes('Music not found')) return;
    const jacket_url = 'https://db.chunirec.net/' + /background-image:url\('\/(.*?)'\)/g.exec(page)![1];
    const data = await (
      await fetch(jacket_url, { headers: { referer: `https://db.chunirec.net/music/_/${chunirec_id}` } })
    ).blob();
    await fs.writeFile(path.join(jacket_dir, 'jpg', `${sega_id}.jpg`), new DataView(await data.arrayBuffer()));
  }),
  await $`mogrify -resize 300x300 ${path.join(jacket_dir, 'jpg', '*.jpg')}`,
  await $`mogrify -format webp -path ${path.join(jacket_dir, 'webp')} ${path.join(jacket_dir, 'jpg', '*.jpg')}`);
