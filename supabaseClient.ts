import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';

// 1. Lê as variáveis de ambiente do arquivo .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 2. Garante que as chaves foram carregadas antes de continuar
if (!supabaseUrl || !supabaseAnonKey ) {
  throw new Error("ERRO: As variáveis de ambiente do Supabase não foram encontradas. Verifique se o arquivo .env existe e se o servidor foi reiniciado.");
}

// 3. Adaptador de armazenamento para evitar erros no servidor
const storageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    AsyncStorage.removeItem(key);
  },
};

// 4. Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 5. Gerencia a sessão quando o app fica ativo ou inativo
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
