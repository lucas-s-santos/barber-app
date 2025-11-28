import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';

// 1. Lê as variáveis de ambiente do arquivo .env ou de `app.config.js` (expo.extra)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig && (Constants.expoConfig.extra as any)?.EXPO_PUBLIC_SUPABASE_URL) ||
  (Constants.manifest && (Constants.manifest.extra as any)?.EXPO_PUBLIC_SUPABASE_URL);

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig && (Constants.expoConfig.extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  (Constants.manifest && (Constants.manifest.extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// 2. Garante que as chaves foram carregadas antes de continuar
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'ERRO: As variáveis de ambiente do Supabase não foram encontradas. Verifique se o arquivo .env existe, se o `app.config.js` foi criado e se o servidor foi reiniciado.',
  );
}

// 3. Adaptador de armazenamento para evitar erros no servidor
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') {
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    await AsyncStorage.removeItem(key);
  },
};

// 4. Cria e exporta o cliente Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- Helper functions for common auth operations ---
export async function getUser(): Promise<{ user: User | null; error: any | null }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user: user ?? null, error: error ?? null };
}

export async function getSession(): Promise<{ session: Session | null; error: any | null }> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session: session ?? null, error: error ?? null };
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChanged(callback: (event: string, session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session ?? null);
  });
  // return unsubscribe function
  // @ts-ignore - subscription typing may vary by supabase version
  return () => data?.subscription?.unsubscribe && data.subscription.unsubscribe();
}

// 5. Gerencia a sessão quando o app fica ativo ou inativo
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
