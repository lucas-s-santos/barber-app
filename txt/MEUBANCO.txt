Tabela: perfis
id (uuid) - Chave primária, vinculada a auth.users.id.
email (text)
nome_completo (text)
telefone (text)
foto_url (text) - Observação: Parece que você tem foto_url e foto_base64. Pode ser bom escolher apenas um método no futuro.
papel (papel_usuario) - Um tipo customizado, provavelmente com valores como 'cliente' e 'barbeiro'.
foto_base64 (text)
updated_at (timestamptz)
Tabela: barbearias
id (uuid) - Chave primária.
nome_barbearia (text)
endereco (text)
logo_url (text)
admin_id (uuid) - Chave estrangeira, vinculada a perfis.id (do dono/admin).
Tabela: barbeiros
id (uuid) - Chave primária.
perfil_id (uuid) - Chave estrangeira, vinculada a perfis.id.
barbearia_id (uuid) - Chave estrangeira, vinculada a barbearias.id.
Tabela: servicos
id (uuid) - Chave primária.
barbearia_id (uuid) - Chave estrangeira, vinculada a barbearias.id.
nome (text)
descricao (text)
preco (numeric)
duracao_minutos (int4)
ativo (bool)
Tabela: agendamentos
id (uuid) - Chave primária.
cliente_id (uuid) - Chave estrangeira, vinculada a perfis.id.
barbeiro_id (uuid) - Chave estrangeira, vinculada a barbeiros.id.
servico_id (uuid) - Chave estrangeira, vinculada a servicos.id.
data_agendamento (timestamptz)
status (status_agendamento) - Um tipo customizado, provavelmente com valores como 'pendente', 'concluido', 'cancelado'.
Tabela: avaliacoes
id (uuid) - Chave primária.
agendamento_id (uuid) - Chave estrangeira, vinculada a agendamentos.id.
nota (int4)
comentario (text)
Tabela: configuracoes_horarios
id (uuid) - Chave primária.
barbeiro_id (uuid) - Chave estrangeira, vinculada a barbeiros.id.
dia_semana (int4) - Provavelmente 0 para Domingo, 1 para Segunda, etc.
hora_inicio (time)
hora_fim (time)
inicio_almoco (time)
fim_almoco (time)
ativo (bool)
Tabela: horarios_bloqueados
id (uuid) - Chave primária.
barbeiro_id (uuid) - Chave estrangeira, vinculada a barbeiros.id.
inicio_bloqueio (timestamptz)
fim_bloqueio (timestamptz)
motivo (text)