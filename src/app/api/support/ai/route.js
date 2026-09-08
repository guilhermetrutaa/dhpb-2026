import { NextResponse } from 'next/server'
import { gerarRespostaIA } from '@/lib/support/ai'

const MAX_HISTORICO = 20

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : ''
    const historico = Array.isArray(body.historico) ? body.historico : []

    if (!mensagem) {
      return NextResponse.json({ erro: 'Mensagem vazia.' }, { status: 400 })
    }

    const historicoFiltrado = historico
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .slice(-MAX_HISTORICO)

    const resultado = await gerarRespostaIA({ mensagem, historico: historicoFiltrado })
    return NextResponse.json(resultado)
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível processar a mensagem agora. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
