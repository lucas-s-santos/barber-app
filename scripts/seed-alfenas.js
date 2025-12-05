// Script para popular o banco com barbearias de Alfenas-MG
const { createClient } = require('@supabase/supabase-js');

// Usar as mesmas credenciais do seed-barbearias.js
const supabaseUrl = 'https://vbqckcmxkfcwerjyctxb.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicWNrY214a2Zjd2VyanljdHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzY2MzksImV4cCI6MjA3NzI1MjYzOX0.llIGemmIIwszLusBANfxOtIAgic2Ywuq-hO9MVNbck0';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Coordenadas de referência em Alfenas-MG
const alfenasCenter = {
  lat: -21.4289,
  lng: -45.9472,
};

// Função para gerar coordenadas próximas ao centro de Alfenas
function generateNearbyCoords(baseLat, baseLng, index) {
  // Variação de aproximadamente 0.01 graus (cerca de 1km)
  const latVariation = (Math.random() - 0.5) * 0.02;
  const lngVariation = (Math.random() - 0.5) * 0.02;

  return {
    latitude: baseLat + latVariation,
    longitude: baseLng + lngVariation,
  };
}

const barbeariasSeed = [
  {
    nome_barbearia: 'Barbearia Estilo Alfenas',
    endereco: 'Rua Gabriel Monteiro da Silva, 700 - Centro, Alfenas - MG',
    telefone: '(35) 3291-1234',
    descricao: 'Barbearia tradicional no coração de Alfenas com mais de 20 anos de tradição.',
    horario_funcionamento: 'Seg-Sex: 9h-19h, Sáb: 9h-17h',
    ...generateNearbyCoords(alfenasCenter.lat, alfenasCenter.lng, 0),
  },
  {
    nome_barbearia: 'Barber Shop Premium Alfenas',
    endereco: 'Av. Prefeito Sílvio Pinto Ferreira, 450 - Jardim Aeroporto, Alfenas - MG',
    telefone: '(35) 3291-2345',
    descricao: 'Ambiente moderno e descontraído com os melhores profissionais da região.',
    horario_funcionamento: 'Seg-Sex: 8h-20h, Sáb: 8h-18h',
    ...generateNearbyCoords(alfenasCenter.lat, alfenasCenter.lng, 1),
  },
  {
    nome_barbearia: 'Barbearia do Zé - Alfenas',
    endereco: 'Rua Minas Gerais, 320 - Centro, Alfenas - MG',
    telefone: '(35) 3291-3456',
    descricao: 'Atendimento personalizado e cortes clássicos que nunca saem de moda.',
    horario_funcionamento: 'Ter-Sáb: 9h-18h',
    ...generateNearbyCoords(alfenasCenter.lat, alfenasCenter.lng, 2),
  },
  {
    nome_barbearia: 'The Kings Barber Alfenas',
    endereco: 'Rua Capitão Vítor de Melo, 180 - Centro, Alfenas - MG',
    telefone: '(35) 3291-4567',
    descricao: 'Especializada em barbas e cortes modernos. Experiência premium garantida.',
    horario_funcionamento: 'Seg-Sex: 10h-20h, Sáb: 9h-16h',
    ...generateNearbyCoords(alfenasCenter.lat, alfenasCenter.lng, 3),
  },
  {
    nome_barbearia: 'Alfa Barber Studio',
    endereco: 'Praça Getúlio Vargas, 85 - Centro, Alfenas - MG',
    telefone: '(35) 3291-5678',
    descricao: 'Studio de barbearia com agendamento online e produtos exclusivos.',
    horario_funcionamento: 'Seg-Sex: 9h-19h, Sáb: 9h-15h',
    ...generateNearbyCoords(alfenasCenter.lat, alfenasCenter.lng, 4),
  },
];

const servicos = [
  { nome: 'Corte Simples', preco: 35, duracao: 30 },
  { nome: 'Corte + Barba', preco: 55, duracao: 45 },
  { nome: 'Barba', preco: 25, duracao: 20 },
  { nome: 'Corte + Barba + Sobrancelha', preco: 70, duracao: 60 },
  { nome: 'Desenho Barba', preco: 35, duracao: 30 },
  { nome: 'Relaxamento Capilar', preco: 80, duracao: 90 },
  { nome: 'Hidratação', preco: 45, duracao: 40 },
];

const barbeiros = [
  'Carlos Silva',
  'Fernando Santos',
  'Roberto Oliveira',
  'André Costa',
  'Lucas Ferreira',
];

async function seedAlfenas() {
  try {
    console.log('🚀 Iniciando seed de barbearias em Alfenas-MG...\n');

    // Criar conta de admin para as barbearias de Alfenas
    console.log('👤 Criando conta de admin para Alfenas...');
    const adminEmail = 'admin.alfenas@barbershop.com';
    const adminPassword = 'Admin@123456';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Erro ao criar admin:', signUpError.message);
      return;
    }

    const adminUserId = signUpData.user?.id;

    if (!adminUserId) {
      // Tentar fazer login se o usuário já existir
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (signInError) {
        console.error('❌ Erro ao fazer login:', signInError.message);
        return;
      }

      console.log('✅ Login realizado com sucesso!');
      const adminUserId = signInData.user.id;

      // Criar perfil se não existir
      const { error: profileError } = await supabase.from('perfis').upsert({
        id: adminUserId,
        nome_completo: 'Admin Alfenas',
        email: adminEmail,
        papel: 'barbeiro',
      });

      if (profileError) {
        console.log('⚠️  Perfil já existe ou erro:', profileError.message);
      }
    } else {
      console.log('✅ Admin criado com sucesso!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminPassword}`);
      console.log(`   ID: ${adminUserId}\n`);

      // Criar perfil do admin
      const { error: profileError } = await supabase.from('perfis').insert({
        id: adminUserId,
        nome_completo: 'Admin Alfenas',
        email: adminEmail,
        papel: 'barbeiro',
      });

      if (profileError) {
        console.log('⚠️  Erro ao criar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil criado!\n');
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const finalAdminId = user?.id;

    if (!finalAdminId) {
      console.error('❌ Não foi possível obter o ID do admin.');
      return;
    }

    console.log(`✅ Usando admin ID: ${finalAdminId}\n`);

    for (const [index, barbearia] of barbeariasSeed.entries()) {
      console.log(`📍 Cadastrando: ${barbearia.nome_barbearia}...`);

      // Inserir barbearia
      const { data: barbeariaData, error: barbeariaError } = await supabase
        .from('barbearias')
        .insert({
          nome_barbearia: barbearia.nome_barbearia,
          endereco: barbearia.endereco,
          telefone: barbearia.telefone,
          latitude: barbearia.latitude,
          longitude: barbearia.longitude,
          ativo: true,
        })
        .select()
        .single();

      if (barbeariaError) {
        console.error(`   ❌ Erro ao cadastrar barbearia: ${barbeariaError.message}`);
        continue;
      }

      console.log(`   ✅ Barbearia cadastrada! ID: ${barbeariaData.id}`);
      console.log(
        `   📍 Localização: ${barbearia.latitude.toFixed(6)}, ${barbearia.longitude.toFixed(6)}`,
      );

      // Inserir 3-5 serviços aleatórios para cada barbearia
      const numServicos = 3 + Math.floor(Math.random() * 3);
      const servicosSelecionados = [...servicos]
        .sort(() => 0.5 - Math.random())
        .slice(0, numServicos);

      for (const servico of servicosSelecionados) {
        const { error: servicoError } = await supabase.from('servicos').insert({
          barbearia_id: barbeariaData.id,
          nome_servico: servico.nome,
          preco: servico.preco,
          duracao_minutos: servico.duracao,
          ativo: true,
        });

        if (!servicoError) {
          console.log(`   💈 Serviço adicionado: ${servico.nome} - R$ ${servico.preco}`);
        }
      }

      // Inserir 2-3 barbeiros para cada barbearia
      const numBarbeiros = 2 + Math.floor(Math.random() * 2);
      const barbeirosSelecionados = [...barbeiros]
        .sort(() => 0.5 - Math.random())
        .slice(0, numBarbeiros);

      for (const barbeiro of barbeirosSelecionados) {
        const { error: barbeiroError } = await supabase.from('barbeiros').insert({
          barbearia_id: barbeariaData.id,
          nome_barbeiro: barbeiro,
          especialidade: 'Cortes e Barbas',
          ativo: true,
        });

        if (!barbeiroError) {
          console.log(`   👨‍🦲 Barbeiro adicionado: ${barbeiro}`);
        }
      }

      console.log('');
    }

    console.log('✅ Seed de Alfenas-MG concluído com sucesso!');
    console.log(`📊 Total de barbearias cadastradas: ${barbeariasSeed.length}`);
    console.log('🗺️  As barbearias estão distribuídas ao redor do centro de Alfenas-MG\n');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  }
}

seedAlfenas();
