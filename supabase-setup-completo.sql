-- ============================================================================
-- SETUP COMPLETO DO BANCO — Barber App (SaaS multi-barbearia)
-- ----------------------------------------------------------------------------
-- Este arquivo SUBSTITUI os antigos (supabase.sql, supabase-migration-*.sql).
-- É IDEMPOTENTE: pode rodar quantas vezes quiser, mesmo com dados existentes.
-- Como rodar: Supabase -> SQL Editor -> cole TUDO -> Run.
--
-- O que ele faz:
--   1. Garante colunas/tabelas que faltam (ex.: perfis.data_nascimento)
--   2. Cria funções "helper" SECURITY DEFINER (evita recursão no RLS)
--   3. Cria gatilho que monta o PERFIL automaticamente no cadastro
--   4. Protege o campo "papel" contra escalada de privilégio
--   5. Liga RLS em todas as tabelas e cria políticas limpas (corrige vazamento)
--   6. Cria a função get_horarios_disponiveis (agendamento depende dela)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) Extensões e valores de enum
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- Garante os papéis (não dá erro se já existirem)
do $$
begin
  begin alter type papel_usuario add value if not exists 'cliente'; exception when others then null; end;
  begin alter type papel_usuario add value if not exists 'barbeiro'; exception when others then null; end;
  begin alter type papel_usuario add value if not exists 'dono_barbearia'; exception when others then null; end;
  begin alter type papel_usuario add value if not exists 'admin_master'; exception when others then null; end;
end$$;

-- Garante os status de agendamento
do $$
begin
  begin alter type status_agendamento add value if not exists 'pendente'; exception when others then null; end;
  begin alter type status_agendamento add value if not exists 'confirmado'; exception when others then null; end;
  begin alter type status_agendamento add value if not exists 'concluido'; exception when others then null; end;
  begin alter type status_agendamento add value if not exists 'cancelado'; exception when others then null; end;
end$$;

-- ----------------------------------------------------------------------------
-- 1) Colunas que podem estar faltando (todas idempotentes)
-- ----------------------------------------------------------------------------
alter table perfis
  add column if not exists data_nascimento date,
  add column if not exists criado_por uuid references perfis(id) on delete set null,
  add column if not exists ativo boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table barbearias
  add column if not exists criada_por uuid references perfis(id) on delete set null,
  add column if not exists latitude decimal(10,8),
  add column if not exists longitude decimal(11,8),
  add column if not exists horario_abertura time,
  add column if not exists horario_fechamento time,
  add column if not exists dias_funcionamento text[],
  add column if not exists fotos_barbearia text[],
  add column if not exists descricao text,
  add column if not exists telefone text,
  add column if not exists ativo boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table barbeiros
  add column if not exists adicionado_por uuid references perfis(id) on delete set null,
  add column if not exists created_at timestamptz default now();

-- Constraint única para o upsert de horários (barbeiro_id, dia_semana) funcionar
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cfg_horarios_barbeiro_dia_uniq') then
    alter table configuracoes_horarios
      add constraint cfg_horarios_barbeiro_dia_uniq unique (barbeiro_id, dia_semana);
  end if;
end$$;

-- Serviços por barbeiro (recurso "Meus Serviços" do barbeiro)
create table if not exists servicos_barbeiro (
  id uuid primary key default uuid_generate_v4(),
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  nome_servico text not null,
  descricao text,
  preco decimal(10,2),
  duracao_minutos integer,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Convites de barbeiros (dono convida barbeiro por e-mail)
create table if not exists convites_barbeiros (
  id uuid primary key default uuid_generate_v4(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  dono_id uuid not null references perfis(id) on delete cascade,
  barbeiro_email text not null,
  barbeiro_id uuid references perfis(id) on delete set null,
  status text default 'pendente' check (status in ('pendente','aceito','recusado','cancelado')),
  criado_em timestamptz default now(),
  respondido_em timestamptz
);

-- ----------------------------------------------------------------------------
-- 2) Funções helper (SECURITY DEFINER => ignoram RLS => SEM recursão)
--    São a base de todas as políticas. NUNCA consultam perfis dentro de
--    uma política de perfis sem passar por aqui.
-- ----------------------------------------------------------------------------
create or replace function public.eh_admin_master()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from perfis where id = auth.uid() and papel = 'admin_master');
$$;

create or replace function public.eh_dono_barbearia(p_barbearia_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from barbearias where id = p_barbearia_id and admin_id = auth.uid());
$$;

create or replace function public.eh_dono_do_barbeiro(p_barbeiro_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from barbeiros b
    join barbearias ba on ba.id = b.barbearia_id
    where b.id = p_barbeiro_id and ba.admin_id = auth.uid()
  );
$$;

create or replace function public.eh_o_barbeiro(p_barbeiro_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from barbeiros where id = p_barbeiro_id and perfil_id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- 3) Gatilho: cria o PERFIL automaticamente quando o usuário se cadastra.
--    O app passa nome/telefone/papel via "options.data" do signUp.
--    Só permite auto-cadastro como CLIENTE ou DONO. (barbeiro/admin só por dentro)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_papel_txt text := coalesce(v_meta->>'papel', 'cliente');
  v_papel papel_usuario;
  v_nome_barbearia text := nullif(v_meta->>'nome_barbearia', '');
  v_endereco text := coalesce(nullif(v_meta->>'endereco', ''), '');
begin
  if v_papel_txt = 'dono_barbearia' then
    v_papel := 'dono_barbearia';
  else
    v_papel := 'cliente';
  end if;

  insert into perfis (id, email, nome_completo, telefone, data_nascimento, papel)
  values (
    new.id,
    new.email,
    nullif(v_meta->>'nome_completo', ''),
    nullif(v_meta->>'telefone', ''),
    (nullif(v_meta->>'data_nascimento', ''))::date,
    v_papel
  )
  on conflict (id) do nothing;

  -- Dono que informou o nome da barbearia já sai com a barbearia criada
  if v_papel = 'dono_barbearia' and v_nome_barbearia is not null then
    insert into barbearias (nome_barbearia, admin_id, endereco, ativo)
    values (v_nome_barbearia, new.id, v_endereco, true);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4) Guarda de papel: ninguém muda o próprio "papel" (só admin_master pode)
-- ----------------------------------------------------------------------------
create or replace function public.guard_papel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() nulo = contexto de backend/SQL Editor/service_role (confiável).
  -- O flag 'app.promovendo_barbeiro' é ligado pela RPC vincular_barbeiro_por_email
  -- (dono promovendo alguém a barbeiro de forma controlada).
  -- Fora isso, um USUÁRIO comum não pode mudar o próprio papel.
  if new.papel is distinct from old.papel
     and auth.uid() is not null
     and not public.eh_admin_master()
     and coalesce(current_setting('app.promovendo_barbeiro', true), '') <> '1' then
    new.papel := old.papel; -- ignora a tentativa de trocar de papel
  end if;
  return new;
end;
$$;

-- RPC: dono adiciona um barbeiro pelo e-mail (promove a 'barbeiro' + cria vínculo).
-- A pessoa precisa já ter uma conta (cadastrada como cliente, por ex.).
create or replace function public.vincular_barbeiro_por_email(p_email text, p_barbearia_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil uuid;
  v_barbeiro uuid;
begin
  if not (public.eh_dono_barbearia(p_barbearia_id) or public.eh_admin_master()) then
    raise exception 'Sem permissão para adicionar barbeiros a esta barbearia';
  end if;

  select id into v_perfil from perfis where lower(email) = lower(trim(p_email));
  if v_perfil is null then
    raise exception 'Nenhum usuário com esse e-mail. Peça para a pessoa criar a conta primeiro.';
  end if;

  -- promove a barbeiro só quem é cliente (não rebaixa dono nem admin).
  -- Um dono que se adiciona como barbeiro mantém o papel de dono + ganha o vínculo.
  perform set_config('app.promovendo_barbeiro', '1', true);
  update perfis set papel = 'barbeiro' where id = v_perfil and papel = 'cliente';

  select id into v_barbeiro
  from barbeiros where perfil_id = v_perfil and barbearia_id = p_barbearia_id;
  if v_barbeiro is null then
    insert into barbeiros (perfil_id, barbearia_id, adicionado_por)
    values (v_perfil, p_barbearia_id, auth.uid())
    returning id into v_barbeiro;
  end if;

  return v_barbeiro;
end;
$$;

grant execute on function public.vincular_barbeiro_por_email(text, uuid) to authenticated;

drop trigger if exists trg_guard_papel on perfis;
create trigger trg_guard_papel before update on perfis
  for each row execute function public.guard_papel();

-- ----------------------------------------------------------------------------
-- 5) RLS: liga em tudo, apaga políticas antigas (inclui as recursivas) e
--    recria políticas limpas. Isto corrige o vazamento p/ a chave anon.
-- ----------------------------------------------------------------------------
alter table perfis                 enable row level security;
alter table barbearias             enable row level security;
alter table barbeiros              enable row level security;
alter table servicos               enable row level security;
alter table servicos_barbeiro      enable row level security;
alter table agendamentos           enable row level security;
alter table avaliacoes             enable row level security;
alter table configuracoes_horarios enable row level security;
alter table horarios_bloqueados    enable row level security;
alter table convites_barbeiros     enable row level security;

-- Apaga TODAS as políticas existentes dessas tabelas
do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('perfis','barbearias','barbeiros','servicos','servicos_barbeiro',
                        'agendamentos','avaliacoes','configuracoes_horarios',
                        'horarios_bloqueados','convites_barbeiros')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end$$;

-- ---- perfis -----------------------------------------------------------------
-- Vê: o próprio; admin vê todos; barbeiros são visíveis (para agendar).
create policy perfis_select on perfis for select to authenticated
  using (id = auth.uid() or public.eh_admin_master() or papel = 'barbeiro');
-- Atualiza: o próprio ou admin (o gatilho guard_papel impede trocar papel).
create policy perfis_update on perfis for update to authenticated
  using (id = auth.uid() or public.eh_admin_master());
-- Apaga: só admin. (INSERT só acontece pelo gatilho handle_new_user.)
create policy perfis_delete on perfis for delete to authenticated
  using (public.eh_admin_master());

-- ---- barbearias -------------------------------------------------------------
create policy barbearias_select on barbearias for select to authenticated
  using (ativo = true or admin_id = auth.uid() or public.eh_admin_master());
create policy barbearias_insert on barbearias for insert to authenticated
  with check (admin_id = auth.uid() or public.eh_admin_master());
create policy barbearias_update on barbearias for update to authenticated
  using (admin_id = auth.uid() or public.eh_admin_master());
create policy barbearias_delete on barbearias for delete to authenticated
  using (admin_id = auth.uid() or public.eh_admin_master());

-- ---- barbeiros (vínculo barbeiro<->barbearia) -------------------------------
create policy barbeiros_select on barbeiros for select to authenticated
  using (true);
create policy barbeiros_insert on barbeiros for insert to authenticated
  with check (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());
create policy barbeiros_update on barbeiros for update to authenticated
  using (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());
create policy barbeiros_delete on barbeiros for delete to authenticated
  using (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());

-- ---- servicos (catálogo da barbearia) ---------------------------------------
create policy servicos_select on servicos for select to authenticated
  using (true);
create policy servicos_insert on servicos for insert to authenticated
  with check (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());
create policy servicos_update on servicos for update to authenticated
  using (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());
create policy servicos_delete on servicos for delete to authenticated
  using (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());

-- ---- servicos_barbeiro ------------------------------------------------------
create policy servicos_barbeiro_select on servicos_barbeiro for select to authenticated
  using (true);
create policy servicos_barbeiro_ins on servicos_barbeiro for insert to authenticated
  with check (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy servicos_barbeiro_upd on servicos_barbeiro for update to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy servicos_barbeiro_del on servicos_barbeiro for delete to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());

-- ---- agendamentos -----------------------------------------------------------
create policy agendamentos_select on agendamentos for select to authenticated
  using (
    cliente_id = auth.uid()
    or public.eh_o_barbeiro(barbeiro_id)
    or public.eh_dono_do_barbeiro(barbeiro_id)
    or public.eh_admin_master()
  );
create policy agendamentos_insert on agendamentos for insert to authenticated
  with check (cliente_id = auth.uid());
create policy agendamentos_update on agendamentos for update to authenticated
  using (
    cliente_id = auth.uid()
    or public.eh_o_barbeiro(barbeiro_id)
    or public.eh_dono_do_barbeiro(barbeiro_id)
    or public.eh_admin_master()
  );
create policy agendamentos_delete on agendamentos for delete to authenticated
  using (cliente_id = auth.uid() or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());

-- ---- avaliacoes -------------------------------------------------------------
create policy avaliacoes_select on avaliacoes for select to authenticated
  using (true);
create policy avaliacoes_insert on avaliacoes for insert to authenticated
  with check (exists (select 1 from agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid()));
create policy avaliacoes_update on avaliacoes for update to authenticated
  using (exists (select 1 from agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid()) or public.eh_admin_master());
create policy avaliacoes_delete on avaliacoes for delete to authenticated
  using (exists (select 1 from agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid()) or public.eh_admin_master());

-- ---- configuracoes_horarios -------------------------------------------------
create policy cfg_horarios_select on configuracoes_horarios for select to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy cfg_horarios_ins on configuracoes_horarios for insert to authenticated
  with check (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy cfg_horarios_upd on configuracoes_horarios for update to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy cfg_horarios_del on configuracoes_horarios for delete to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());

-- ---- horarios_bloqueados ----------------------------------------------------
create policy bloqueios_select on horarios_bloqueados for select to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy bloqueios_ins on horarios_bloqueados for insert to authenticated
  with check (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy bloqueios_upd on horarios_bloqueados for update to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());
create policy bloqueios_del on horarios_bloqueados for delete to authenticated
  using (public.eh_o_barbeiro(barbeiro_id) or public.eh_dono_do_barbeiro(barbeiro_id) or public.eh_admin_master());

-- ---- convites_barbeiros -----------------------------------------------------
create policy convites_select on convites_barbeiros for select to authenticated
  using (
    public.eh_dono_barbearia(barbearia_id)
    or barbeiro_email = (select email from perfis where id = auth.uid())
    or public.eh_admin_master()
  );
create policy convites_all on convites_barbeiros for all to authenticated
  using (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master())
  with check (public.eh_dono_barbearia(barbearia_id) or public.eh_admin_master());

-- ----------------------------------------------------------------------------
-- 6) RPC de horários disponíveis (usada pela tela de agendamento)
--    p_barbeiro_id = barbeiros.id (o vínculo, não o perfil)
-- ----------------------------------------------------------------------------
create or replace function public.get_horarios_disponiveis(
  p_barbeiro_id uuid,
  p_data date,
  p_duracao_servico_param integer
)
returns table(horario_disponivel text)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_dow int := extract(dow from p_data);          -- 0=domingo ... 6=sábado
  v_cfg record;
  v_slot time;
  v_slot_fim time;
  v_passo interval := make_interval(mins => greatest(coalesce(p_duracao_servico_param, 30), 5));
  v_inicio_ts timestamptz;
  v_fim_ts timestamptz;
begin
  for v_cfg in
    select hora_inicio, hora_fim, inicio_almoco, fim_almoco
    from configuracoes_horarios
    where barbeiro_id = p_barbeiro_id and dia_semana = v_dow and ativo = true
  loop
    v_slot := v_cfg.hora_inicio;
    while v_slot + v_passo <= v_cfg.hora_fim loop
      v_slot_fim := v_slot + v_passo;
      v_inicio_ts := (p_data + v_slot)::timestamptz;
      v_fim_ts    := (p_data + v_slot_fim)::timestamptz;

      -- pula almoço
      if v_cfg.inicio_almoco is not null and v_cfg.fim_almoco is not null
         and v_slot < v_cfg.fim_almoco and v_slot_fim > v_cfg.inicio_almoco then
        v_slot := v_cfg.fim_almoco;
        continue;
      end if;

      -- pula horários no passado
      if v_inicio_ts <= now() then
        v_slot := v_slot + v_passo;
        continue;
      end if;

      -- conflito com agendamentos existentes
      if exists (
        select 1 from agendamentos a
        join servicos s on s.id = a.servico_id
        where a.barbeiro_id = p_barbeiro_id
          and a.status in ('pendente','confirmado')
          and (a.data_agendamento, a.data_agendamento + make_interval(mins => coalesce(s.duracao_minutos, 30)))
              overlaps (v_inicio_ts, v_fim_ts)
      ) then
        v_slot := v_slot + v_passo;
        continue;
      end if;

      -- conflito com bloqueios
      if exists (
        select 1 from horarios_bloqueados b
        where b.barbeiro_id = p_barbeiro_id
          and (b.inicio_bloqueio, b.fim_bloqueio) overlaps (v_inicio_ts, v_fim_ts)
      ) then
        v_slot := v_slot + v_passo;
        continue;
      end if;

      horario_disponivel := to_char(v_slot, 'HH24:MI');
      return next;
      v_slot := v_slot + v_passo;
    end loop;
  end loop;
end;
$$;

-- Permite que clientes logados chamem a RPC
grant execute on function public.get_horarios_disponiveis(uuid, date, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 6b) RPCs do Dashboard/Relatórios (dono vê a barbearia dele; barbeiro vê o dele)
--     p_barbeiro_id = id do USUÁRIO logado (perfis.id). A função resolve o escopo:
--     todos os barbeiros da barbearia (se dono) OU o próprio vínculo (se barbeiro).
-- ----------------------------------------------------------------------------
create or replace function public.get_dashboard_stats(
  p_barbeiro_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
returns table(
  total_faturamento numeric,
  total_agendamentos bigint,
  ticket_medio numeric,
  servico_mais_popular jsonb
)
language sql security definer stable set search_path = public as $$
  with meus_barbeiros as (
    select b.id from barbeiros b where b.perfil_id = p_barbeiro_id
    union
    select b.id from barbeiros b
      join barbearias ba on ba.id = b.barbearia_id
      where ba.admin_id = p_barbeiro_id
  ),
  ags as (
    select s.nome, s.preco
    from agendamentos a
    join servicos s on s.id = a.servico_id
    where a.barbeiro_id in (select id from meus_barbeiros)
      and a.status = 'concluido'
      and a.data_agendamento between p_start_date and p_end_date
  )
  select
    coalesce(sum(preco), 0)::numeric,
    count(*)::bigint,
    coalesce(avg(preco), 0)::numeric,
    (select to_jsonb(t) from (
       select nome from ags group by nome order by count(*) desc limit 1
     ) t)
  from ags;
$$;

create or replace function public.get_servicos_distribution(
  p_barbeiro_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
returns table(servico_nome text, quantidade bigint)
language sql security definer stable set search_path = public as $$
  with meus_barbeiros as (
    select b.id from barbeiros b where b.perfil_id = p_barbeiro_id
    union
    select b.id from barbeiros b
      join barbearias ba on ba.id = b.barbearia_id
      where ba.admin_id = p_barbeiro_id
  )
  select s.nome, count(*)::bigint
  from agendamentos a
  join servicos s on s.id = a.servico_id
  where a.barbeiro_id in (select id from meus_barbeiros)
    and a.status = 'concluido'
    and a.data_agendamento between p_start_date and p_end_date
  group by s.nome
  order by 2 desc;
$$;

grant execute on function public.get_dashboard_stats(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_servicos_distribution(uuid, timestamptz, timestamptz) to authenticated;

-- ----------------------------------------------------------------------------
-- 7) updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_barbearias_updated_at on barbearias;
create trigger update_barbearias_updated_at before update on barbearias
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_servicos_updated_at on servicos;
create trigger update_servicos_updated_at before update on servicos
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_servicos_barbeiro_updated_at on servicos_barbeiro;
create trigger update_servicos_barbeiro_updated_at before update on servicos_barbeiro
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_perfis_updated_at on perfis;
create trigger update_perfis_updated_at before update on perfis
  for each row execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 8) Índices de performance
-- ----------------------------------------------------------------------------
create index if not exists idx_perfis_papel              on perfis(papel);
create index if not exists idx_barbearias_admin          on barbearias(admin_id);
create index if not exists idx_barbearias_ativo          on barbearias(ativo);
create index if not exists idx_barbeiros_barbearia       on barbeiros(barbearia_id);
create index if not exists idx_barbeiros_perfil          on barbeiros(perfil_id);
create index if not exists idx_servicos_barbearia        on servicos(barbearia_id);
create index if not exists idx_servicos_barbeiro_barb    on servicos_barbeiro(barbeiro_id);
create index if not exists idx_agendamentos_barbeiro     on agendamentos(barbeiro_id);
create index if not exists idx_agendamentos_cliente      on agendamentos(cliente_id);
create index if not exists idx_agendamentos_data         on agendamentos(data_agendamento);
create index if not exists idx_cfg_horarios_barbeiro     on configuracoes_horarios(barbeiro_id);

-- ----------------------------------------------------------------------------
-- 9) TORNE-SE ADMIN MASTER
--    >>> TROQUE o e-mail abaixo pelo SEU e-mail de login no app. <<<
--    Se sua conta ainda não existe, faça o cadastro primeiro e rode esta
--    linha de novo (não dá erro: só afeta 0 linhas se o e-mail não existir).
-- ----------------------------------------------------------------------------
update perfis set papel = 'admin_master'
where email = 'lucassilvadossantos2005@gmail.com';

-- ----------------------------------------------------------------------------
-- 10) SEED DE TESTE (OPCIONAL) — cria um barbeiro com horário 09:00-18:00
--     (seg a sáb, almoço 12:00-13:00) na primeira barbearia, para você já
--     conseguir testar o agendamento como cliente.
--     >>> Para ATIVAR: apague a linha "/*" abaixo e a linha "*/" no final,
--         e troque o e-mail pelo do usuário que será o barbeiro de teste. <<<
-- ----------------------------------------------------------------------------
/*
do $$
declare v_barbearia uuid; v_perfil uuid; v_barbeiro uuid; d int;
begin
  select id into v_barbearia from barbearias order by created_at limit 1;
  select id into v_perfil from perfis where email = 'cliente@teste.com'; -- TROQUE o e-mail
  if v_perfil is null or v_barbearia is null then
    raise notice 'Barbearia ou usuário não encontrado'; return;
  end if;

  update perfis set papel = 'barbeiro' where id = v_perfil;

  select id into v_barbeiro from barbeiros
    where perfil_id = v_perfil and barbearia_id = v_barbearia limit 1;
  if v_barbeiro is null then
    insert into barbeiros (id, perfil_id, barbearia_id)
    values (gen_random_uuid(), v_perfil, v_barbearia) returning id into v_barbeiro;
  end if;

  delete from configuracoes_horarios where barbeiro_id = v_barbeiro;
  for d in 1..6 loop
    insert into configuracoes_horarios
      (id, barbeiro_id, dia_semana, hora_inicio, hora_fim, inicio_almoco, fim_almoco, ativo)
    values
      (gen_random_uuid(), v_barbeiro, d, '09:00', '18:00', '12:00', '13:00', true);
  end loop;
  raise notice 'Seed OK: barbeiro % na barbearia %', v_barbeiro, v_barbearia;
end$$;
*/

-- ============================================================================
-- FIM. Tudo pronto. Se algum comando der erro, copie a mensagem e me mande.
-- ============================================================================
