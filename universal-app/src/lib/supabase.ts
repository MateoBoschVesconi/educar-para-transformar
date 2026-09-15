import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anzkzcasszqqstwhamfm.supabase.co';
const supabaseAnonKey = 'sb_publishable_yCBVC5kXaCDQSkQtfJhgiA_qC7c-q40';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
