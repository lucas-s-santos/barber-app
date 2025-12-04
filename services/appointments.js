import { supabase } from '../supabaseClient';

/**
 * Retorna o próximo agendamento pendente (data futura) do usuário.
 * @param {string} userId
 */
export async function getNextAppointment(userId) {
  if (!userId)
    return {
      data: null,
      error: { message: 'Usuário não autenticado', code: 'no-user' },
    };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('agendamentos')
    .select(
      'id, data_agendamento, status, servico:servico_id(id,nome,preco), barbeiro:barbeiro_id(nome_completo)',
    )
    .eq('cliente_id', userId)
    .eq('status', 'pendente')
    .gt('data_agendamento', now)
    .order('data_agendamento', { ascending: true })
    .limit(1);

  return { data: data && data.length ? data[0] : null, error };
}

/**
 * Retorna os próximos agendamentos (pendente ou confirmado) do usuário.
 * @param {string} userId
 * @param {number} limit
 */
export async function getUpcomingAppointments(userId, limit = 5) {
  if (!userId)
    return {
      data: [],
      error: { message: 'Usuário não autenticado', code: 'no-user' },
    };
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('agendamentos')
    .select(
      'id, data_agendamento, status, servico:servico_id(id,nome,preco), barbeiro:barbeiro_id(nome_completo)',
    )
    .eq('cliente_id', userId)
    .in('status', ['pendente', 'confirmado'])
    .gt('data_agendamento', now)
    .order('data_agendamento', { ascending: true })
    .limit(limit);

  return { data: data || [], error };
}
