// Arquivo: supabaseClient.ts (A versão final e adaptável)

import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { Platform } from 'react-native'; // Importa a API de Plataforma
import 'react-native-url-polyfill/auto';

// Importa o AsyncStorage APENAS se não estivermos na web
let storage;
if (Platform.OS !== 'web') {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    storage = AsyncStorage;
  } catch (e) {
    console.error('AsyncStorage não pôde ser importado. O modo offline não funcionará.', e);
  }
}

// Suas credenciais (verifique se estão corretas)
const supabaseUrl = "https://fydmedhjlhekhjbngwem.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5ZG1lZGhqbGhla2hqYm5nd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjQzNzMsImV4cCI6MjA3NjkwMDM3M30.-4lFbqQwxCwulqlK7mQNfPVJB-RTeGmKj7rLwsLobxU";

// Opções de configuração do Supabase
const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    // Se o 'storage' existir (não for web ), use-o.
    // Se for web, o Supabase usará o localStorage do navegador por padrão.
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Muito importante para web no Expo
  },
};

// Cria e exporta o cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

