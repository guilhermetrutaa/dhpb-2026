'use client'

import React, { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, onSnapshot, orderBy, query, getDocs } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function TabEquipes() {
  const [equipes, setEquipes] = useState([])
  const [edicoes, setEdicoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const carregar = async () => {
      const [eSnap, edSnap] = await Promise.all([
        getDocs(collection(db, 'equipes')),
        getDocs(collection(db, 'edicoes')),
      ])
      const edMap = {}
      edSnap.docs.forEach((d) => { edMap[d.id] = d.data().nome || '—' })
      setEdicoes(edSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setEquipes(eSnap.docs.map((d) => ({ id: d.id, edicaoNome: edMap[d.data().edicaoId] || '—', ...d.data() })))
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>
  if (equipes.length === 0) return <p className='text-neutral-400 text-sm text-center py-10'>Nenhuma equipe cadastrada.</p>

  return (
    <div className='space-y-3'>
      {equipes.map((eq) => (
        <div key={eq.id} className='bg-white rounded-xl border border-neutral-200 p-4'>
          <button onClick={() => setExpanded(expanded === eq.id ? null : eq.id)}
            className='w-full flex items-center justify-between cursor-pointer'>
            <div className='text-left'>
              <p className='font-semibold text-sm'>{eq.nome}</p>
              <p className='text-xs text-neutral-400'>{eq.edicaoNome} — {eq.escola || '—'}</p>
            </div>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expanded === eq.id ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
          {expanded === eq.id && (
            <div className='mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-1'>
              <p><span className='font-medium text-neutral-700'>ID:</span> {eq.id}</p>
              <p><span className='font-medium text-neutral-700'>Criador:</span> {eq.criadorNome} ({eq.criadorEmail})</p>
              <p><span className='font-medium text-neutral-700'>Escola:</span> {eq.escola}</p>
              <p><span className='font-medium text-neutral-700'>Modalidade:</span> {eq.modalidade}</p>
              <p><span className='font-medium text-neutral-700'>Tipo:</span> {eq.tipoEscola}</p>
              <p><span className='font-medium text-neutral-700'>Membros:</span> {(eq.membros || []).length}</p>
              {eq.aprovadoAte && <p><span className='font-medium text-neutral-700'>Aprovado até:</span> {eq.aprovadoAte}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const snap = await getDocs(collection(db, 'users'))
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>

  return (
    <div className='overflow-x-auto text-[#000]'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
            <th className='text-left px-4 py-3 font-medium'>Nome</th>
            <th className='text-left px-4 py-3 font-medium'>Email</th>
            <th className='text-left px-4 py-3 font-medium'>Tipo</th>
            <th className='text-left px-4 py-3 font-medium'>Documento</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan={4} className='text-center py-10 text-neutral-400'>Nenhum usuário.</td></tr>
          ) : (
            usuarios.map((u) => (
              <tr key={u.id} className='border-t border-neutral-100'>
                <td className='px-4 py-3 font-medium'>{u.nome} {u.sobrenome}</td>
                <td className='px-4 py-3 text-neutral-500'>{u.email}</td>
                <td className='px-4 py-3 capitalize'>{u.tipo || '—'}</td>
                <td className='px-4 py-3'>
                  {u.tipo === 'professor' ? (
                    u.documentoStatus === 'aprovado' ? <span className='text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold'>Aprovado</span>
                    : u.documentoStatus === 'recusado' ? <span className='text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold'>Recusado</span>
                    : u.documento ? <span className='text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold'>Pendente</span>
                    : <span className='text-[10px] bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded-full font-semibold'>Não enviado</span>
                  ) : <span className='text-neutral-400'>—</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function TabEscolas() {
  const [escolas, setEscolas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const carregar = async () => {
      const snap = await getDocs(query(collection(db, 'escolas'), orderBy('nome', 'asc')))
      setEscolas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCarregando(false)
    }
    carregar()
  }, [])

  const filtradas = filtro ? escolas.filter((e) => e.nome?.toLowerCase().includes(filtro.toLowerCase())) : escolas

  if (carregando) return <p className='text-neutral-400 text-sm text-center py-10'>Carregando...</p>

  return (
    <div className='space-y-4 text-[#000]'>
      <input type="text" placeholder="Buscar escola..." value={filtro} onChange={(e) => setFiltro(e.target.value)}
        className='w-full md:w-96 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
              <th className='text-left px-4 py-3 font-medium'>Nome</th>
              <th className='text-left px-4 py-3 font-medium'>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={2} className='text-center py-10 text-neutral-400'>Nenhuma escola encontrada.</td></tr>
            ) : (
              filtradas.map((e) => (
                <tr key={e.id} className='border-t border-neutral-100'>
                  <td className='px-4 py-3 font-medium'>{e.nome}</td>
                  <td className='px-4 py-3 capitalize'>{e.tipo || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Page = () => {
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [aba, setAba] = useState('edicoes')
  const [novoNome, setNovoNome] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [criando, setCriando] = useState(false)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoAberta, setEdicaoAberta] = useState(null)
  const [fases, setFases] = useState({})
  const [faseForm, setFaseForm] = useState({ nome: '', dataInicio: '', dataFim: '', peso: '', notaMaxima: '' })
  const router = useRouter()

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); setVerificando(false) }
  }, [router])

  useEffect(() => {
    if (!autenticado) return
    const q = query(collection(db, 'edicoes'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => setEdicoes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [autenticado])

  const carregarFases = async (edId) => {
    try {
      const snap = await getDocs(query(collection(db, 'edicoes', edId, 'fases'), orderBy('dataInicio', 'asc')))
      setFases((prev) => ({ ...prev, [edId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }))
    } catch {}
  }

  const abrirEdicao = (edId) => {
    if (edicaoAberta === edId) { setEdicaoAberta(null); return }
    setEdicaoAberta(edId)
    if (!fases[edId]) carregarFases(edId)
  }

  const criarEdicao = async (e) => {
    e.preventDefault(); setErro(''); setSucesso('')
    if (!novoNome.trim()) { setErro('Digite um nome.'); return }
    setCriando(true)
    try {
      await addDoc(collection(db, 'edicoes'), { nome: novoNome.trim(), createdAt: serverTimestamp() })
      setNovoNome(''); setSucesso('Edição criada!')
      setTimeout(() => setSucesso(''), 3000)
    } catch { setErro('Erro ao criar.') }
    finally { setCriando(false) }
  }

  const criarFase = async (edId) => {
    setErro('')
    if (!faseForm.nome.trim() || !faseForm.dataInicio || !faseForm.dataFim) { setErro('Preencha todos os campos.'); return }
    try {
      await addDoc(collection(db, 'edicoes', edId, 'fases'), {
        nome: faseForm.nome.trim(), dataInicio: faseForm.dataInicio, dataFim: faseForm.dataFim,
        status: 'pendente', peso: parseFloat(faseForm.peso) || 0, notaMaxima: parseFloat(faseForm.notaMaxima) || 0,
        createdAt: serverTimestamp(),
      })
      setFaseForm({ nome: '', dataInicio: '', dataFim: '', peso: '', notaMaxima: '' })
      carregarFases(edId)
    } catch { setErro('Erro ao criar fase.') }
  }

  const atualizarStatus = async (edId, faseId, status) => {
    try { await updateDoc(doc(db, 'edicoes', edId, 'fases', faseId), { status }); carregarFases(edId) } catch {}
  }

  const deletarFase = async (edId, faseId) => {
    try { await deleteDoc(doc(db, 'edicoes', edId, 'fases', faseId)); carregarFases(edId) } catch {}
  }

  const salvarPdfUrl = async (edId, faseId, url) => {
    try { await updateDoc(doc(db, 'edicoes', edId, 'fases', faseId), { provaPdfUrl: url }); carregarFases(edId) } catch {}
  }

  const handleSair = async () => {
    try { await signOut(auth) } catch {}
    localStorage.removeItem('admin-authenticated')
    router.push('/admin')
  }

  const abas = [
    { id: 'edicoes', label: 'Edições', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'equipes', label: 'Equipes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'usuarios', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'escolas', label: 'Escolas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ]

  if (verificando) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Verificando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <div>
                <h1 className='text-lg font-bold text-[#82181A]'>Painel Administrativo</h1>
                <p className='text-xs text-neutral-400'>Gerencie todo o sistema</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button onClick={() => router.push('/admin/documentos')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Documentos</button>
              <button onClick={() => router.push('/admin/ranking')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Ranking</button>
              <button onClick={handleSair} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Sair</button>
            </div>
          </div>
        </header>

        <div className='max-w-6xl mx-auto px-6 pt-6'>
          <div className='flex gap-1 bg-white rounded-xl shadow-sm border border-neutral-200 p-1 overflow-x-auto'>
            {abas.map((a) => (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${aba === a.id ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={a.icon} /></svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <main className='max-w-6xl mx-auto px-6 py-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            {aba === 'edicoes' && (
              <div className='space-y-6'>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Gerenciar Edições</h2>
                  <span className='text-xs bg-[#82181A]/10 text-[#82181A] px-3 py-1 rounded-full font-medium'>{edicoes.length}</span>
                </div>

                <form onSubmit={criarEdicao} className='flex flex-col sm:flex-row gap-3'>
                  <input type="text" placeholder="Ex: 5° Desafio em História da Paraíba" value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
                  <button type="submit" disabled={criando}
                    className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                    {criando ? 'Criando...' : 'Criar Edição'}
                  </button>
                </form>
                {erro && <p className="text-red-600 text-sm">{erro}</p>}
                {sucesso && <p className="text-green-600 text-sm">{sucesso}</p>}

                <div className='space-y-3 pt-2'>
                  {edicoes.length === 0 ? (
                    <p className='text-neutral-400 text-sm text-center py-8'>Nenhuma edição ainda.</p>
                  ) : (
                    edicoes.map((ed) => (
                      <div key={ed.id} className='border border-neutral-200 rounded-xl overflow-hidden'>
                        <button onClick={() => abrirEdicao(ed.id)}
                          className='w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors cursor-pointer'>
                          <div className='flex items-center gap-3'>
                            <div className='w-9 h-9 rounded-xl bg-[#82181A]/10 flex items-center justify-center font-bold text-[#82181A]'>{ed.nome?.charAt(0) || '?'}</div>
                            <div className='text-left'>
                              <p className='font-semibold text-sm'>{ed.nome}</p>
                              <p className='text-[10px] text-neutral-400'>{fases[ed.id]?.length || 0} fase(s)</p>
                            </div>
                          </div>
                          <svg className={`w-4 h-4 text-neutral-400 transition-transform ${edicaoAberta === ed.id ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                          </svg>
                        </button>

                        {edicaoAberta === ed.id && (
                          <div className='border-t border-neutral-100 bg-neutral-50/50 p-4 space-y-4'>
                            <div className='grid grid-cols-1 sm:grid-cols-6 gap-2'>
                              <input type="text" placeholder="Nome" value={faseForm.nome} onChange={(e) => setFaseForm({ ...faseForm, nome: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="date" value={faseForm.dataInicio} onChange={(e) => setFaseForm({ ...faseForm, dataInicio: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="date" value={faseForm.dataFim} onChange={(e) => setFaseForm({ ...faseForm, dataFim: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="number" placeholder="Peso" value={faseForm.peso} onChange={(e) => setFaseForm({ ...faseForm, peso: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <input type="number" placeholder="Nota Máx" value={faseForm.notaMaxima} onChange={(e) => setFaseForm({ ...faseForm, notaMaxima: e.target.value })}
                                className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]" />
                              <button onClick={() => criarFase(ed.id)}
                                className='bg-[#82181A] text-white font-semibold rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>+ Fase</button>
                            </div>

                            {(!fases[ed.id] || fases[ed.id].length === 0) ? (
                              <p className='text-xs text-neutral-400'>Nenhuma fase cadastrada.</p>
                            ) : (
                              <div className='space-y-2'>
                                {fases[ed.id].map((f, fIdx) => {
                                  const stNome = f.status === 'aberta' ? 'Aberta' : f.status === 'finalizada' ? 'Finalizada' : f.status === 'correcao' ? 'Correção' : 'Pendente'
                                  const stColor = f.status === 'aberta' ? 'bg-green-100 text-green-700' : f.status === 'correcao' ? 'bg-blue-100 text-blue-700' : f.status === 'finalizada' ? 'bg-neutral-200 text-neutral-600' : 'bg-amber-100 text-amber-700'
                                  const faseAnterior = fIdx > 0 ? fases[ed.id][fIdx - 1] : null
                                  const podeAbrir = !faseAnterior || faseAnterior.status === 'finalizada' || faseAnterior.status === 'correcao'
                                  return (
                                    <div key={f.id} className='bg-white rounded-xl border border-neutral-200 p-3 space-y-2'>
                                      <div className='flex items-center justify-between'>
                                        <div>
                                          <p className='font-semibold text-sm'>{f.nome}</p>
                                          <p className='text-[10px] text-neutral-400'>{f.dataInicio?.split('-').reverse().join('/')} — {f.dataFim?.split('-').reverse().join('/')} {f.peso > 0 ? `| Peso ${f.peso} | Máx ${f.notaMaxima}` : ''}</p>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${stColor}`}>{stNome}</span>
                                      </div>
                                      <div className='flex items-center gap-2 pt-1 border-t border-neutral-100 flex-wrap'>
                                        <button onClick={() => router.push(`/admin/questoes?faseId=${f.id}&edicaoId=${ed.id}`)}
                                          className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>Questões</button>
                                        <span className='text-neutral-300'>|</span>
                                        {f.status === 'pendente' && (
                                          <button onClick={() => { if (!podeAbrir) { alert('Finalize a fase anterior primeiro.'); return }; atualizarStatus(ed.id, f.id, 'aberta') }}
                                            className={`text-xs font-semibold cursor-pointer ${podeAbrir ? 'text-green-600 hover:underline' : 'text-neutral-300 cursor-not-allowed'}`}>{podeAbrir ? 'Abrir' : 'Bloqueado'}</button>
                                        )}
                                        {f.status === 'aberta' && (
                                          <><button onClick={() => atualizarStatus(ed.id, f.id, 'pendente')}
                                            className='text-xs font-semibold text-red-600 hover:underline cursor-pointer'>Fechar</button>
                                            <span className='text-neutral-300'>|</span>
                                            <button onClick={() => atualizarStatus(ed.id, f.id, 'finalizada')}
                                              className='text-xs font-semibold text-neutral-600 hover:underline cursor-pointer'>Finalizar</button></>
                                        )}
                                        {f.status === 'finalizada' && (
                                          <button onClick={() => atualizarStatus(ed.id, f.id, 'correcao')}
                                            className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>Abrir para Correção</button>
                                        )}
                                        {f.status === 'correcao' && (
                                          <button onClick={() => atualizarStatus(ed.id, f.id, 'finalizada')}
                                            className='text-xs font-semibold text-red-600 hover:underline cursor-pointer'>Fechar Correção</button>
                                        )}
                                          {f.status === 'pendente' && <><span className='text-neutral-300'>|</span>
                                            <button onClick={() => deletarFase(ed.id, f.id)}
                                              className='text-xs font-semibold text-red-600 hover:underline cursor-pointer'>Excluir</button></>}
                                        </div>
                                        <div className='flex items-center gap-2 pt-2 border-t border-neutral-100'>
                                          <input type="text" placeholder="URL da prova em PDF (Google Drive, etc)" defaultValue={f.provaPdfUrl || ''}
                                            id={`pdf-${f.id}`} className='flex-1 rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]' />
                                          <button onClick={() => {
                                            const url = document.getElementById(`pdf-${f.id}`).value
                                            salvarPdfUrl(ed.id, f.id, url)
                                          }}
                                            className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>Salvar</button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
              </div>
            )}

            {aba === 'equipes' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Equipes</h2>
                </div>
                <div className='pt-4'><TabEquipes /></div>
              </div>
            )}

            {aba === 'usuarios' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Usuários</h2>
                </div>
                <div className='pt-4'><TabUsuarios /></div>
              </div>
            )}

            {aba === 'escolas' && (
              <div>
                <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
                  <h2 className='text-lg font-bold text-[#82181A]'>Escolas</h2>
                </div>
                <div className='pt-4'><TabEscolas /></div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page
