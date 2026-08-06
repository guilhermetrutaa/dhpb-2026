'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore'
import Image from 'next/image'
import { supportDb } from '@/lib/support/firebase'
import { obterNomeAtendente, definirNomeAtendente } from '@/lib/support/nomeAtendente'
import {
  AUTORES,
  CATEGORIAS,
  PRIORIDADES,
  PRIORIDADE_COLORS,
  STATUS_CHAMADO,
  STATUS_COLORS,
  STATUS_LABELS,
  formatarDataHora,
  formatarTempo,
} from '@/lib/support/constants'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const CATEGORIA_LABELS = {}
CATEGORIAS.forEach((c) => { CATEGORIA_LABELS[c.id] = c.label })

function TabChamados() {
  const router = useRouter()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [ordenacao, setOrdenacao] = useState('recentes')
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let unsub = () => {}
    unsub = onSnapshot(
      query(collection(supportDb, 'chamados'), orderBy('atualizadoEm', 'desc'), limit(100)),
      (snap) => {
        setChamados(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCarregando(false)
      }
    )
    return () => unsub()
  }, [])

  const filtrarOrdenar = useMemo(() => {
    let lista = [...chamados]
    if (filtroStatus) lista = lista.filter((c) => c.status === filtroStatus)
    if (filtroCategoria) lista = lista.filter((c) => c.categoria === filtroCategoria)
    if (busca.trim()) {
      const t = busca.toLowerCase()
      lista = lista.filter(
        (c) =>
          c.nome?.toLowerCase().includes(t) ||
          c.email?.toLowerCase().includes(t) ||
          c.resumo?.toLowerCase().includes(t) ||
          c.id.toLowerCase().includes(t)
      )
    }
    if (ordenacao === 'antigos') {
      lista.sort((a, b) => (a.criadoEm?.toMillis?.() || 0) - (b.criadoEm?.toMillis?.() || 0))
    } else if (ordenacao === 'prioridade') {
      const ordem = { alta: 0, media: 1, baixa: 2 }
      lista.sort((a, b) => (ordem[a.prioridade] ?? 1) - (ordem[b.prioridade] ?? 1))
    }
    return lista
  }, [chamados, busca, filtroStatus, filtroCategoria, ordenacao])

  const tempoEspera = (c) => {
    if (c.status !== STATUS_CHAMADO.AGUARDANDO_ATENDENTE) return null
    const criado = c.criadoEm?.toDate?.() || c.transferidoEm?.toDate?.()
    if (!criado) return null
    return formatarTempo(agora - criado.getTime())
  }

  const tempoAtendimento = (c) => {
    if (![STATUS_CHAMADO.EM_ATENDIMENTO, STATUS_CHAMADO.AGUARDANDO_USUARIO].includes(c.status)) return null
    const base = c.assumidoEm?.toDate?.() || c.criadoEm?.toDate?.()
    if (!base) return null
    return formatarTempo(agora - base.getTime())
  }

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando chamados...</p>

  return (
    <div className='space-y-4 text-[#000]'>
      <div className='flex flex-col md:flex-row gap-3'>
        <input
          type="text"
          placeholder="Buscar por nome, e-mail, resumo ou ID..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className='flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className='rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] bg-white'
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className='rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] bg-white'
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value)}
          className='rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] bg-white'
        >
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
          <option value="prioridade">Prioridade</option>
        </select>
      </div>

      {filtrarOrdenar.length === 0 ? (
        <p className='text-neutral-400 text-sm text-center py-10'>Nenhum chamado encontrado.</p>
      ) : (
        <div className='space-y-2'>
          {filtrarOrdenar.map((c) => {
            const espera = tempoEspera(c)
            const atendimento = tempoAtendimento(c)
            const naoLidas = c.naoLidasAdmin || 0
            const autor = c.ultimaMensagemAutor === AUTORES.USUARIO ? 'Usuário' : c.ultimaMensagemAutor === AUTORES.ADMIN ? 'Atendente' : 'IA'
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/admin/suporte/chamados/${c.id}`)}
                className='w-full text-left bg-white rounded-xl border border-neutral-200 p-4 hover:border-[#82181A]/40 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='font-semibold text-sm'>{c.nome || 'Usuário'}</p>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-neutral-100 text-neutral-500'}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${PRIORIDADE_COLORS[c.prioridade] || ''}`}>
                      {c.prioridade || '—'}
                    </span>
                    {c.modo === 'ia' && (
                      <span className='text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700'>IA</span>
                    )}
                    {naoLidas > 0 && c.modo === 'humano' && (
                      <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#82181A] text-white'>{naoLidas} nova(s)</span>
                    )}
                  </div>
                  <p className='text-xs text-neutral-500 mt-1 truncate'>
                    {c.resumo || c.ultimaMensagem || 'Sem resumo'}
                  </p>
                  <p className='text-[10px] text-neutral-400 mt-0.5'>
                    {CATEGORIA_LABELS[c.categoria] || c.categoria || '—'} · {autor}: {formatarDataHora(c.ultimaMensagemEm)} · ID: {c.id.slice(0, 8)}
                  </p>
                </div>
                <div className='flex gap-3 shrink-0 text-xs'>
                  {espera && (
                    <span className='px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-medium border border-amber-100'>
                      ⏳ {espera}
                    </span>
                  )}
                  {atendimento && (
                    <span className='px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium border border-green-100'>
                      ⏱ {atendimento}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabRespostasRapidas() {
  const [respostas, setRespostas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState({ titulo: '', pergunta: '', resposta: '', palavrasChave: '', sugestao: false })
  const [editandoId, setEditandoId] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let unsub = () => {}
    unsub = onSnapshot(query(collection(supportDb, 'respostas_rapidas'), orderBy('criadoEm', 'desc')), (snap) => {
      setRespostas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCarregando(false)
    })
    return () => unsub()
  }, [])

  const salvar = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!form.pergunta.trim() || !form.resposta.trim()) {
      setMsg('Preencha a pergunta e a resposta.')
      return
    }
    const dados = {
      titulo: form.titulo.trim(),
      pergunta: form.pergunta.trim(),
      resposta: form.resposta.trim(),
      palavrasChave: form.palavrasChave.split(',').map((k) => k.trim()).filter(Boolean),
      sugestao: form.sugestao,
      ativa: true,
    }
    try {
      if (editandoId) {
        await updateDoc(doc(supportDb, 'respostas_rapidas', editandoId), { ...dados, atualizadoEm: new Date() })
      } else {
        await addDoc(collection(supportDb, 'respostas_rapidas'), { ...dados, criadoEm: new Date(), atualizadoEm: new Date() })
      }
      setForm({ titulo: '', pergunta: '', resposta: '', palavrasChave: '', sugestao: false })
      setEditandoId(null)
      setMsg(editandoId ? 'Resposta atualizada!' : 'Resposta cadastrada!')
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setMsg('Erro ao salvar.')
    }
  }

  const editar = (r) => {
    setEditandoId(r.id)
    setForm({
      titulo: r.titulo || '',
      pergunta: r.pergunta || '',
      resposta: r.resposta || '',
      palavrasChave: (r.palavrasChave || []).join(', '),
      sugestao: !!r.sugestao,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const alternarAtiva = async (r) => {
    await updateDoc(doc(supportDb, 'respostas_rapidas', r.id), { ativa: !r.ativa }).catch(() => {})
  }

  const excluir = async (r) => {
    if (!window.confirm('Excluir esta resposta rápida?')) return
    await deleteDoc(doc(supportDb, 'respostas_rapidas', r.id)).catch(() => {})
  }

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>

  return (
    <div className='space-y-6 text-[#000]'>
      <form onSubmit={salvar} className='bg-neutral-50/50 border border-neutral-200 rounded-xl p-5 space-y-3'>
        <h3 className='font-semibold text-sm text-[#82181A]'>{editandoId ? 'Editar resposta rápida' : 'Nova resposta rápida'}</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <input
            type="text"
            placeholder="Título (opcional)"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]"
          />
          <input
            type="text"
            placeholder="Pergunta frequente *"
            value={form.pergunta}
            onChange={(e) => setForm({ ...form, pergunta: e.target.value })}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]"
          />
        </div>
        <textarea
          placeholder="Resposta pronta *"
          rows={4}
          value={form.resposta}
          onChange={(e) => setForm({ ...form, resposta: e.target.value })}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] resize-y"
        />
        <input
          type="text"
          placeholder="Palavras-chave separadas por vírgula (ex: inscrição, como me inscrever)"
          value={form.palavrasChave}
          onChange={(e) => setForm({ ...form, palavrasChave: e.target.value })}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]"
        />
        <label className='flex items-center gap-2 text-sm cursor-pointer'>
          <input
            type="checkbox"
            checked={form.sugestao}
            onChange={(e) => setForm({ ...form, sugestao: e.target.checked })}
            className='accent-[#82181A] w-4 h-4'
          />
          Sugerir como atalho no início do chat
        </label>
        {msg && <p className={`text-sm ${msg.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
        <div className='flex gap-3'>
          <button type="submit" className='bg-[#82181A] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>
            {editandoId ? 'Salvar alterações' : 'Cadastrar'}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={() => { setEditandoId(null); setForm({ titulo: '', pergunta: '', resposta: '', palavrasChave: '', sugestao: false }) }}
              className='border border-neutral-300 text-neutral-600 font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer'
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className='space-y-2'>
        {respostas.length === 0 ? (
          <p className='text-neutral-400 text-sm text-center py-6'>Nenhuma resposta rápida cadastrada.</p>
        ) : (
          respostas.map((r) => (
            <div key={r.id} className={`bg-white rounded-xl border border-neutral-200 p-4 ${r.ativa ? '' : 'opacity-60'}`}>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='font-semibold text-sm'>{r.pergunta || r.titulo || 'Sem pergunta'}</p>
                  <p className='text-xs text-neutral-500 mt-1 whitespace-pre-wrap line-clamp-3'>{r.resposta}</p>
                  {(r.palavrasChave || []).length > 0 && (
                    <div className='flex flex-wrap gap-1.5 mt-2'>
                      {(r.palavrasChave || []).map((k, i) => (
                        <span key={i} className='text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full'>{k}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className='flex gap-2 shrink-0'>
                  <button onClick={() => alternarAtiva(r)} title={r.ativa ? 'Desativar' : 'Ativar'}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${r.ativa ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100' : 'text-neutral-500 bg-neutral-100 border-neutral-200 hover:bg-neutral-200'}`}>
                    {r.ativa ? 'Ativa' : 'Inativa'}
                  </button>
                  <button onClick={() => editar(r)}
                    className='text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer'>
                    Editar
                  </button>
                  <button onClick={() => excluir(r)}
                    className='text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer'>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const Page = () => {
  const [nomeAtendente, setNomeAtendente] = useState('')
  const [inputNome, setInputNome] = useState('')
  const [editandoNome, setEditandoNome] = useState(false)
  const [aba, setAba] = useState('chamados')
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => {
      const nome = obterNomeAtendente()
      setNomeAtendente(nome)
      setInputNome(nome)
      setEditandoNome(!nome)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const salvarNome = () => {
    definirNomeAtendente(inputNome)
    setNomeAtendente(inputNome.trim())
    setEditandoNome(false)
  }

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3 flex-wrap'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <div>
                <h1 className='text-lg font-bold text-[#82181A]'>Painel Administrativo</h1>
                <p className='text-xs text-neutral-400'>Atendimento e suporte</p>
              </div>
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              {editandoNome ? (
                <div className='flex items-center gap-2'>
                  <input
                    type="text"
                    value={inputNome}
                    onChange={(e) => setInputNome(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') salvarNome() }}
                    placeholder="Seu nome"
                    maxLength={60}
                    autoFocus
                    className='w-40 rounded-xl border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-[#82181A]'
                  />
                  <button onClick={salvarNome} className='bg-[#82181A] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>
                    Salvar
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditandoNome(true)} title="Editar nome"
                  className='flex items-center gap-2 border border-neutral-300 text-neutral-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-all cursor-pointer'>
                  <span className='w-2 h-2 rounded-full bg-green-500' />
                  {nomeAtendente || 'Definir nome'}
                </button>
              )}
              <button onClick={() => router.push('/admin/dashboard')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Dashboard</button>
            </div>
          </div>
        </header>

        <div className='max-w-6xl mx-auto px-6 pt-6'>
          <div className='flex gap-1 bg-white rounded-xl shadow-sm border border-neutral-200 p-1 overflow-x-auto'>
            {[
              { id: 'chamados', label: 'Chamados', icon: 'M8 10h8m-8 4h5m-9 6h18a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { id: 'respostas', label: 'Respostas rápidas', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ].map((t) => (
              <button key={t.id} onClick={() => setAba(t.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${aba === t.id ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={t.icon} /></svg>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <main className='max-w-6xl mx-auto px-6 py-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            {aba === 'chamados' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Chamados</h2>
                  <span className='text-xs bg-[#82181A]/10 text-[#82181A] px-3 py-1 rounded-full font-medium'>Suporte humano</span>
                </div>
                <div className='pt-4'><TabChamados /></div>
              </div>
            )}
            {aba === 'respostas' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Respostas rápidas</h2>
                  <span className='text-xs bg-[#82181A]/10 text-[#82181A] px-3 py-1 rounded-full font-medium'>IA sem custo</span>
                </div>
                <div className='pt-4'><TabRespostasRapidas /></div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page
