import { getRede } from './eliminacaoFases.js'
import { EQUIPE_EXCLUIDA_RECALC_ID } from './recalcularPontuacao.js'

export function grupoDe(modalidade) {
  const m = modalidade || ''
  return m === 'medio' || m === 'eja_medio' ? 'medio' : 'fundamental'
}

function chaveEscola(eq) {
  const escola = String(eq?.escolaId ?? '').trim()
  return escola || `sem-inep:${eq.id}`
}

function ordenar(equipes) {
  const contagem = new Map()
  for (const eq of equipes) contagem.set(chaveEscola(eq), (contagem.get(chaveEscola(eq)) || 0) + 1)
  return [...equipes].sort((a, b) => {
    const ca = contagem.get(chaveEscola(a))
    const cb = contagem.get(chaveEscola(b))
    if (cb !== ca) return cb - ca
    const ea = chaveEscola(a)
    const eb = chaveEscola(b)
    if (ea !== eb) return ea < eb ? -1 : 1
    return String(a.id) < String(b.id) ? -1 : 1
  })
}

function pesoSala(sala, eq) {
  const escola = chaveEscola(eq)
  const rede = getRede(eq.tipoEscola)
  let mesmaEscola = 0
  let mesmaRede = 0
  for (const item of sala.equipes) {
    if (chaveEscola(item) === escola) mesmaEscola++
    if (getRede(item.tipoEscola) === rede) mesmaRede++
  }
  return [mesmaEscola, mesmaRede, sala.equipes.length, sala.numero]
}

function pior(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}

function alocar(equipes, nSalas, numeroInicial, grupo) {
  if (!nSalas || !equipes.length) return []
  const salas = Array.from({ length: nSalas }, (_, i) => ({ numero: numeroInicial + i, equipes: [] }))
  for (const eq of ordenar(equipes)) {
    let melhor = salas[0]
    for (const sala of salas) {
      if (pior(pesoSala(sala, eq), pesoSala(melhor, eq)) < 0) melhor = sala
    }
    melhor.equipes.push(eq)
  }
  const numeroDe = new Map()
  for (const sala of salas) for (const eq of sala.equipes) numeroDe.set(eq.id, sala.numero)
  return equipes.map((eq) => ({ id: eq.id, numero: numeroDe.get(eq.id), grupo, manual: false }))
}

/** ponytail: guloso, não o ótimo global. Upgrade = troca local de pares. */
export function dividirSalas(equipes, { salasMedio, salasFund } = {}) {
  const x = Number(salasMedio)
  const y = Number(salasFund)
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
    return { erro: 'Informe números inteiros a partir de zero.', alocacao: [] }
  }
  if (x + y > 12) return { erro: 'No máximo 12 salas.', alocacao: [] }
  const lista = (equipes || []).filter((eq) => eq?.id && eq.id !== EQUIPE_EXCLUIDA_RECALC_ID)
  const medio = lista.filter((eq) => grupoDe(eq.modalidade) === 'medio')
  const fund = lista.filter((eq) => grupoDe(eq.modalidade) !== 'medio')
  if (medio.length && x < 1) return { erro: 'Ensino médio precisa de ao menos 1 sala.', alocacao: [] }
  if (fund.length && y < 1) return { erro: 'Ensino fundamental precisa de ao menos 1 sala.', alocacao: [] }
  return {
    erro: null,
    plano: { medio: x, fundamental: y },
    alocacao: [...alocar(medio, x, 1, 'medio'), ...alocar(fund, y, x + 1, 'fundamental')],
  }
}

export function numerosDoGrupo(plano, grupo) {
  const x = Number(plano?.medio) || 0
  const y = Number(plano?.fundamental) || 0
  if (grupo === 'medio') return Array.from({ length: x }, (_, i) => i + 1)
  return Array.from({ length: y }, (_, i) => x + 1 + i)
}

export function agruparPorSala(equipes) {
  const porNumero = new Map()
  for (const eq of equipes || []) {
    const numero = Number(eq?.salaFinal?.numero) || 0
    if (!porNumero.has(numero)) porNumero.set(numero, { numero, grupo: eq?.salaFinal?.grupo || '', equipes: [] })
    porNumero.get(numero).equipes.push(eq)
  }
  return [...porNumero.values()]
    .sort((a, b) => (a.numero || 999) - (b.numero || 999))
    .map((bloco) => ({
      ...bloco,
      equipes: bloco.equipes.slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt')),
    }))
}

export function colisoesSalas(equipes) {
  const grupos = new Map()
  for (const eq of equipes || []) {
    const numero = eq?.salaFinal?.numero
    const escolaId = String(eq?.escolaId ?? '').trim()
    if (!numero || !escolaId) continue
    const chave = `${numero}\0${escolaId}`
    if (!grupos.has(chave)) grupos.set(chave, { numero, escolaId, escola: eq.escola || escolaId, ids: [] })
    grupos.get(chave).ids.push(eq.id)
  }
  return [...grupos.values()].filter((g) => g.ids.length > 1).sort((a, b) => a.numero - b.numero || b.ids.length - a.ids.length)
}

function celula(valor) {
  const s = String(valor ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function csvCredencial(equipes) {
  const linhas = [['nome', 'email', 'papel', 'equipeId', 'equipe', 'escola', 'modalidade', 'sala', 'acessoProva']]
  let semSala = false
  for (const eq of equipes || []) {
    const sala = eq?.salaFinal?.numero ?? ''
    if (!sala) semSala = true
    for (const m of eq?.membros || []) {
      if (m?.status !== 'ativo') continue
      linhas.push([
        m.nome,
        m.email,
        m.papel,
        eq.id,
        eq.nome,
        eq.escola,
        eq.modalidade,
        sala,
        m.papel === 'professor_orientador' ? 'nao' : 'sim',
      ].map(celula))
    }
  }
  return { csv: `\uFEFF${linhas.map((l) => l.join(',')).join('\r\n')}`, semSala }
}

if (process.env.NODE_ENV !== 'production') {
  const equipes = [
    { id: 'a1', escolaId: '10', tipoEscola: 'estadual', modalidade: 'medio' },
    { id: 'a2', escolaId: '10', tipoEscola: 'estadual', modalidade: 'medio' },
    { id: 'a3', escolaId: '10', tipoEscola: 'estadual', modalidade: 'medio' },
    { id: 'b1', escolaId: '20', tipoEscola: 'particular', modalidade: 'medio' },
    { id: 'f1', escolaId: '10', tipoEscola: 'estadual', modalidade: 'fundamental' },
    { id: 'f2', escolaId: '30', tipoEscola: 'particular', modalidade: 'eja' },
  ]
  const r = dividirSalas(equipes, { salasMedio: 3, salasFund: 1 })
  if (r.erro) throw new Error(r.erro)
  const sala = Object.fromEntries(r.alocacao.map((a) => [a.id, a]))
  if (sala.f1.numero === sala.a1.numero) throw new Error('Fundamental não divide sala com médio.')
  if (sala.f1.grupo !== 'fundamental' || sala.a1.grupo !== 'medio') throw new Error('Grupo errado.')
  const medios = [sala.a1.numero, sala.a2.numero, sala.a3.numero]
  if (new Set(medios).size !== 3) throw new Error('Três equipes da mesma escola têm de ir a 3 salas.')
  if (!r.alocacao.some((a) => a.id === 'b1' && medios.includes(a.numero))) throw new Error('Particular fica numa sala de médio.')
  const deNovo = dividirSalas(equipes, { salasMedio: 3, salasFund: 1 })
  if (JSON.stringify(deNovo.alocacao) !== JSON.stringify(r.alocacao)) throw new Error('Divisão tem de ser determinística.')
  const junto = dividirSalas(equipes.filter((e) => e.id.startsWith('a')), { salasMedio: 1, salasFund: 0 })
  const gravadas = junto.alocacao.map((a) => ({ ...equipes.find((e) => e.id === a.id), salaFinal: a }))
  if (colisoesSalas(gravadas).length !== 1) throw new Error('Três da mesma escola numa sala é colisão.')
  if (dividirSalas(equipes, { salasMedio: 0, salasFund: 1 }).erro !== 'Ensino médio precisa de ao menos 1 sala.') {
    throw new Error('Médio sem sala tem de falhar.')
  }
  const csv = csvCredencial([{
    id: 'a1', nome: 'Alfa', escola: 'Escola A', modalidade: 'medio', salaFinal: { numero: 2 },
    membros: [
      { status: 'ativo', nome: 'Ana', email: 'ana@x.com', papel: 'aluno' },
      { status: 'ativo', nome: 'Prof', email: 'p@x.com', papel: 'professor_orientador' },
      { status: 'inativo', nome: 'Fora', email: 'f@x.com', papel: 'aluno' },
    ],
  }])
  if (!csv.csv.includes('ana@x.com') || !csv.csv.includes(',sim') || !csv.csv.includes(',nao')) throw new Error('CSV separa estudante e professor.')
  if (csv.csv.includes('Fora')) throw new Error('Membro inativo fica de fora do CSV.')
  const grupos = agruparPorSala([
    { id: 'z', nome: 'Zeta', salaFinal: { numero: 2, grupo: 'medio' } },
    { id: 'a', nome: 'Alfa', salaFinal: { numero: 2, grupo: 'medio' } },
    { id: 's', nome: 'Sem' },
    { id: 'b', nome: 'Beta', salaFinal: { numero: 1, grupo: 'fundamental' } },
  ])
  if (grupos.map((g) => g.numero).join() !== '1,2,0') throw new Error('Salas em ordem, sem sala no fim.')
  if (grupos[1].equipes.map((e) => e.nome).join() !== 'Alfa,Zeta') throw new Error('Dentro da sala, ordem alfabética.')
}
