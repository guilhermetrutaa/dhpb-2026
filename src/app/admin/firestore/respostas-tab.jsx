'use client'

import React, { useMemo, useState } from 'react'
import { auth } from '@/lib/firebase'
import { calcularPontosTarefa } from '@/app/tarefas/recortes-flavio-tavares/config'
import {
  buscarEquipesPorNome,
  calcularDeltaDi,
  carregarEquipe,
  carregarQuestaoAdmin,
  editarRespostaQuestao,
  editarRespostaTarefa,
  excluirRespostaEquipe,
  isRespostaTarefa,
  listarFasesEdicao,
  listarRespostasEquipe,
  mesclarRespostas,
  pesoCreditado,
  tarefaUrlEhRecortes,
} from './ops'

const inputCls = 'w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#82181A] transition-all'
const btnPrimary = 'bg-[#82181A] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer'
const btnGhost = 'border border-neutral-300 text-neutral-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'
const btnDanger = 'bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors cursor-pointer border border-red-200'

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function autorAdmin() {
  return auth.currentUser?.email || 'admin'
}

function tarefaDaFase(byId, faseId, isPrimeira) {
  if (byId[`tarefa_${faseId}`]) return byId[`tarefa_${faseId}`]
  const legado = byId.tarefa
  if (legado && (legado.faseId === faseId || (!legado.faseId && isPrimeira))) {
    return { ...legado, id: legado.id || 'tarefa' }
  }
  return null
}

function linhasQuestao(fase, byId) {
  const index = Array.isArray(fase.questoesIndex) ? fase.questoesIndex : []
  const usados = new Set()
  const linhas = index.map((q) => {
    usados.add(q.id)
    return {
      questaoId: q.id,
      numero: q.numero,
      resposta: byId[q.id] || null,
    }
  })
  Object.values(byId).forEach((r) => {
    if (!r?.id || isRespostaTarefa(r.id, r) || usados.has(r.id)) return
    if (r.faseId && r.faseId !== fase.id) return
    if (!r.faseId) return
    linhas.push({ questaoId: r.id, numero: r.numero, resposta: r })
  })
  linhas.sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0))
  return linhas
}

function formatarAssociacoes(associacoes) {
  const mapa = associacoes && typeof associacoes === 'object' ? associacoes : {}
  return Object.keys(mapa)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => `${k} → ${mapa[k]}`)
    .join(', ')
}

function confirmarEntregue(delta, deltaDi) {
  return window.confirm(
    `Esta resposta está ENTREGUE.\n\nDelta ni: ${delta}\nDelta df: ${deltaDi}\n\nConfirmar a alteração no banco?`
  )
}

function confirmarExclusao(equipeNome, rotulo, entregue) {
  const extra = entregue
    ? '\nA nota (ni/di/df) será descontada e a equipe poderá responder de novo.'
    : '\nA equipe poderá responder de novo.'
  return window.confirm(
    `Excluir ${rotulo} da equipe "${equipeNome}"?${extra}\n\nEsta ação é irreversível.`
  )
}

export default function RespostasTab() {
  const [queryNome, setQueryNome] = useState('')
  const [candidatos, setCandidatos] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [equipe, setEquipe] = useState(null)
  const [fases, setFases] = useState([])
  const [respostasById, setRespostasById] = useState({})
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const carregarDetalhe = async (eq) => {
    setCarregandoDetalhe(true)
    setMensagem('')
    try {
      const fresca = await carregarEquipe(eq.id)
      if (!fresca) throw new Error('Equipe não encontrada.')
      const [fasesEdicao, subcol] = await Promise.all([
        listarFasesEdicao(fresca.edicaoId),
        listarRespostasEquipe(fresca.id),
      ])
      setEquipe(fresca)
      setFases(fasesEdicao)
      setRespostasById(mesclarRespostas(fresca, subcol))
      setEditando(null)
    } catch (err) {
      setMensagem(err.message || 'Não foi possível carregar as respostas.')
    }
    setCarregandoDetalhe(false)
  }

  const buscar = async (e) => {
    e.preventDefault()
    const termo = queryNome.trim()
    if (!termo) return
    setBuscando(true)
    setMensagem('')
    setCandidatos([])
    setEquipe(null)
    setFases([])
    setRespostasById({})
    setEditando(null)
    try {
      const lista = await buscarEquipesPorNome(termo)
      setCandidatos(lista)
      if (lista.length === 0) setMensagem('Nenhuma equipe encontrada para este nome.')
      else if (lista.length === 1) await carregarDetalhe(lista[0])
    } catch (err) {
      setMensagem(err.message || 'Erro ao buscar equipes.')
    }
    setBuscando(false)
  }

  const abrirEdicaoQuestao = async (fase, linha) => {
    if (!linha.resposta || !equipe) return
    try {
      const questao = await carregarQuestaoAdmin(equipe.edicaoId, fase.id, linha.questaoId)
      if (!questao) throw new Error('Questão não encontrada no banco.')
      setEditando({
        tipo: 'questao',
        faseId: fase.id,
        questaoId: linha.questaoId,
        numero: linha.numero || questao.numero,
        alternativa: linha.resposta.alternativa || '',
        status: linha.resposta.status || 'rascunho',
        pesoAtual: Number(linha.resposta.peso) || 0,
        pesoFase: Number(fase.peso) || 0,
        alternativas: questao.alternativas || [],
      })
    } catch (err) {
      alert(err.message)
    }
  }

  const abrirEdicaoTarefa = (fase, tarefa) => {
    if (!tarefa) return
    const associacoes = { ...(tarefa.associacoes || {}) }
    setEditando({
      tipo: 'tarefa',
      faseId: fase.id,
      respostaId: tarefa.id,
      status: tarefa.status || 'rascunho',
      pesoAtual: Number(tarefa.peso) || 0,
      pesoFase: Number(fase.peso) || 0,
      associacoes,
      pesoManual: Number(tarefa.peso) || 0,
      recortes: tarefaUrlEhRecortes(fase.tarefaUrl),
      teto: Number(fase.tarefa?.pontuacao) || 20,
    })
  }

  const pesoPreviewTarefa = useMemo(() => {
    if (!editando || editando.tipo !== 'tarefa') return 0
    if (editando.recortes) return calcularPontosTarefa(editando.associacoes, editando.teto)
    return Number(editando.pesoManual) || 0
  }, [editando])

  const salvarEdicao = async () => {
    if (!editando || !equipe) return
    setSalvando(true)
    try {
      if (editando.tipo === 'questao') {
        const alt = (editando.alternativas || []).find((a) => a.letra === editando.alternativa)
        const pesoNovo = Number(alt?.peso) || 0
        if (editando.status === 'entregue') {
          const oldC = pesoCreditado({ status: 'entregue', peso: editando.pesoAtual })
          const delta = pesoNovo - oldC
          const dDi = calcularDeltaDi(delta, editando.pesoFase)
          if (!confirmarEntregue(delta, dDi)) {
            setSalvando(false)
            return
          }
        }
        await editarRespostaQuestao({
          equipeId: equipe.id,
          edicaoId: equipe.edicaoId,
          faseId: editando.faseId,
          questaoId: editando.questaoId,
          alternativa: editando.alternativa,
          atualizadoPor: autorAdmin(),
        })
      } else {
        const pesoNovo = pesoPreviewTarefa
        if (editando.status === 'entregue') {
          const oldC = pesoCreditado({ status: 'entregue', peso: editando.pesoAtual })
          const delta = pesoNovo - oldC
          const dDi = calcularDeltaDi(delta, editando.pesoFase)
          if (!confirmarEntregue(delta, dDi)) {
            setSalvando(false)
            return
          }
        }
        await editarRespostaTarefa({
          equipeId: equipe.id,
          edicaoId: equipe.edicaoId,
          faseId: editando.faseId,
          associacoes: editando.associacoes,
          pesoManual: editando.pesoManual,
          atualizadoPor: autorAdmin(),
        })
      }
      await carregarDetalhe(equipe)
    } catch (err) {
      alert(err.message)
    }
    setSalvando(false)
  }

  const excluir = async (fase, respostaId, rotulo, resposta) => {
    if (!equipe || !respostaId) return
    const entregue = resposta?.status === 'entregue'
    if (!confirmarExclusao(equipe.nome || equipe.id, rotulo, entregue)) return
    setSalvando(true)
    try {
      await excluirRespostaEquipe({
        equipeId: equipe.id,
        edicaoId: equipe.edicaoId,
        faseId: fase.id,
        respostaId,
      })
      await carregarDetalhe(equipe)
    } catch (err) {
      alert(err.message)
    }
    setSalvando(false)
  }

  const setAssociacao = (chave, letra) => {
    setEditando((prev) => {
      if (!prev || prev.tipo !== 'tarefa') return prev
      const next = { ...prev.associacoes }
      if (!letra) delete next[chave]
      else next[chave] = letra
      return { ...prev, associacoes: next }
    })
  }

  const addAssociacao = () => {
    const chave = window.prompt('Número do ponto/item da tarefa:')
    if (!chave) return
    setAssociacao(String(chave).trim(), 'A')
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
        <h2 className='font-bold text-neutral-800'>Respostas da equipe</h2>
        <p className='text-xs text-neutral-500'>
          Busque pelo nome. Editar ou excluir uma entrega recalcula ni, di e df. Excluir reabre a questão ou tarefa para a equipe.
        </p>
        <form onSubmit={buscar} className='flex flex-col sm:flex-row gap-3'>
          <input
            type='text'
            placeholder='Nome da equipe (sem acento na busca)...'
            value={queryNome}
            onChange={(e) => setQueryNome(e.target.value)}
            className='flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all'
          />
          <button type='submit' disabled={buscando} className={btnPrimary}>
            {buscando ? 'Buscando...' : 'Buscar equipe'}
          </button>
        </form>
        {mensagem && <p className='text-sm text-neutral-500'>{mensagem}</p>}
        {candidatos.length > 1 && (
          <div className='space-y-2'>
            <p className='text-xs font-semibold text-neutral-500'>Homônimos — escolha a equipe</p>
            {candidatos.map((eq) => (
              <button
                key={eq.id}
                type='button'
                onClick={() => carregarDetalhe(eq)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm cursor-pointer ${equipe?.id === eq.id ? 'border-[#82181A] bg-[#82181A]/5' : 'border-neutral-200 hover:bg-neutral-50'}`}
              >
                <span className='font-semibold text-neutral-800'>{eq.nome}</span>
                <span className='block text-xs text-neutral-400'>{eq.id} · df {eq.df ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {carregandoDetalhe && (
        <p className='text-sm text-[#82181A]'>Carregando respostas...</p>
      )}

      {equipe && !carregandoDetalhe && (
        <div className='space-y-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            <h3 className='font-bold text-neutral-800'>{equipe.nome}</h3>
            <p className='text-xs text-neutral-400 mt-1'>
              {equipe.id} · edição {equipe.edicaoId || '—'} · df {equipe.df ?? 0}
            </p>
          </div>

          {fases.length === 0 && (
            <p className='text-sm text-neutral-500'>Nenhuma fase cadastrada nesta edição.</p>
          )}

          {fases.map((fase, idx) => {
            const linhas = linhasQuestao(fase, respostasById)
            const tarefa = tarefaDaFase(respostasById, fase.id, idx === 0)
            return (
              <div key={fase.id} className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <div>
                  <h3 className='font-bold text-neutral-800'>{fase.nome || `Fase ${idx + 1}`}</h3>
                  <p className='text-xs text-neutral-400'>peso {fase.peso ?? 0} · {fase.status || '—'}</p>
                </div>

                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-neutral-500'>Questões</p>
                  {linhas.length === 0 && (
                    <p className='text-sm text-neutral-400'>Nenhuma questão indexada nesta fase.</p>
                  )}
                  {linhas.map((linha) => {
                    const r = linha.resposta
                    return (
                      <div key={linha.questaoId} className='flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3'>
                        <div className='flex-1 text-sm'>
                          <span className='font-semibold text-neutral-800'>Q{linha.numero ?? '?'}</span>
                          {r ? (
                            <span className='text-neutral-600'>
                              {' '}· {r.alternativa || '—'} · {r.status || '—'} · peso {r.peso ?? 0}
                              {r.atualizadoPor ? ` · ${r.atualizadoPor}` : ''}
                            </span>
                          ) : (
                            <span className='text-neutral-400'> · sem resposta</span>
                          )}
                        </div>
                        {r && (
                          <div className='flex gap-2'>
                            <button type='button' className={btnGhost} disabled={salvando} onClick={() => abrirEdicaoQuestao(fase, linha)}>Editar</button>
                            <button type='button' className={btnDanger} disabled={salvando} onClick={() => excluir(fase, linha.questaoId, `a questão ${linha.numero ?? linha.questaoId}`, r)}>Excluir</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-neutral-500'>Tarefa</p>
                  {tarefa ? (
                    <div className='flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3'>
                      <div className='flex-1 text-sm text-neutral-600'>
                        <span className='font-semibold text-neutral-800'>{tarefa.status || '—'}</span>
                        {' '}· peso {tarefa.peso ?? 0}
                        {tarefa.atualizadoPor ? ` · ${tarefa.atualizadoPor}` : ''}
                        <span className='block text-xs text-neutral-400 mt-1'>
                          {formatarAssociacoes(tarefa.associacoes) || 'sem associações'}
                        </span>
                      </div>
                      <div className='flex gap-2'>
                        <button type='button' className={btnGhost} disabled={salvando} onClick={() => abrirEdicaoTarefa(fase, tarefa)}>Editar</button>
                        <button type='button' className={btnDanger} disabled={salvando} onClick={() => excluir(fase, tarefa.id, 'a tarefa', tarefa)}>Excluir</button>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-neutral-400'>sem tarefa</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editando && (
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 space-y-4 shadow-xl'>
            <h3 className='font-bold text-neutral-800'>
              {editando.tipo === 'questao' ? `Editar questão ${editando.numero ?? ''}` : 'Editar tarefa'}
            </h3>
            <p className='text-xs text-neutral-500'>
              Status atual: {editando.status}. {editando.status === 'entregue' ? 'A nota será recalculada.' : 'Rascunho não altera ni/di/df.'}
            </p>

            {editando.tipo === 'questao' ? (
              <select
                className={inputCls}
                value={editando.alternativa}
                onChange={(e) => setEditando((p) => ({ ...p, alternativa: e.target.value }))}
              >
                <option value=''>Alternativa...</option>
                {(editando.alternativas || []).map((alt) => (
                  <option key={alt.letra} value={alt.letra}>
                    {alt.letra} (peso {alt.peso ?? 0})
                  </option>
                ))}
              </select>
            ) : (
              <div className='space-y-3'>
                {Object.keys(editando.associacoes)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((chave) => (
                    <div key={chave} className='flex gap-2 items-center'>
                      <span className='w-10 text-sm font-semibold text-neutral-700'>{chave}</span>
                      <select
                        className={inputCls}
                        value={editando.associacoes[chave] || ''}
                        onChange={(e) => setAssociacao(chave, e.target.value)}
                      >
                        <option value=''>—</option>
                        {LETRAS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                <button type='button' className={btnGhost} onClick={addAssociacao}>Adicionar associação</button>
                {editando.recortes ? (
                  <p className='text-xs text-neutral-500'>Peso recalculado (recortes): {pesoPreviewTarefa}</p>
                ) : (
                  <input
                    className={inputCls}
                    type='number'
                    placeholder='Peso da tarefa'
                    value={editando.pesoManual}
                    onChange={(e) => setEditando((p) => ({ ...p, pesoManual: e.target.value }))}
                  />
                )}
              </div>
            )}

            <div className='flex justify-end gap-2'>
              <button type='button' className={btnGhost} disabled={salvando} onClick={() => setEditando(null)}>Cancelar</button>
              <button
                type='button'
                className={btnPrimary}
                disabled={salvando || (editando.tipo === 'questao' && !editando.alternativa)}
                onClick={salvarEdicao}
              >
                {salvando ? 'Salvando...' : 'Salvar no banco'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
