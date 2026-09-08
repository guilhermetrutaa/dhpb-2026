import { groqProvider } from './providers'
import { PROMPT_SISTEMA } from './knowledge'

const providers = {
  groq: groqProvider,
}

const extrairJson = (texto) => {
  try {
    const t = texto.trim()
    const inicio = t.indexOf('{')
    const fim = t.lastIndexOf('}')
    if (inicio === -1 || fim === -1 || fim < inicio) throw new Error('JSON não encontrado')
    return JSON.parse(t.slice(inicio, fim + 1))
  } catch {
    return null
  }
}

const validarResposta = (json) => {
  if (!json || typeof json.resposta !== 'string' || !json.resposta.trim()) return null
  return {
    resposta: json.resposta.trim(),
    transferir: json.transferir === true,
    resumo: typeof json.resumo === 'string' ? json.resumo.trim() : '',
    categoria: typeof json.categoria === 'string' ? json.categoria.trim() : 'outros',
    prioridade: typeof json.prioridade === 'string' ? json.prioridade.trim() : 'media',
  }
}

export const gerarRespostaIA = async ({ mensagem, historico }) => {
  const nomeProvedor = process.env.AI_PROVIDER || 'groq'
  const provedor = providers[nomeProvedor]
  if (!provedor) {
    throw new Error(`Provedor de IA "${nomeProvedor}" não suportado. Opções: ${Object.keys(providers).join(', ')}`)
  }

  const conteudo = await provedor.completar({
    mensagem,
    historico,
    systemPrompt: PROMPT_SISTEMA,
  })

  const json = extrairJson(conteudo)
  const valida = validarResposta(json)
  if (valida) return valida

  return { resposta: conteudo, transferir: false, resumo: '', categoria: 'outros', prioridade: 'media' }
}
