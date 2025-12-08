-- Remove o trigger que está causando problema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Confirma que foi removido
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
