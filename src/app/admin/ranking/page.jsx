'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function RankingContent() {
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoId, setEdicaoId] = useState('')
  const [fases, setFases] = useState([])
  const [equipes, setEquipes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [filtroAprov, setFiltroAprov] = useState('todas')
  const [cotas, setCotas] = useState({ medioPublica: 0, fundPublica: 0, medioParticular: 0, fundParticular: 0 })
  const [aprovarPara, setAprovarPara] = useState('fase2')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); carregarEdicoes() }
  }, [router])

  const carregarEdicoes = async () => {
    const snap = await getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))
    setEdicoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  const carregarDados = async (edId) => {
    if (!edId) return
    setCarregando(true); setMsg('')
    try {
      const fSnap = await getDocs(query(collection(db, 'edicoes', edId, 'fases'), orderBy('dataInicio', 'asc')))
      const fasesData = fSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setFases(fasesData)

      const eSnap = await getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edId)))
      const equipesData = []

      for (const doc_ of eSnap.docs) {
        const team = { id: doc_.id, ...doc_.data() }
        const pontuacao = {}

        for (const fase of fasesData) {
          const rSnap = await getDocs(collection(db, 'equipes', team.id, 'respostas'))
          let ni = 0
          rSnap.docs.forEach((r) => {
            const rData = r.data()
            if (rData.status === 'entregue') {
              if (r.id === 'tarefa') {
                ni += rData.pontuacao || 0
              } else {
                ni += rData.peso || 0
              }
            }
          })
          const ni_max = fase.notaMaxima || 1
          const pi = fase.peso || 0
          const di = ni_max > 0 ? (ni / ni_max) * pi : 0
          pontuacao[fase.id] = { ni, di }
        }

        const df = Object.values(pontuacao).reduce((acc, p) => acc + p.di, 0)
        equipesData.push({ ...team, pontuacao, df })
      }

      equipesData.sort((a, b) => b.df - a.df)
      setEquipes(equipesData)
    } catch (e) { setMsg('Erro: ' + e.message) }
    finally { setCarregando(false) }
  }

  useEffect(() => { if (edicaoId) carregarDados(edicaoId) }, [edicaoId])

  const getModalidade = (t) => {
    if (t === 'fundamental' || t === 'eja_fundamental') return 'fundamental'
    if (t === 'medio' || t === 'eja_medio') return 'medio'
    return t
  }

  const getRede = (t) => {
    if (t === 'publica' || t === 'federal' || t === 'estadual' || t === 'municipal') return 'publica'
    return 'particular'
  }

  const equipesFiltradas = equipes.filter((eq) => {
    const mod = getModalidade(eq.modalidade)
    const rede = getRede(eq.tipoEscola)

    if (filtro === 'medio_total' && mod !== 'medio') return false
    if (filtro === 'fund_total' && mod !== 'fundamental') return false
    if (filtro === 'medio_publica' && (mod !== 'medio' || rede !== 'publica')) return false
    if (filtro === 'fund_publica' && (mod !== 'fundamental' || rede !== 'publica')) return false
    if (filtro === 'medio_particular' && (mod !== 'medio' || rede !== 'particular')) return false
    if (filtro === 'fund_particular' && (mod !== 'fundamental' || rede !== 'particular')) return false

    if (filtroAprov === 'aprovados_f2' && (!eq.aprovadoAte || eq.aprovadoAte === 'fase1')) return false
    if (filtroAprov === 'aprovados_f3' && (eq.aprovadoAte !== 'fase3' && eq.aprovadoAte !== 'fase4')) return false
    if (filtroAprov === 'aprovados_f4' && eq.aprovadoAte !== 'fase4') return false

    return true
  })

  const handleConfirmar = async () => {
    if (!aprovarPara) { setMsg('Selecione para qual fase aprovar.'); return }
    setMsg('')

    const faseOrigem = aprovarPara === 'fase2' ? fases[0]?.id : aprovarPara === 'fase3' ? fases[1]?.id : fases[2]?.id
    if (!faseOrigem) { setMsg('Fase de origem não encontrada.'); return }

    const categorias = [
      { key: 'medio_publica', nome: 'Médio (Pública)', mod: 'medio', rede: 'publica' },
      { key: 'fund_publica', nome: 'Fundamental (Pública)', mod: 'fundamental', rede: 'publica' },
      { key: 'medio_particular', nome: 'Médio (Particular)', mod: 'medio', rede: 'particular' },
      { key: 'fund_particular', nome: 'Fundamental (Particular)', mod: 'fundamental', rede: 'particular' },
    ]

    let aprovados = []

    for (const cat of categorias) {
      const vaga = parseInt(cotas[cat.key]) || 0
      if (vaga <= 0) continue

      const candidatos = equipes
        .filter((eq) => getModalidade(eq.modalidade) === cat.mod && getRede(eq.tipoEscola) === cat.rede)
        .sort((a, b) => (b.pontuacao?.[faseOrigem]?.di || 0) - (a.pontuacao?.[faseOrigem]?.di || 0))
        .slice(0, vaga)

      aprovados.push(...candidatos)
    }

    for (const eq of aprovados) {
      try {
        await updateDoc(doc(db, 'equipes', eq.id), { aprovadoAte: aprovarPara })
      } catch {}
    }

    setMsg(`${aprovados.length} equipe(s) aprovada(s) para ${aprovarPara.toUpperCase()}!`)
    carregarDados(edicaoId)
  }

  if (!autenticado) return null

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <h1 className='text-lg font-bold text-[#82181A]'>Ranking & Aprovação</h1>
            </div>
            <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Voltar</button>
          </div>
        </header>

        <main className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            <label className='text-sm font-semibold text-neutral-500 mb-2 block'>Selecione a Edição</label>
            <select value={edicaoId} onChange={(e) => setEdicaoId(e.target.value)} className='w-full md:w-96 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
              <option value="">— Selecione —</option>
              {edicoes.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
            </select>
          </div>

          {edicaoId && (
            <>
              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Filtros</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-xs text-neutral-500 mb-1 block'>Categoria</label>
                    <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
                      <option value="todos">Todos</option>
                      <option value="medio_total">Médio Total</option>
                      <option value="fund_total">Fundamental Total</option>
                      <option value="medio_publica">Médio (Pública)</option>
                      <option value="fund_publica">Fundamental (Pública)</option>
                      <option value="medio_particular">Médio (Particular)</option>
                      <option value="fund_particular">Fundamental (Particular)</option>
                    </select>
                  </div>
                  <div>
                    <label className='text-xs text-neutral-500 mb-1 block'>Fase Atual</label>
                    <select value={filtroAprov} onChange={(e) => setFiltroAprov(e.target.value)} className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
                      <option value="todas">Todas as Equipes</option>
                      <option value="aprovados_f2">Aprovados para Fase 2</option>
                      <option value="aprovados_f3">Aprovados para Fase 3</option>
                      <option value="aprovados_f4">Aprovados para Fase 4</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Aprovação</h2>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {[
                    { key: 'medio_publica', label: 'Médio (Pública)' },
                    { key: 'fund_publica', label: 'Fundamental (Pública)' },
                    { key: 'medio_particular', label: 'Médio (Particular)' },
                    { key: 'fund_particular', label: 'Fundamental (Particular)' },
                  ].map((c) => (
                    <div key={c.key}>
                      <label className='text-xs text-neutral-500 mb-1 block'>{c.label}</label>
                      <input type="number" min="0" value={cotas[c.key]} onChange={(e) => setCotas({ ...cotas, [c.key]: e.target.value })}
                        className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' placeholder="0" />
                    </div>
                  ))}
                </div>
                <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-end'>
                  <div>
                    <label className='text-xs text-neutral-500 mb-1 block'>Aprovar para:</label>
                    <select value={aprovarPara} onChange={(e) => setAprovarPara(e.target.value)} className='rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
                      <option value="fase2">Fase 2 (baseado no Df da Fase 1)</option>
                      <option value="fase3">Fase 3 (baseado no Df da Fase 2)</option>
                      <option value="fase4">Fase 4 (baseado no Df da Fase 3)</option>
                    </select>
                  </div>
                  <button onClick={handleConfirmar} className='bg-[#82181A] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>Confirmar Aprovação</button>
                </div>
                {msg && <p className='text-sm font-medium text-green-600'>{msg}</p>}
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden'>
                <div className='p-6 border-b border-neutral-100'>
                  <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Equipes ({equipesFiltradas.length})</h2>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
                        <th className='text-left px-4 py-3 font-medium'>#</th>
                        <th className='text-left px-4 py-3 font-medium'>Equipe</th>
                        <th className='text-left px-4 py-3 font-medium'>Escola</th>
                        <th className='text-left px-4 py-3 font-medium'>Modalidade</th>
                        <th className='text-left px-4 py-3 font-medium'>Rede</th>
                        {fases.map((f) => <th key={f.id} className='text-center px-2 py-3 font-medium'>{f.nome}</th>)}
                        <th className='text-center px-4 py-3 font-medium text-[#82181A]'>Df</th>
                        <th className='text-center px-4 py-3 font-medium'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carregando ? (
                        <tr><td colSpan={8 + fases.length} className='text-center py-10 text-neutral-400'>Carregando...</td></tr>
                      ) : equipesFiltradas.length === 0 ? (
                        <tr><td colSpan={8 + fases.length} className='text-center py-10 text-neutral-400'>Nenhuma equipe encontrada.</td></tr>
                      ) : equipesFiltradas.map((eq, idx) => (
                        <tr key={eq.id} className={`border-t border-neutral-100 ${eq.aprovadoAte ? 'bg-green-50/50' : ''}`}>
                          <td className='px-4 py-3 font-bold text-neutral-400'>{idx + 1}</td>
                          <td className='px-4 py-3 font-semibold'>{eq.nome}</td>
                          <td className='px-4 py-3 text-neutral-500'>{eq.escola}</td>
                          <td className='px-4 py-3 capitalize'>{eq.modalidade?.replace('_', ' ')}</td>
                          <td className='px-4 py-3 capitalize'>{eq.tipoEscola}</td>
                          {fases.map((f) => (
                            <td key={f.id} className='text-center px-2 py-3'>{eq.pontuacao?.[f.id]?.di?.toFixed(1) || '—'}</td>
                          ))}
                          <td className='text-center px-4 py-3 font-bold text-[#82181A]'>{eq.df?.toFixed(1)}</td>
                          <td className='text-center px-4 py-3'>
                            {eq.aprovadoAte ? (
                              <span className='text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold'>{eq.aprovadoAte.toUpperCase()}</span>
                            ) : (
                              <span className='text-[10px] bg-neutral-100 text-neutral-400 px-2 py-1 rounded-full font-semibold'>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <RankingContent />
    </Suspense>
  )
}
