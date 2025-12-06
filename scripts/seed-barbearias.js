import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbqckcmxkfcwerjyctxb.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicWNrY214a2Zjd2VyanljdHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzY2MzksImV4cCI6MjA3NzI1MjYzOX0.llIGemmIIwszLusBANfxOtIAgic2Ywuq-hO9MVNbck0';

if (!supabaseUrl || supabaseUrl === 'COLE_SUA_URL_DO_SUPABASE_AQUI') {
  console.error('❌ Configure as variáveis do Supabase no arquivo!');
  console.log('📝 Edite o arquivo scripts/seed-barbearias.js e substitua:');
  console.log('   - supabaseUrl: cole sua URL do projeto Supabase');
  console.log('   - supabaseAnonKey: cole sua chave anon key');
  console.log('\n🔗 Encontre essas informações em:');
  console.log('   https://app.supabase.com > seu projeto > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedBarbearias() {
  console.log('🌱 Iniciando seed de barbearias...');

  const barbearias = [
    {
      nome_barbearia: 'Vintage Club Barbearia',
      endereco: 'R. Carmen Carnevale, 5 - Jardim Nova America, Alfenas - MG, 37137-034',
      latitude: -21.41621,
      longitude: -45.95673,
      ativo: true,
    },
    {
      nome_barbearia: 'Barbeiro Richard Alfenas MG',
      endereco: 'R. Diva Leite Viêira, 90 - Vila Betania II, Alfenas - MG, 37137-110',
      latitude: -21.41382,
      longitude: -45.95139,
      ativo: true,
    },
  ];

  try {
    const { data: user1 } = await supabase.auth.signUp({
      email: 'admin1@barbearia.com',
      password: 'Admin123!',
    });

    if (user1.user) {
      await supabase.from('perfis').insert({
        id: user1.user.id,
        email: 'admin1@barbearia.com',
        nome_completo: 'Carlos Silva',
        telefone: '(11) 98765-4321',
        papel: 'admin',
      });

      const { data: barbearia1, error: error1 } = await supabase
        .from('barbearias')
        .insert({
          ...barbearias[0],
          admin_id: user1.user.id,
        })
        .select()
        .single();

      if (error1) {
        console.error('Erro ao criar barbearia 1:', error1);
      } else {
        console.log('✅ Barbearia 1 criada:', barbearia1.nome_barbearia);

        await supabase.from('servicos').insert([
          {
            barbearia_id: barbearia1.id,
            nome: 'Corte Tradicional',
            descricao: 'Corte clássico masculino',
            preco: 45.0,
            duracao_minutos: 30,
            ativo: true,
          },
          {
            barbearia_id: barbearia1.id,
            nome: 'Barba Completa',
            descricao: 'Aparar e modelar a barba',
            preco: 35.0,
            duracao_minutos: 25,
            ativo: true,
          },
          {
            barbearia_id: barbearia1.id,
            nome: 'Corte + Barba',
            descricao: 'Combo completo de corte e barba',
            preco: 70.0,
            duracao_minutos: 50,
            ativo: true,
          },
        ]);
        console.log('✅ Serviços da Barbearia 1 criados');
      }
    }

    const { data: user2 } = await supabase.auth.signUp({
      email: 'admin2@barbearia.com',
      password: 'Admin123!',
    });

    if (user2.user) {
      await supabase.from('perfis').insert({
        id: user2.user.id,
        email: 'admin2@barbearia.com',
        nome_completo: 'Roberto Santos',
        telefone: '(11) 97654-3210',
        papel: 'admin',
      });

      const { data: barbearia2, error: error2 } = await supabase
        .from('barbearias')
        .insert({
          ...barbearias[1],
          admin_id: user2.user.id,
        })
        .select()
        .single();

      if (error2) {
        console.error('Erro ao criar barbearia 2:', error2);
      } else {
        console.log('✅ Barbearia 2 criada:', barbearia2.nome_barbearia);

        await supabase.from('servicos').insert([
          {
            barbearia_id: barbearia2.id,
            nome: 'Corte Premium',
            descricao: 'Corte moderno com finalização',
            preco: 60.0,
            duracao_minutos: 40,
            ativo: true,
          },
          {
            barbearia_id: barbearia2.id,
            nome: 'Barba e Bigode',
            descricao: 'Barba completa com design',
            preco: 40.0,
            duracao_minutos: 30,
            ativo: true,
          },
          {
            barbearia_id: barbearia2.id,
            nome: 'Pacote VIP',
            descricao: 'Corte + Barba + Hidratação',
            preco: 90.0,
            duracao_minutos: 60,
            ativo: true,
          },
        ]);
        console.log('✅ Serviços da Barbearia 2 criados');
      }
    }

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('Barbearia 1: admin1@barbearia.com / Admin123!');
    console.log('Barbearia 2: admin2@barbearia.com / Admin123!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
  }
}

seedBarbearias();
