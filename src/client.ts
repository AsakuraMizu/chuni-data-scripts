import { createClient } from '@supabase/supabase-js';

import { type Database } from './types';
import { supabaseUrl, supabaseKey } from './config';

export const client = createClient<Database>(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
