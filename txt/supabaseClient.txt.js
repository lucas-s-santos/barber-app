// Arquivo: supabaseClient.js (VERSÃO FINAL E SIMPLIFICADA)

import { createClient } from '@supabase/supabase-js';

// As suas credenciais, que estão corretas.
const supabaseUrl = "";
const supabaseAnonKey = "";

// A criação do cliente, simples e direta. Sem o objeto de configuração extra.
export const supabase = createClient(supabaseUrl, supabaseAnonKey );

// As outras importações e o AppState não são estritamente necessários para o login funcionar.
// Vamos remover para garantir que nada mais interfira.
// Se precisarmos deles mais tarde, podemos adicionar de volta.
