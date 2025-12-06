
INSERT INTO perfis (id, email, nome_completo, telefone, papel)
VALUES 
  ('USER_ID_1', 'admin1@barbearia.com', 'Carlos Silva', '(11) 98765-4321', 'admin'),
  ('USER_ID_2', 'admin2@barbearia.com', 'Roberto Santos', '(11) 97654-3210', 'admin');

INSERT INTO barbearias (nome_barbearia, endereco, latitude, longitude, admin_user_id, ativo)
VALUES 
  (
    'Barbearia Estilo Masculino',
    'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
    -23.5629,
    -46.6544,
    'USER_ID_1',
    true
  ),
  (
    'The Barber Shop',
    'R. Augusta, 2516 - Jardim América, São Paulo - SP',
    -23.5581,
    -46.6641,
    'USER_ID_2',
    true
  );

INSERT INTO servicos (barbearia_id, nome, descricao, preco, duracao_minutos, ativo)
VALUES 
  ('BARBEARIA_ID_1', 'Corte Tradicional', 'Corte clássico masculino', 45.00, 30, true),
  ('BARBEARIA_ID_1', 'Barba Completa', 'Aparar e modelar a barba', 35.00, 25, true),
  ('BARBEARIA_ID_1', 'Corte + Barba', 'Combo completo de corte e barba', 70.00, 50, true);

INSERT INTO servicos (barbearia_id, nome, descricao, preco, duracao_minutos, ativo)
VALUES 
  ('BARBEARIA_ID_2', 'Corte Premium', 'Corte moderno com finalização', 60.00, 40, true),
  ('BARBEARIA_ID_2', 'Barba e Bigode', 'Barba completa com design', 40.00, 30, true),
  ('BARBEARIA_ID_2', 'Pacote VIP', 'Corte + Barba + Hidratação', 90.00, 60, true);

SELECT 
  b.nome_barbearia,
  b.endereco,
  b.latitude,
  b.longitude,
  p.nome_completo as admin_nome
FROM barbearias b
JOIN perfis p ON b.admin_user_id = p.id;

SELECT 
  s.nome,
  s.preco,
  s.duracao_minutos,
  b.nome_barbearia
FROM servicos s
JOIN barbearias b ON s.barbearia_id = b.id
ORDER BY b.nome_barbearia, s.nome;
