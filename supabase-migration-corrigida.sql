-- Migration Corrigida: Sistema com 4 Papéis + Admin Master
-- Execute este arquivo no SQL Editor do Supabase

-- 1. Adicionar novo valor ao enum papel_usuario (Admin Master)
ALTER TYPE papel_usuario ADD VALUE IF NOT EXISTS 'admin_master';

-- 2. Verificar e adicionar coluna criado_por em perfis
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES perfis(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 3. Verificar e adicionar campos em barbearias
ALTER TABLE barbearias 
ADD COLUMN IF NOT EXISTS criada_por UUID REFERENCES perfis(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS horario_abertura TIME,
ADD COLUMN IF NOT EXISTS horario_fechamento TIME,
ADD COLUMN IF NOT EXISTS dias_funcionamento TEXT[],
ADD COLUMN IF NOT EXISTS fotos_barbearia TEXT[],
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Expandir tabela barbeiros para rastrear quem adicionou
ALTER TABLE barbeiros
ADD COLUMN IF NOT EXISTS adicionado_por UUID REFERENCES perfis(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Criar tabela de Serviços do Barbeiro (IMPORTANTE!)
-- Cada barbeiro pode ter múltiplos serviços
CREATE TABLE IF NOT EXISTS servicos_barbeiro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  nome_servico TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2),
  duracao_minutos INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_perfis_papel ON perfis(papel);
CREATE INDEX IF NOT EXISTS idx_perfis_criado_por ON perfis(criado_por);
CREATE INDEX IF NOT EXISTS idx_barbearias_admin_id ON barbearias(admin_id);
CREATE INDEX IF NOT EXISTS idx_barbearias_criada_por ON barbearias(criada_por);
CREATE INDEX IF NOT EXISTS idx_barbeiros_barbearia ON barbeiros(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_barbeiros_perfil ON barbeiros(perfil_id);
CREATE INDEX IF NOT EXISTS idx_servicos_barbeiro_barbeiro ON servicos_barbeiro(barbeiro_id);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS em todas as tabelas relevantes
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_barbeiro ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA ADMIN_MASTER (VOCÊ)
-- ============================================

-- Admin Master vê todos os perfis
CREATE POLICY "Admin Master vê todos perfis"
ON perfis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- Admin Master pode criar/editar/deletar qualquer perfil
CREATE POLICY "Admin Master gerencia perfis"
ON perfis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- Admin Master vê todas as barbearias
CREATE POLICY "Admin Master vê todas barbearias"
ON barbearias FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- Admin Master pode gerenciar todas as barbearias
CREATE POLICY "Admin Master gerencia barbearias"
ON barbearias FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- Admin Master vê todos os barbeiros
CREATE POLICY "Admin Master vê todos barbeiros"
ON barbeiros FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- Admin Master pode gerenciar todos os barbeiros
CREATE POLICY "Admin Master gerencia barbeiros"
ON barbeiros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- Admin Master vê todos os serviços
CREATE POLICY "Admin Master vê todos servicos"
ON servicos_barbeiro FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.papel = 'admin_master'
  )
);

-- ============================================
-- POLÍTICAS PARA DONO_BARBEARIA
-- ============================================

-- Dono vê apenas SUAS informações
CREATE POLICY "Dono vê seu perfil"
ON perfis FOR SELECT
USING (id = auth.uid());

-- Dono vê apenas SUAS barbearias
CREATE POLICY "Dono vê suas barbearias"
ON barbearias FOR SELECT
USING (admin_id = auth.uid());

-- Dono edita apenas SUAS barbearias
CREATE POLICY "Dono edita suas barbearias"
ON barbearias FOR UPDATE
USING (admin_id = auth.uid());

-- Dono vê barbeiros da SUAS barbearias
CREATE POLICY "Dono vê barbeiros sua barbearia"
ON barbeiros FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM barbearias 
    WHERE barbearias.id = barbeiros.barbearia_id 
    AND barbearias.admin_id = auth.uid()
  )
);

-- Dono pode adicionar barbeiros à sua barbearia
CREATE POLICY "Dono adiciona barbeiros"
ON barbeiros FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM barbearias 
    WHERE barbearias.id = barbeiros.barbearia_id 
    AND barbearias.admin_id = auth.uid()
  )
);

-- Dono pode remover barbeiros da sua barbearia
CREATE POLICY "Dono remove barbeiros"
ON barbeiros FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM barbearias 
    WHERE barbearias.id = barbeiros.barbearia_id 
    AND barbearias.admin_id = auth.uid()
  )
);

-- ============================================
-- POLÍTICAS PARA BARBEIRO
-- ============================================

-- Barbeiro vê seu próprio perfil
CREATE POLICY "Barbeiro vê seu perfil"
ON perfis FOR SELECT
USING (id = auth.uid());

-- Barbeiro edita apenas seu perfil
CREATE POLICY "Barbeiro edita seu perfil"
ON perfis FOR UPDATE
USING (id = auth.uid());

-- Barbeiro vê a barbearia onde trabalha
CREATE POLICY "Barbeiro vê sua barbearia"
ON barbearias FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM barbeiros 
    WHERE barbeiros.barbearia_id = barbearias.id 
    AND barbeiros.perfil_id = auth.uid()
  )
);

-- Barbeiro vê seus próprios serviços
CREATE POLICY "Barbeiro vê seus servicos"
ON servicos_barbeiro FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM barbeiros 
    WHERE barbeiros.id = servicos_barbeiro.barbeiro_id 
    AND barbeiros.perfil_id = auth.uid()
  )
);

-- Barbeiro cria seus próprios serviços
CREATE POLICY "Barbeiro cria servicos"
ON servicos_barbeiro FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM barbeiros 
    WHERE barbeiros.id = servicos_barbeiro.barbeiro_id 
    AND barbeiros.perfil_id = auth.uid()
  )
);

-- Barbeiro edita seus próprios serviços
CREATE POLICY "Barbeiro edita servicos"
ON servicos_barbeiro FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM barbeiros 
    WHERE barbeiros.id = servicos_barbeiro.barbeiro_id 
    AND barbeiros.perfil_id = auth.uid()
  )
);

-- Barbeiro deleta seus próprios serviços
CREATE POLICY "Barbeiro deleta servicos"
ON servicos_barbeiro FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM barbeiros 
    WHERE barbeiros.id = servicos_barbeiro.barbeiro_id 
    AND barbeiros.perfil_id = auth.uid()
  )
);

-- ============================================
-- POLÍTICAS PARA CLIENTE
-- ============================================

-- Cliente vê seu próprio perfil
CREATE POLICY "Cliente vê seu perfil"
ON perfis FOR SELECT
USING (id = auth.uid());

-- Cliente edita apenas seu perfil
CREATE POLICY "Cliente edita seu perfil"
ON perfis FOR UPDATE
USING (id = auth.uid());

-- Cliente vê todas as barbearias (para agendar)
CREATE POLICY "Cliente vê todas barbearias"
ON barbearias FOR SELECT
USING (true);

-- Cliente vê serviços de todos barbeiros
CREATE POLICY "Cliente vê servicos barbeiros"
ON servicos_barbeiro FOR SELECT
USING (true);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para barbearias
DROP TRIGGER IF EXISTS update_barbearias_updated_at ON barbearias;
CREATE TRIGGER update_barbearias_updated_at
    BEFORE UPDATE ON barbearias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para servicos_barbeiro
DROP TRIGGER IF EXISTS update_servicos_updated_at ON servicos_barbeiro;
CREATE TRIGGER update_servicos_updated_at
    BEFORE UPDATE ON servicos_barbeiro
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE servicos_barbeiro IS 'Serviços oferecidos por cada barbeiro - cada barbeiro escolhe seus próprios serviços';
COMMENT ON COLUMN servicos_barbeiro.barbeiro_id IS 'FK para a tabela barbeiros';
COMMENT ON COLUMN servicos_barbeiro.preco IS 'Preço do serviço';
COMMENT ON COLUMN servicos_barbeiro.duracao_minutos IS 'Tempo estimado do serviço';
COMMENT ON COLUMN perfis.criado_por IS 'Qual admin criou este perfil';
COMMENT ON COLUMN barbearias.criada_por IS 'Qual admin criou esta barbearia';
COMMENT ON COLUMN barbeiros.adicionado_por IS 'Qual dono adicionou este barbeiro';
