import { fileURLToPath } from 'node:url';

if (!$.env.SUPABASE_URL) throw new Error('SUPABASE_URL missing');
if (!$.env.SUPABASE_KEY) throw new Error('SUPABASE_KEY missing');
if (!$.env.CHUNIREC_TOKEN) throw new Error('CHUNIREC_TOKEN missing');

export const supabaseUrl = $.env.SUPABASE_URL;
export const supabaseKey = $.env.SUPABASE_KEY;
export const chunirecToken = $.env.CHUNIREC_TOKEN;

export const jacket_dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'jacket');
