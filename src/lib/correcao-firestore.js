// I/O Firestore da correção do Portfólio Artístico (fase 4). Spec 044.
// Só `@/lib/firebase` — nunca o banco de suporte.

import { db } from '@/lib/firebase'
import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

import { CAMINHOS, FASE_ALVO, mesclarCorrecao, prepararGravacao } from '@/lib/correcao'

// Firestore: `doc()` exige número PAR de segmentos, `collection()` ímpar.
// Caminho com 3 segmentos estoura `invalid-argument` antes de qualquer rede —
// foi o que travou a fila. Os caminhos vivem em CAMINHOS e o check valida a paridade.
const refDistribuicao = () => doc(db, ...CAMINHOS.distribuicao())
const refVeredito = (equipeId) => doc(db, ...CAMINHOS.vereditos(equipeId))

/**
 * Assina a distribuição. Um DOCUMENTO, uma query — o 3º corretor nomeado pelo sistema
 * passa a ver o portfólio na hora, sem recarregar a página. Sem listener de coleção,
 * que é o que a constitution proíbe.
 */
export function ouvirDistribuicao(proximo, aoErrar) {
  return onSnapshot(refDistribuicao(), (snap) => proximo(snap.exists() ? snap.data() : null), aoErrar)
}

/**
 * Grava a correção de UM corretor no doc da equipe e devolve o doc já mesclado.
 *
 * O merge do Firestore SOMA mapas mas SUBSTITUI arrays, então `enviados` e as 47
 * respostas eram sobrescritos a cada envio — o segundo corretor apagava o registro do
 * primeiro e a coluna "Corrigidas" voltava para a fila depois do reload. A mesclagem
 * fica em `mesclarCorrecao` (puro, testado) e roda DENTRO da transação: relê o doc e
 * devolve o estado completo, que é o que o fechamento do veredito precisa. Fecha
 * também a corrida de dois corretores enviando no mesmo instante.
 *
 * `dados` = { corretorId, nota, criterios, zerados, autorUid }
 */
export async function salvarCorrecao(equipeId, dados) {
  const ref = doc(db, ...CAMINHOS.correcoes(equipeId))
  let mesclado = null
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    mesclado = mesclarCorrecao(snap.exists() ? snap.data() : null, { equipeId, ...dados })
    transaction.set(ref, mesclado)
  })
  return mesclado
}

/**
 * Grava a distribuição. Idempotente: regrava `atribuido` inteiro, não duplica.
 * `atribuido` = { [equipeId]: [corretorId, corretorId] }.
 */
export async function salvarDistribuicao({ atribuido, carga }) {
  const data = {
    versao: 1,
    atribuido: atribuido || {},
    carga: carga || {},
    geradoEm: new Date().toISOString(),
  }
  const batch = writeBatch(db)
  batch.set(refDistribuicao(), data, { merge: true })
  await batch.commit()
  return data
}

/**
 * Acrescenta o 3º corretor na distribuição da equipe. Sem isso a aba dele não
 * listaria o portfólio e o veredito nunca fecharia (o par ficaria com 2 notas).
 *
 * A Distribution é enviada como UM campo só (`atribuido`), e não como
 * `atribuido.{equipeId}`. É proposital: assim as regras do Firestore conseguem
 * aceitar `affectedKeys().hasOnly(['atribuido'])` e proibir o corretor de mexer em
 * `versao`, `carga` e `geradoEm`, que são do admin.
 */
export async function acrescentarTerceiro(equipeId, terceiroId) {
  const ref = refDistribuicao()
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('Distribuição não gerada.')
    const atribuido = snap.data().atribuido || {}
    const atual = atribuido[equipeId] || []
    if (atual.includes(terceiroId)) return
    transaction.update(ref, { atribuido: { ...atribuido, [equipeId]: [...atual, terceiroId] } })
  })
}

export async function carregarVeredito(equipeId) {
  const snap = await getDoc(refVeredito(equipeId))
  return snap.exists() ? snap.data() : null
}

export async function salvarVeredito(equipeId, dados) {
  await setDoc(
    refVeredito(equipeId),
    { ...dados, equipeId, atualizadoEm: new Date().toISOString() },
    { merge: true }
  )
}

/**
 * Fecha o veredito: `peso` da resposta passa a ser a nota final e `df`/`ni`/`di` recebem o delta.
 * Relê o doc ao vivo dentro da transação; nota igual à atual não grava nada.
 * Preserva o dual-write legado; não toca `membro-index` nem `aprovadoAte`.
 */
export async function gravarNota(equipeId, faseId, nota, autor) {
  const equipeRef = doc(db, 'equipes', equipeId)
  let resultado = { mudou: false, delta: 0 }

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(equipeRef)
    if (!snap.exists()) throw new Error('Equipe não encontrada.')
    const equipe = snap.data()

    const faseSnap = await transaction.get(doc(db, 'edicoes', equipe.edicaoId, 'fases', faseId))
    if (!faseSnap.exists()) throw new Error('Fase não encontrada.')

    const plano = prepararGravacao(equipe, faseSnap.data(), nota, autor)
    if (!plano) {
      resultado = { mudou: false, delta: 0 }
      return
    }

    transaction.set(doc(equipeRef, 'respostas', plano.respostaId), plano.resposta, { merge: true })

    const update = {
      df: increment(plano.deltaDi),
      [`pontuacoes.${faseId}.ni`]: increment(plano.delta),
      [`pontuacoes.${faseId}.di`]: increment(plano.deltaDi),
      [`respostas.${plano.respostaId}`]: plano.resposta,
    }
    // dual-write legado: o mapa `tarefa` só é desta fase quando o `faseId` bate.
    if (plano.atualizaLegado) update['respostas.tarefa'] = plano.resposta

    transaction.update(equipeRef, update)
    resultado = { mudou: true, delta: plano.delta, deltaDi: plano.deltaDi }
  })

  return resultado
}