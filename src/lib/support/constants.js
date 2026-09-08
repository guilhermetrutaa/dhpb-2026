export const STATUS_CHAMADO = {
  NOVO: 'novo',
  AGUARDANDO_ATENDENTE: 'aguardando_atendente',
  EM_ATENDIMENTO: 'em_atendimento',
  AGUARDANDO_USUARIO: 'aguardando_usuario',
  RESOLVIDO: 'resolvido',
  ARQUIVADO: 'arquivado',
}

export const STATUS_LABELS = {
  [STATUS_CHAMADO.NOVO]: 'Novo',
  [STATUS_CHAMADO.AGUARDANDO_ATENDENTE]: 'Aguardando atendente',
  [STATUS_CHAMADO.EM_ATENDIMENTO]: 'Em atendimento',
  [STATUS_CHAMADO.AGUARDANDO_USUARIO]: 'Aguardando usuário',
  [STATUS_CHAMADO.RESOLVIDO]: 'Resolvido',
  [STATUS_CHAMADO.ARQUIVADO]: 'Arquivado',
}

export const STATUS_COLORS = {
  [STATUS_CHAMADO.NOVO]: 'bg-blue-100 text-blue-700',
  [STATUS_CHAMADO.AGUARDANDO_ATENDENTE]: 'bg-amber-100 text-amber-700',
  [STATUS_CHAMADO.EM_ATENDIMENTO]: 'bg-green-100 text-green-700',
  [STATUS_CHAMADO.AGUARDANDO_USUARIO]: 'bg-purple-100 text-purple-700',
  [STATUS_CHAMADO.RESOLVIDO]: 'bg-neutral-200 text-neutral-600',
  [STATUS_CHAMADO.ARQUIVADO]: 'bg-neutral-100 text-neutral-400',
}

export const CATEGORIAS = [
  { id: 'inscricao', label: 'Inscrição' },
  { id: 'regulamento', label: 'Regulamento' },
  { id: 'equipes', label: 'Equipes' },
  { id: 'fases', label: 'Fases e atividades' },
  { id: 'acesso', label: 'Acesso e recuperação' },
  { id: 'certificados', label: 'Certificados' },
  { id: 'tecnico', label: 'Problema técnico' },
  { id: 'outros', label: 'Outros' },
]

export const PRIORIDADES = [
  { id: 'baixa', label: 'Baixa' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Alta' },
]

export const PRIORIDADE_COLORS = {
  baixa: 'bg-neutral-100 text-neutral-500',
  media: 'bg-amber-100 text-amber-700',
  alta: 'bg-red-100 text-red-700',
}

export const AUTORES = {
  USUARIO: 'usuario',
  IA: 'ia',
  ADMIN: 'admin',
}

export const MENSAGEM_ERRO_IA =
  'Não consegui processar sua mensagem agora. Tente novamente em instantes ou peça para falar com um atendente humano.'

export const MENSAGEM_BEM_VINDO =
  'Olá! Seja bem-vindo(a) ao atendimento do DHPB. Antes de começarmos, me diga seu nome completo e seu e-mail, por favor.'

export const MENSAGEM_PEDIR_CONTATO =
  'Antes de começarmos o atendimento, preciso do seu nome completo e do seu e-mail. Pode enviar os dois na mesma mensagem?'


export const SUGESTOES_INICIAIS = [
  'Como faço minha inscrição?',
  'Como montar a equipe?',
  'Quando são as fases?',
  'Minha conta do ano passado não entra',
]

export const HORARIO_ATENDIMENTO = {
  inicio: 9,
  fim: 18,
}

export const estaNoHorarioAtendimento = (data = new Date()) => {
  try {
    // Horário de Brasília (America/Sao_Paulo)
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    const partes = formatter.formatToParts(data)
    const hora = parseInt(partes.find((p) => p.type === 'hour')?.value || '0', 10)
    return hora >= HORARIO_ATENDIMENTO.inicio && hora < HORARIO_ATENDIMENTO.fim
  } catch {
    const hora = data.getHours()
    return hora >= HORARIO_ATENDIMENTO.inicio && hora < HORARIO_ATENDIMENTO.fim
  }
}

export const AVALIACOES_CSAT = [
  { nota: 0, label: 'Muito ruim', emoji: '😡', precisaJustificativa: true },
  { nota: 1, label: 'Ruim', emoji: '🙁', precisaJustificativa: true },
  { nota: 2, label: 'Poderia ser melhor', emoji: '😐', precisaJustificativa: true },
  { nota: 3, label: 'Bom', emoji: '🙂', precisaJustificativa: false },
  { nota: 4, label: 'Muito bom', emoji: '😊', precisaJustificativa: false },
  { nota: 5, label: 'Excelente', emoji: '🤩', precisaJustificativa: false },
]

export const formatarDataHora = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const formatarTempo = (ms) => {
  if (!ms || ms < 0) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}min`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

