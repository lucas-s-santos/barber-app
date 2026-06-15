# ARCHITECTURE — CalmBarber

> Documento de arquitetura **fiel ao código atual** (não é greenfield). Serve como
> contexto para o Claude Code: leia isto antes de mudanças estruturais para **não
> reinventar** o que já existe e está testado. Nomes em português = nomes reais no banco.

## 1. Visão geral

App **SaaS multi-tenant de barbearias** no modelo **marketplace**: o cliente descobre e
agenda em **qualquer** barbearia; cada dono gerencia só a sua; um super-admin cuida da
plataforma inteira.

**Stack:** Expo SDK 54 · React Native 0.81 · React 19 · expo-router 6 (file-based) ·
Supabase (Postgres + Auth + RLS) · TypeScript (mistura `.tsx`/`.js`).
**App único** com navegação por papel (não são dois apps).

## 2. Modelo de negócio: marketplace (atual) vs ilha (em aberto)

| | Marketplace (ATUAL) | Ilha |
|---|---|---|
| Relação com o cliente | da plataforma | de cada barbearia |
| Cliente enxerga | todas as barbearias ativas | só a barbearia dele |
| Monetização natural | comissão por agendamento | assinatura mensal por barbearia |
| Isolamento | por **propriedade** (`admin_id`/vínculo) | + `barbearia_id` no escopo de leitura do cliente |

O isolamento atual é por propriedade, **não** por um `barbearia_id` no perfil do cliente.
Por isso migrar pra "ilha" depois é **aditivo** (escopar leitura do cliente), não reescrita.
**Decisão em aberto** = qual o cliente pagante. Enquanto não decidir, fica marketplace.

## 3. Os 3 padrões de acesso (a essência do marketplace)

1. **Descoberta (leitura aberta):** `barbearias`/`servicos`/`barbeiros` ativos têm `SELECT`
   liberado para qualquer `authenticated`. Sem tenant scope na leitura.
2. **Gestão (escrita tenant-scoped):** dono/barbeiro só cria/edita o que é da barbearia dele
   (via `admin_id` / vínculo `barbeiros`).
3. **Agendamentos (per-user dos dois lados):** na mesma tabela, o cliente vê os agendamentos
   dele (em qualquer barbearia) e o dono/barbeiro vê os da barbearia dele.

> `anon` (sem login) **não acessa tabela nenhuma** — todas as políticas são `to authenticated`.

## 4. Modelo de dados (`public`)

Enums: `papel_usuario` = {`cliente`,`barbeiro`,`dono_barbearia`,`admin_master`} ·
`status_agendamento` = {`pendente`,`confirmado`,`concluido`,`cancelado`}.

- **perfis** — 1:1 com `auth.users`. `id`, `email`, `nome_completo`, `telefone`,
  `data_nascimento`, `foto_url`, `papel`, `ativo`. Criado por **gatilho** (ver §6), nunca
  por insert direto do app.
- **barbearias** (tenant raiz) — `id`, `nome_barbearia`, `endereco`, `logo_url`,
  `admin_id`→perfis (o dono), `latitude`/`longitude`, `horario_abertura/fechamento`,
  `dias_funcionamento[]`, `fotos_barbearia[]`, `ativo`.
- **barbeiros** (vínculo) — `id`, `perfil_id`→perfis, `barbearia_id`→barbearias,
  `adicionado_por`. ⚠️ Tem **2 FKs pra perfis** (`perfil_id` e `adicionado_por`): ao embutir
  perfis no PostgREST, **desambiguar** com `perfis!perfil_id(...)`.
- **servicos** (catálogo da barbearia, usado no agendamento) — `barbearia_id`, `nome`,
  `preco`, `duracao_minutos`, `ativo`.
- **servicos_barbeiro** — lista pessoal do barbeiro (tela "Meus Serviços"), separada do
  catálogo. Secundária.
- **agendamentos** (coração) — `cliente_id`→perfis, `barbeiro_id`→**barbeiros.id** (não
  perfis!), `servico_id`→servicos, `data_agendamento timestamptz`, `status`.
- **configuracoes_horarios** — `barbeiro_id`→**barbeiros.id**, `dia_semana` (0=dom…6=sáb),
  `hora_inicio/fim`, `inicio_almoco/fim_almoco`, `ativo`. UNIQUE(`barbeiro_id`,`dia_semana`).
- **horarios_bloqueados** — folgas/bloqueios por barbeiro.
- **avaliacoes** — nota/comentário por agendamento.
- **convites_barbeiros** — legado; o fluxo atual adiciona barbeiro direto (ver §6).

> **Regra de ouro:** `agendamentos.barbeiro_id` e `configuracoes_horarios.barbeiro_id`
> referenciam **`barbeiros.id`** (o vínculo), nunca `perfis.id`.

## 5. Segurança / RLS

Funções **helper `SECURITY DEFINER`** (ignoram RLS → **sem recursão** ao consultar `perfis`
dentro de política de `perfis`): `eh_admin_master()`, `eh_dono_barbearia(barbearia_id)`,
`eh_dono_do_barbeiro(barbeiro_id)`, `eh_o_barbeiro(barbeiro_id)`. Toda política é construída
em cima dessas funções. **Nunca** faça `select ... from perfis` cru dentro de uma policy de
`perfis` — use os helpers.

## 6. Gatilhos e RPCs (lógica no banco)

- **`handle_new_user()`** (on `auth.users` insert) — cria o `perfis` a partir de
  `raw_user_meta_data` (`options.data` do `signUp`). Papel só pode ser `cliente` ou
  `dono_barbearia` no auto-cadastro; se dono + `nome_barbearia`, já cria a barbearia.
  → **As telas de cadastro NÃO inserem em `perfis`/`barbearias`**; passam tudo no `signUp`.
- **`guard_papel()`** (before update em `perfis`) — impede um usuário comum de trocar o
  próprio `papel`. Liberado para `admin_master`, para contexto sem login (SQL Editor/service
  role) e para a RPC abaixo (via flag `app.promovendo_barbeiro`).
- **`vincular_barbeiro_por_email(email, barbearia_id)`** — dono adiciona barbeiro:
  promove `cliente`→`barbeiro` (não rebaixa dono/admin) e cria o vínculo `barbeiros`.
- **`get_horarios_disponiveis(barbeiros.id, data, duracao)`** — calcula horários livres a
  partir de `configuracoes_horarios` menos `agendamentos` e `horarios_bloqueados`.

## 7. Papéis e navegação (`app/(tabs)/_layout.tsx`)

Após login, `_layout.tsx` (raiz) faz o gate de sessão e redireciona; o `(tabs)/_layout.tsx`
lê `perfis.papel` e monta o conjunto de abas:

- **cliente:** Mapa (`barbearias-mapa`) · Barbearias (`barbearias-lista`) · Agendamentos · Perfil
- **barbeiro:** Meus Serviços (`meus-servicos`, com botão "Configurar meus horários") · Dashboard · Perfil
- **dono_barbearia:** Painel (`painel-barbearia`) · Barbearia · Barbeiros · Relatórios · Perfil
- **admin_master:** Admin Dashboard · Usuários · Estatísticas · Perfil

## 8. Fluxos principais

- **Cadastro:** `signUp({ options.data })` → gatilho cria perfil (+ barbearia se dono).
- **Agendar (cliente):** `barbearias-lista`/`mapa` → `barbearia-detalhes?id=` →
  `agenda?barbearia_id=` → escolhe serviço/barbeiro/data → `get_horarios_disponiveis` →
  insere em `agendamentos` (`barbeiro_id = barbeiros.id`).
- **Gerir (dono):** painel → Serviços (escopado na barbearia, manda `barbearia_id`) ·
  Barbeiros (adiciona por e-mail via RPC) · Horários (o dono pode "atender como barbeiro").

## 9. Estrutura de pastas (atual — por tipo, expo-router)

```
app/            # rotas (file-based). (auth)/ e (tabs)/ + telas soltas
components/      # BarbeariasMapView(.native/.js), themed-*, header, ui/, CustomAlert
contexts/        # ThemeContext, AlertContext, BarbershopContext
constants/theme.ts  # Colors(light/dark), Spacing, Typography  ← base do design system
supabaseClient.ts   # client Supabase + helpers de auth/queries
supabase-setup-completo.sql  # FONTE ÚNICA do schema + RLS + funções (idempotente)
```

## 10. Convenções

- Nomes de banco em **português** (`barbearias`, `perfis`…). **Não renomear pra inglês.**
- Mapa nativo isolado em `components/BarbeariasMapView.native.js`; web usa o `.js` (fallback).
  Nunca importe `react-native-maps` direto numa rota (quebra o bundle web).
- Máscaras de input feitas **na mão** (não usar `react-native-mask-text` — trava com RN 0.81/React 19).

## 11. Roadmap (o que falta — nesta ordem)

1. **Fechar teste ponta a ponta** (dono cria horário → cliente agenda). ← antes de polir
2. **Design system**: biblioteca de componentes (Button/Input/Card/Sheet) sobre `theme.ts`.
3. **Reorg feature-based** (opcional): `features/{auth,booking,appointments,services,...}`.
4. **Monetização**: tabelas `planos`/`assinaturas` (se ilha) ou comissão (se marketplace).
5. **Notificações** de agendamento (push) e estados de loading/erro consistentes.
6. **Upload de imagem** (logo/fotos hoje são URLs).
7. **Play Store**: `package` id e nome em `app.json`, chave Google Maps, política de
   privacidade publicada, exclusão de conta, EAS Build; reativar confirmação de e-mail em prod.

## 12. Rodar em dev (Android)

SDK em `%LOCALAPPDATA%\Android\Sdk` (sem `ANDROID_HOME` no PATH). Emulador `Pixel_9`.
`npx expo start --android`; se travar em "Bundling 40%", rode
`adb reverse tcp:8081 tcp:8081` e reabra via `exp://127.0.0.1:8081`.
