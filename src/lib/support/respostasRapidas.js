import { collection, getDocs, query, where } from 'firebase/firestore'
import { supportDb } from '@/lib/support/firebase'

const TTL_CACHE = 10 * 60 * 1000
const CHAVE_CACHE = 'dhpb_support_respostas_rapidas'

const normalizar = (texto = '') =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const lerCache = () => {
  try {
    const raw = localStorage.getItem(CHAVE_CACHE)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (!ts || Date.now() - ts > TTL_CACHE) return null
    return data
  } catch {
    return null
  }
}

const gravarCache = (data) => {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

export const buscarRespostasRapidas = async (force = false) => {
  if (!force) {
    const cacheado = lerCache()
    if (cacheado) return cacheado
  }
  try {
    const q = query(collection(supportDb, 'respostas_rapidas'), where('ativa', '==', true))
    const snap = await getDocs(q)
    const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    gravarCache(dados)
    return dados
  } catch {
    return lerCache() || []
  }
}

export const limparCacheRespostas = () => {
  try {
    localStorage.removeItem(CHAVE_CACHE)
  } catch {}
}

export const encontrarRespostaRapida = (mensagem, respostas = []) => {
  if (!mensagem || respostas.length === 0) return null
  const texto = normalizar(mensagem)
  const palavras = texto.split(' ').filter((p) => p.length > 3)
  if (palavras.length === 0) return null

  let melhor = null
  for (const r of respostas) {
    const keywords = (r.palavrasChave || []).filter(Boolean)
    const frase = normalizar(r.pergunta || '')
    const conteudo = normalizar(r.resposta || '')

    if (frase && (frase === texto || texto.includes(frase) || frase.includes(texto))) {
      return { ...r, score: 1000 }
    }

    let acertos = 0
    for (const kw of keywords) {
      const k = normalizar(kw)
      if (k && (texto.includes(k) || palavras.some((p) => p.includes(k) || k.includes(p)))) acertos += 1
    }
    if (acertos === 0 && keywords.length > 0 && keywords.some((k) => conteudo.includes(normalizar(k)))) continue
    if (acertos > 0 && (!melhor || acertos > melhor.score)) {
      melhor = { ...r, score: acertos }
    }
  }
  return melhor && melhor.score > 0 ? melhor : null
}
