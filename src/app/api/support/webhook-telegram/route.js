import { NextResponse } from 'next/server'
import {
  getToken,
  getProjectId,
  fsGet,
  fsGetCollection,
  fsUpdateComTimestamp,
  fsAddComTimestamp,
  fsUpdateComIncremento,
  fsUpdate,
} from '@/lib/support/server/firestore-rest'

export const runtime = 'nodejs'

const WEBHOOK_VERSION = '2026-08-27-repasse-limpeza-csat'

const escaparHtml = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// ─── Telegram API ─────────────────────────────────────────────────────────────
const callTelegram = async (metodo, corpo) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('[webhook-telegram] TELEGRAM_BOT_TOKEN não configurado')
    return { ok: false }
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${metodo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const body = await res.text().catch(() => '')
    if (!res.ok) console.error('[webhook-telegram] telegram error', metodo, res.status, body)
    return { ok: res.ok, status: res.status, body }
  } catch (e) {
    console.error('[webhook-telegram] telegram fetch error', e)
    return { ok: false }
  }
}

// Responde o callback_query IMEDIATAMENTE para o botão parar de "carregar"
const responderCallback = (callbackId, texto = '', alerta = false) =>
  callTelegram('answerCallbackQuery', {
    callback_query_id: callbackId,
    text: texto,
    show_alert: alerta,
    cache_time: 0,
  }).catch(() => null)

// ─── Registrar / Atualizar Atendente ──────────────────────────────────────────
const registrarAtendente = async (from, token, projectId) => {
  if (!from?.id) return
  const id = String(from.id)
  const nome = from.first_name || from.username || 'Atendente'
  const username = from.username || ''
  try {
    await fsUpdateComTimestamp(
      projectId,
      `atendentes_telegram/${id}`,
      { id, nome, username },
      ['atualizadoEm'],
      token
    )
  } catch (e) {
    console.error('[webhook-telegram] erro ao registrar atendente:', e)
  }
}

// ─── Assumir Atendimento ──────────────────────────────────────────────────────
const assumirAtendimento = async (cb) => {
  const chamadoId = String(cb.data || '').replace('assumir_', '').trim()
  const telegramId = String(cb.from?.id || '')
  const nomeAtendente = cb.from?.first_name || cb.from?.username || 'Atendente'

  if (!chamadoId || !telegramId) {
    await responderCallback(cb.id, 'Dados inválidos.', true)
    return NextResponse.json({ ok: true, erro: 'callback invalido' })
  }

  // Responde o Telegram IMEDIATAMENTE
  await responderCallback(cb.id, '⏳ Assumindo atendimento...')

  try {
    const token = await getToken()
    const projectId = getProjectId()
    const docPath = `chamados/${chamadoId}`

    await registrarAtendente(cb.from, token, projectId)

    // Verifica se o chamado existe
    const snap = await fsGet(projectId, docPath, token)
    if (!snap.exists) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: '❌ Chamado não encontrado. Pode ter sido removido.',
        })
      }
      return NextResponse.json({ ok: true, erro: 'Chamado nao encontrado' })
    }

    // Verifica se já foi assumido por outro atendente
    const dados = snap.data
    if (
      dados.status === 'em_atendimento' &&
      dados.atendenteTelegramId &&
      dados.atendenteTelegramId !== telegramId
    ) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: `⚠️ Este chamado já foi assumido por ${escaparHtml(dados.atendenteNome || 'outro atendente')}.`,
          parse_mode: 'HTML',
        })
      }
      return NextResponse.json({ ok: true, aviso: 'Chamado já assumido' })
    }

    // Atualiza o chamado
    await fsUpdateComTimestamp(
      projectId,
      docPath,
      {
        status: 'em_atendimento',
        atendenteTelegramId: telegramId,
        atendenteNome: nomeAtendente,
      },
      ['atualizadoEm', 'assumidoEm'],
      token
    )

    // Adiciona mensagem de sistema
    await fsAddComTimestamp(
      projectId,
      `chamados/${chamadoId}/mensagens`,
      {
        autorTipo: 'admin',
        autorNome: nomeAtendente,
        conteudo: `${nomeAtendente} assumiu o atendimento.`,
        lida: true,
        sistema: true,
      },
      ['enviadoEm'],
      token
    )

    // Edita a mensagem no grupo
    if (cb.message) {
      const textoOriginal = cb.message.text || cb.message.caption || 'Atendimento solicitado'
      await callTelegram('editMessageText', {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: `${escaparHtml(textoOriginal)}\n\n✅ <b>Assumido por ${escaparHtml(nomeAtendente)}</b>`,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    }

    // Envia mensagem no privado do atendente com botões
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const linkAtendimento = `${siteUrl}/admin/suporte/chamados/${encodeURIComponent(chamadoId)}`

    const privado = await callTelegram('sendMessage', {
      chat_id: telegramId,
      text: `✅ Você assumiu o chamado <code>${escaparHtml(chamadoId)}</code>.\n\nTudo que o usuário enviar aparecerá aqui como resposta a esta mensagem.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Abrir atendimento no site', url: linkAtendimento }],
          [{ text: '🔄 Repassar atendimento', callback_data: `repassar_${chamadoId}` }],
        ],
      },
    })

    if (!privado.ok) {
      if (cb.message) {
        await callTelegram('sendMessage', {
          chat_id: cb.message.chat.id,
          text: `${nomeAtendente} assumiu o atendimento, mas o bot não conseguiu enviar mensagem no privado. Abra uma conversa com o bot e clique em Iniciar.`,
        })
      }
      return NextResponse.json({ ok: true, aviso: 'Privado do atendente indisponivel' })
    }

    // Salva o message_id para tracking e limpeza posterior
    try {
      const msgData = JSON.parse(privado.body || '{}')
      const atendenteMsgId = msgData?.result?.message_id
      if (atendenteMsgId) {
        const msgsPrivadas = Array.isArray(dados.telegramPrivadoMsgIds) ? dados.telegramPrivadoMsgIds : []
        msgsPrivadas.push({ messageId: atendenteMsgId, chatId: String(telegramId) })
        await fsUpdate(projectId, `chamados/${chamadoId}`, { atendenteMsgId, telegramPrivadoMsgIds: msgsPrivadas }, token)
      }
    } catch (e) {
      console.error('[webhook-telegram] erro ao salvar atendenteMsgId', e)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram] falha ao assumir atendimento', err)
    if (cb.message) {
      await callTelegram('sendMessage', {
        chat_id: cb.message.chat.id,
        text: `❌ Erro ao assumir atendimento: ${escaparHtml(err?.message || String(err))}`,
      })
    }
    return NextResponse.json({ ok: true, erro: String(err?.message) })
  }
}

// ─── Menu de Repassar Atendimento ─────────────────────────────────────────────
const abrirMenuRepasse = async (cb) => {
  const chamadoId = String(cb.data || '').replace('repassar_', '').trim()
  const telegramId = String(cb.from?.id || '')

  await responderCallback(cb.id, 'Carregando equipe...')

  try {
    const token = await getToken()
    const projectId = getProjectId()
    await registrarAtendente(cb.from, token, projectId)

    const atendentes = await fsGetCollection(projectId, 'atendentes_telegram', token)
    const outrosAtendentes = atendentes.filter((a) => String(a.id) !== telegramId && a.nome)

    if (outrosAtendentes.length === 0) {
      await callTelegram('sendMessage', {
        chat_id: telegramId,
        text: '⚠️ Nenhum outro atendente cadastrado no bot ainda. Peça para seus colegas abrirem uma conversa no privado com o bot e enviarem /start!',
      })
      return NextResponse.json({ ok: true })
    }

    const botoes = outrosAtendentes.map((a) => [
      {
        text: `👤 ${a.nome}${a.username ? ` (@${a.username})` : ''}`,
        callback_data: `transferir_${chamadoId}_${a.id}`,
      },
    ])

    botoes.push([{ text: '❌ Cancelar repasse', callback_data: `cancelar_repassar_${chamadoId}` }])

    await callTelegram('sendMessage', {
      chat_id: telegramId,
      text: `🔄 <b>Para quem deseja repassar o chamado</b> <code>${escaparHtml(chamadoId)}</code>?`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: botoes },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook-telegram] erro ao abrir menu de repasse:', e)
    return NextResponse.json({ ok: true })
  }
}

// ─── Executar Transferência / Repasse ──────────────────────────────────────────
const executarTransferencia = async (cb) => {
  const partes = String(cb.data || '').replace('transferir_', '').split('_')
  const chamadoId = partes[0]
  const novoTelegramId = partes[1]
  const remetenteId = String(cb.from?.id || '')
  const nomeRemetente = cb.from?.first_name || cb.from?.username || 'Atendente'

  await responderCallback(cb.id, '🔄 Repassando atendimento...')

  try {
    const token = await getToken()
    const projectId = getProjectId()
    const snap = await fsGet(projectId, `chamados/${chamadoId}`, token)

    if (!snap.exists) {
      await callTelegram('sendMessage', {
        chat_id: remetenteId,
        text: '❌ Chamado não encontrado.',
      })
      return NextResponse.json({ ok: true })
    }

    const snapNovoAtendente = await fsGet(projectId, `atendentes_telegram/${novoTelegramId}`, token)
    const novoNome = snapNovoAtendente.exists
      ? snapNovoAtendente.data.nome || 'Novo Atendente'
      : 'Outro Atendente'

    // 1. Atualiza o chamado com o novo atendente
    await fsUpdateComTimestamp(
      projectId,
      `chamados/${chamadoId}`,
      {
        atendenteTelegramId: novoTelegramId,
        atendenteNome: novoNome,
      },
      ['atualizadoEm'],
      token
    )

    // 2. Grava mensagem de sistema
    await fsAddComTimestamp(
      projectId,
      `chamados/${chamadoId}/mensagens`,
      {
        autorTipo: 'admin',
        autorNome: 'Sistema',
        conteudo: `${nomeRemetente} repassou o atendimento para ${novoNome}.`,
        lida: true,
        sistema: true,
      },
      ['enviadoEm'],
      token
    )

    // 3. Limpa as mensagens privadas do atendente anterior
    const dados = snap.data
    const msgsParaApagar = Array.isArray(dados.telegramPrivadoMsgIds) ? [...dados.telegramPrivadoMsgIds] : []
    if (dados.atendenteMsgId && dados.atendenteTelegramId) {
      msgsParaApagar.push({ messageId: dados.atendenteMsgId, chatId: String(dados.atendenteTelegramId) })
    }

    if (msgsParaApagar.length > 0) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      await Promise.allSettled(
        msgsParaApagar
          .filter((m) => String(m.chatId) === remetenteId)
          .map((m) =>
            fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: m.chatId, message_id: m.messageId }),
            }).catch(() => {})
          )
      )
    }

    // 4. Confirmação para quem repassou
    await callTelegram('sendMessage', {
      chat_id: remetenteId,
      text: `✅ Atendimento do chamado <code>${escaparHtml(chamadoId)}</code> repassado para <b>${escaparHtml(novoNome)}</b> com sucesso!`,
      parse_mode: 'HTML',
    })

    // 5. Envia no privado do novo atendente
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const linkAtendimento = `${siteUrl}/admin/suporte/chamados/${encodeURIComponent(chamadoId)}`

    const novoMsg = await callTelegram('sendMessage', {
      chat_id: novoTelegramId,
      text: `📩 <b>Chamado Repassado para Você!</b>\n\nO atendente <b>${escaparHtml(nomeRemetente)}</b> repassou o chamado <code>${escaparHtml(chamadoId)}</code> para você.\n\nUsuário: ${escaparHtml(dados.nome || 'Usuário')}\nResumo: ${escaparHtml(dados.resumo || 'Sem resumo')}`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Abrir atendimento no site', url: linkAtendimento }],
          [{ text: '🔄 Repassar atendimento', callback_data: `repassar_${chamadoId}` }],
        ],
      },
    })

    const novoMsgData = JSON.parse(novoMsg.body || '{}')
    const novoAtendenteMsgId = novoMsgData?.result?.message_id
    if (novoAtendenteMsgId) {
      await fsUpdate(
        projectId,
        `chamados/${chamadoId}`,
        {
          atendenteMsgId: novoAtendenteMsgId,
          telegramPrivadoMsgIds: [{ messageId: novoAtendenteMsgId, chatId: String(novoTelegramId) }],
        },
        token
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram] erro ao transferir atendimento:', err)
    return NextResponse.json({ ok: true })
  }
}

// ─── Responder Relatório CSAT (/nota e /notas) ────────────────────────────────
const responderComandoNota = async (msg) => {
  const chatId = msg.chat?.id
  if (!chatId) return NextResponse.json({ ok: true })

  try {
    const token = await getToken()
    const projectId = getProjectId()
    await registrarAtendente(msg.from, token, projectId)

    const avaliacoes = await fsGetCollection(projectId, 'avaliacoes_suporte', token)

    if (!avaliacoes.length) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '📊 <b>Relatório de Avaliações de Suporte (CSAT)</b>\n\nAinda não há avaliações registradas.',
        parse_mode: 'HTML',
      })
      return NextResponse.json({ ok: true })
    }

    const total = avaliacoes.length
    const soma = avaliacoes.reduce((acc, a) => acc + (Number(a.nota) || 0), 0)
    const media = (soma / total).toFixed(1)

    const contagem = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 }
    avaliacoes.forEach((a) => {
      const n = Number(a.nota)
      if (contagem[n] !== undefined) contagem[n]++
    })

    const criticas = avaliacoes
      .filter((a) => Number(a.nota) <= 2 && a.justificativa)
      .slice(-5)
      .reverse()

    const texto = [
      '⭐ <b>RELATÓRIO DE AVALIAÇÃO DE SUPORTE (CSAT)</b>',
      '',
      `📈 <b>Média Geral:</b> <code>${media} / 5.0</code>`,
      `👥 <b>Total de Atendimentos Avaliados:</b> <code>${total}</code>`,
      '',
      '<b>Distribuição de Notas:</b>',
      `🤩 5 estrelas: ${contagem[5]} (${Math.round((contagem[5] / total) * 100)}%)`,
      `😊 4 estrelas: ${contagem[4]} (${Math.round((contagem[4] / total) * 100)}%)`,
      `🙂 3 estrelas: ${contagem[3]} (${Math.round((contagem[3] / total) * 100)}%)`,
      `😐 2 estrelas: ${contagem[2]} (${Math.round((contagem[2] / total) * 100)}%)`,
      `🙁 1 estrela:  ${contagem[1]} (${Math.round((contagem[1] / total) * 100)}%)`,
      `😡 0 estrelas: ${contagem[0]} (${Math.round((contagem[0] / total) * 100)}%)`,
      '',
      ...(criticas.length > 0
        ? [
            '⚠️ <b>Últimos Feedbacks Críticos (Notas 0-2):</b>',
            ...criticas.map(
              (c, i) =>
                `<b>${i + 1}. [Nota ${c.nota}]</b> <i>"${escaparHtml(c.justificativa)}"</i>\n   👤 Usuário: ${escaparHtml(c.usuarioNome || 'Anônimo')} · Atendente: ${escaparHtml(c.atendenteNome || 'Equipe')}`
            ),
          ]
        : []),
    ].join('\n')

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: texto,
      parse_mode: 'HTML',
    })
  } catch (e) {
    console.error('[webhook-telegram] erro ao calcular notas:', e)
  }
  return NextResponse.json({ ok: true })
}

// ─── Responder usuário pelo Reply no Telegram ─────────────────────────────────
const responderUsuarioPeloReply = async (msg) => {
  const replyText = msg.reply_to_message?.text || ''
  const texto = msg.text || ''
  const match = replyText.match(/ID:\s*([a-zA-Z0-9_-]+)\)/)

  if (!match?.[1] || !texto.trim()) return NextResponse.json({ ok: true })

  const chamadoId = match[1]
  const nomeAtendente = msg.from?.first_name || msg.from?.username || 'Atendente'

  try {
    const token = await getToken()
    const projectId = getProjectId()
    const docPath = `chamados/${chamadoId}`

    await registrarAtendente(msg.from, token, projectId)

    // Adiciona mensagem do admin
    await fsAddComTimestamp(
      projectId,
      `${docPath}/mensagens`,
      {
        autorTipo: 'admin',
        autorNome: nomeAtendente,
        conteudo: texto.trim(),
        lida: false,
      },
      ['enviadoEm'],
      token
    )

    // Atualiza chamado com increment em naoLidasUsuario + timestamps
    await fsUpdateComIncremento(
      projectId,
      docPath,
      {
        status: 'aguardando_usuario',
        ultimaMensagem: texto.trim().slice(0, 160),
        ultimaMensagemAutor: 'admin',
      },
      [['naoLidasUsuario', 1]],
      ['ultimaMensagemEm', 'atualizadoEm'],
      token
    )

    // Dispara push notification para o celular do usuário
    const snap = await fsGet(projectId, docPath, token)
    if (snap.exists && snap.data.fcmToken) {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
      const { fsSendFcm } = await import('@/lib/support/server/firestore-rest')
      await fsSendFcm(
        projectId,
        snap.data.fcmToken,
        token,
        `Suporte DHPB: Resposta de ${nomeAtendente}`,
        texto.trim().slice(0, 100) + (texto.length > 100 ? '...' : ''),
        siteUrl
      ).catch(() => {})
    }
  } catch (err) {
    console.error('[webhook-telegram] erro ao responder usuario pelo reply', err)
  }

  return NextResponse.json({ ok: true })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    if (body.callback_query) {
      const cb = body.callback_query
      const data = cb.data || ''
      if (data.startsWith('assumir_')) return assumirAtendimento(cb)
      if (data.startsWith('repassar_')) return abrirMenuRepasse(cb)
      if (data.startsWith('transferir_')) return executarTransferencia(cb)
      if (data.startsWith('cancelar_repassar_')) {
        await responderCallback(cb.id, 'Repasse cancelado.')
        if (cb.message) {
          await callTelegram('deleteMessage', {
            chat_id: cb.message.chat.id,
            message_id: cb.message.message_id,
          })
        }
        return NextResponse.json({ ok: true })
      }
      await responderCallback(cb.id)
      return NextResponse.json({ ok: true })
    }

    if (body.message) {
      const msg = body.message
      const texto = (msg.text || '').trim()

      if (texto === '/nota' || texto === '/notas' || texto.startsWith('/nota@') || texto.startsWith('/notas@')) {
        return responderComandoNota(msg)
      }

      if (texto === '/start') {
        const token = await getToken().catch(() => null)
        const projectId = getProjectId()
        if (token) await registrarAtendente(msg.from, token, projectId)
        await callTelegram('sendMessage', {
          chat_id: msg.chat.id,
          text: `👋 Olá, <b>${escaparHtml(msg.from?.first_name || 'Atendente')}</b>! Você está registrado(a) como atendente do Suporte DHPB. Quando assumir chamados no grupo, as mensagens virão diretamente para este chat.`,
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      if (msg.reply_to_message) {
        return responderUsuarioPeloReply(msg)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-telegram]', err)
    return NextResponse.json({ erro: 'Falha interna do webhook' }, { status: 500 })
  }
}

// ─── GET (diagnóstico) ────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    ok: true,
    rota: 'support/webhook-telegram',
    version: WEBHOOK_VERSION,
    engine: 'firestore-rest-api',
  })
}
