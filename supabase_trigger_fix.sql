-- ============================================================================
-- CORRIGIR PERMISSÕES DA FUNÇÃO TRIGGER
-- ============================================================================

-- Primeiro, remover a trigger antiga
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover a função antiga
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar função SEM SECURITY DEFINER (usa permissões do usuário que chama)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome_completo, papel)
  VALUES (new.id, new.email, new.email, 'cliente')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Dar permissões adequadas ao schema e à função
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- Recriar a trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar que o trigger foi criado
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
