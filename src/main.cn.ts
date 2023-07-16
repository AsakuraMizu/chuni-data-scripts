import { client } from './client';
import { toretry } from './utils';
import type { Database } from './types';

interface DivingFishMusicEntry {
  id: number;
  title: string;
  ds: number[];
  // level: string[];
  // cids: number[];
  charts: Array<{
    // combo: number;
    charter: string;
  }>;
  basic_info: {
    // title: string; // use outside one (why duplicate???)
    artist: string;
    genre: string;
    bpm: number;
    // from: string;
  };
}

const df_music: DivingFishMusicEntry[] = await (
  await fetch('https://www.diving-fish.com/api/chunithmprober/music_data')
).json();

const music_to_upsert: Database['public']['Tables']['music']['Insert'][] = [];
const chart_to_upsert: Database['public']['Tables']['chart']['Insert'][] = [];

df_music.forEach((e) => {
  if (
    (e.title === 'UTAKATA' || e.title === 'Rule the World!!' || e.title === 'どうぶつ☆パラダイス') &&
    !e.basic_info.artist.startsWith('曲：')
  ) {
    e.basic_info.artist = '曲：' + e.basic_info.artist;
  }
  if (e.charts.length === 6) {
    const [, kanji, title] = /\[(.*?)\](.*)/g.exec(e.title)!;
    e.title = `${title}【${kanji}】`;
  }
});

df_music.forEach(({ id, title, ds, charts, basic_info: { artist, genre, bpm } }) => {
  // music
  music_to_upsert.push({
    id,
    title,
    artist,
    genre,
    bpm,
    available_cn: true,
  });

  // chart
  chart_to_upsert.push(
    ...ds
      .map((const_cn, diff): Database['public']['Tables']['chart']['Insert'] => ({
        id: id * 10 + diff,
        music_id: id,
        diff,
        charter: charts[diff].charter,
        const_cn: const_cn || undefined,
      }))
      .filter(({ charter }) => charter !== '-')
  );
});

argv['skip-data'] ||
  (await Promise.all([
    toretry(() => client.from('music').upsert(music_to_upsert)),
    toretry(() => client.from('chart').upsert(chart_to_upsert)),
  ]));
