-- Migration para adicionar suporte a Dono de Barbearia
-- Execute este arquivo no SQL Editor do Supabase

-- 1. Adicionar novo valor ao enum papel_usuario
ALTER TYPE papel_usuario ADD VALUE IF NOT EXISTS 'dono_barbearia';

-- 2. Adicionar campos extras à tabela barbearias
ALTER TABLE barbearias 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS horario_abertura TIME,
ADD COLUMN IF NOT EXISTS horario_fechamento TIME,
ADD COLUMN IF NOT EXISTS dias_funcionamento TEXT[], -- Array com dias da semana: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
ADD COLUMN IF NOT EXISTS fotos_barbearia TEXT[], -- Array de URLs de fotos
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Criar tabela de convites para barbeiros (dono pode convidar barbeiro)
CREATE TABLE IF NOT EXISTS convites_barbeiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
  dono_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  barbeiro_email TEXT NOT NULL,
  barbeiro_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado', 'cancelado')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  respondido_em TIMESTAMPTZ
);

-- 4. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_convites_barbeiro_email ON convites_barbeiros(barbeiro_email);
CREATE INDEX IF NOT EXISTS idx_convites_barbearia ON convites_barbeiros(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_convites_status ON convites_barbeiros(status);
CREATE INDEX IF NOT EXISTS idx_barbearias_admin ON barbearias(admin_id);
CREATE INDEX IF NOT EXISTS idx_barbeiros_barbearia ON barbeiros(barbearia_id);

-- 5. Políticas RLS (Row Level Security)

-- Política para donos verem suas barbearias
CREATE POLICY IF NOT EXISTS "Donos podem ver suas barbearias"
ON barbearias FOR SELECT
USING (auth.uid() = admin_id);

-- Política para donos atualizarem suas barbearias
CREATE POLICY IF NOT EXISTS "Donos podem atualizar suas barbearias"
ON barbearias FOR UPDATE
USING (auth.uid() = admin_id);

-- Política para donos criarem barbearias
CREATE POLICY IF NOT EXISTS "Donos podem criar barbearias"
ON barbearias FOR INSERT
WITH CHECK (auth.uid() = admin_id);

-- Política para barbeiros verem a barbearia onde trabalham
CREATE POLICY IF NOT EXISTS "Barbeiros veem sua barbearia"
ON barbearias FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM barbeiros 
    WHERE barbeiros.barbearia_id = barbearias.id 
    AND barbeiros.perfil_id = auth.uid()
  )
);

-- Política para clientes verem todas as barbearias
CREATE POLICY IF NOT EXISTS "Clientes veem todas barbearias"
ON barbearias FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'cliente'
  )
);

-- Políticas para convites
CREATE POLICY IF NOT EXISTS "Donos podem gerenciar convites de sua barbearia"
ON convites_barbeiros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM barbearias 
    WHERE barbearias.id = convites_barbeiros.barbearia_id 
    AND barbearias.admin_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Barbeiros veem convites enviados para eles"
ON convites_barbeiros FOR SELECT
USING (
  barbeiro_email = (SELECT email FROM perfis WHERE id = auth.uid())
  OR barbeiro_id = auth.uid()
);

-- Políticas para barbeiros (tabela de vínculo)
CREATE POLICY IF NOT EXISTS "Donos podem gerenciar barbeiros de sua barbearia"
ON barbeiros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM barbearias 
    WHERE barbearias.id = barbeiros.barbearia_id 
    AND barbearias.admin_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Barbeiros veem seu próprio vínculo"
ON barbeiros FOR SELECT
USING (perfil_id = auth.uid());

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para atualizar updated_at em barbearias
DROP TRIGGER IF EXISTS update_barbearias_updated_at ON barbearias;
CREATE TRIGGER update_barbearias_updated_at
    BEFORE UPDATE ON barbearias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Habilitar RLS nas tabelas
ALTER TABLE barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites_barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE convites_barbeiros IS 'Convites de donos de barbearias para barbeiros';
COMMENT ON COLUMN barbearias.fotos_barbearia IS 'Array de URLs das fotos da barbearia';
COMMENT ON COLUMN barbearias.dias_funcionamento IS 'Array com dias de funcionamento: seg, ter, qua, qui, sex, sab, dom';
