'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, orderBy, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { compareRanking, gerarPreview, getRede } from '@/lib/eliminacaoFases'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function formatNota(valor) {
  if (valor === undefined || valor === null) return '—'
  return Number(valor).toFixed(2)
}

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
  const [aprovarPara, setAprovarPara] = useState('fase2')
  const [minimo, setMinimo] = useState(25)
  const [vagasAC, setVagasAC] = useState(125)
  const [vagasVR, setVagasVR] = useState(125)
  const [vagasTotais, setVagasTotais] = useState(120)
  const [vagasACInicial, setVagasACInicial] = useState(60)
  const [minimoPublicas, setMinimoPublicas] = useState(60)
  const [preview, setPreview] = useState([])
  const [marcadas, setMarcadas] = useState({})
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
    setCarregando(true); setMsg(''); setPreview([]); setMarcadas({})
    try {
      const fSnap = await getDocs(query(collection(db, 'edicoes', edId, 'fases'), orderBy('dataInicio', 'asc')))
      const fasesData = fSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setFases(fasesData)

      const eSnap = await getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edId)))
      const equipesData = eSnap.docs.map((doc_) => {
        const team = { id: doc_.id, ...doc_.data() }
        const pontuacao = {}
        for (const fase of fasesData) {
          const p = team.pontuacoes?.[fase.id]
          pontuacao[fase.id] = { ni: p?.ni || 0, di: p?.di || 0 }
        }
        return { ...team, pontuacao, df: team.df || 0 }
      })

      const faseIds = fasesData.map((f) => f.id)
      equipesData.sort((a, b) => compareRanking(a, b, faseIds))
      setEquipes(equipesData)
    } catch (e) { setMsg('Erro: ' + e.message) }
    finally { setCarregando(false) }
  }

  useEffect(() => { if (edicaoId) carregarDados(edicaoId) }, [edicaoId])

  useEffect(() => {
    if (aprovarPara === 'fase2') setMinimo(25)
    if (aprovarPara === 'fase3') setMinimo(50)
    setPreview([])
    setMarcadas({})
    setMsg('')
  }, [aprovarPara])

  const getModalidade = (t) => {
    if (t === 'fundamental' || t === 'eja_fundamental') return 'fundamental'
    if (t === 'medio' || t === 'eja_medio') return 'medio'
    return t
  }

  const faseIds = fases.map((f) => f.id)
  const previewPorId = Object.fromEntries(preview.map((eq) => [eq.id, eq]))
  const listaBase = preview.length > 0
    ? equipes.map((eq) => (previewPorId[eq.id] ? { ...eq, ...previewPorId[eq.id] } : eq))
    : equipes

  const equipesFiltradas = listaBase.filter((eq) => {
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
    if (filtroAprov === 'aprovados_f4' && eq.aprovadoAte !== 'fase4' && eq.aprovadoAte !== 'fase_final') return false
    if (filtroAprov === 'aprovados_final' && eq.aprovadoAte !== 'fase_final') return false

    return true
  })

  const handlePreview = () => {
    setMsg('')
    if (!aprovarPara) { setMsg('Selecione a transição.'); return }
    if (aprovarPara === 'fase2' && !faseIds[0]) { setMsg('Fase 1 não encontrada.'); return }
    if (aprovarPara === 'fase3' && !faseIds[1]) { setMsg('Fase 2 não encontrada.'); return }
    if ((aprovarPara === 'fase4' || aprovarPara === 'fase_final') && faseIds.length < 3) {
      setMsg('Cadastre as fases da edição (ordem por data de início) antes de gerar o preview.')
      return
    }

    const lista = gerarPreview(equipes, aprovarPara, {
      faseIds,
      minimo: parseFloat(minimo) || 0,
      vagasAC: parseInt(vagasAC, 10) || 0,
      vagasVR: parseInt(vagasVR, 10) || 0,
      vagasTotais: parseInt(vagasTotais, 10) || 0,
      vagasACInicial: parseInt(vagasACInicial, 10) || 0,
      minimoPublicas: parseInt(minimoPublicas, 10) || 0,
    })
    lista.sort((a, b) => compareRanking(a, b, faseIds))
    setPreview(lista)
    const next = {}
    lista.forEach((eq) => { if (eq.status === 'aprovar') next[eq.id] = true })
    setMarcadas(next)
    const nAprovar = lista.filter((eq) => eq.status === 'aprovar').length
    const nJa = lista.filter((eq) => eq.status === 'ja_liberada').length
    const nNao = lista.filter((eq) => eq.status === 'nao_passa').length
    setMsg(`Preview: ${nAprovar} a aprovar, ${nJa} já liberadas, ${nNao} não passam. Confira a tabela antes de gravar.`)
  }

  const handleConfirmar = async () => {
    if (preview.length === 0) { setMsg('Gere o preview antes de confirmar.'); return }
    const aprovados = preview.filter((eq) => eq.status === 'aprovar' && marcadas[eq.id])
    if (aprovados.length === 0) { setMsg('Nenhuma equipe marcada para aprovar.'); return }
    setMsg('')

    for (let i = 0; i < aprovados.length; i += 400) {
      const batch = writeBatch(db)
      const chunk = aprovados.slice(i, i + 400)
      chunk.forEach((eq) => batch.update(doc(db, 'equipes', eq.id), { aprovadoAte: aprovarPara }))
      await batch.commit()
    }

    setMsg(`${aprovados.length} equipe(s) aprovada(s) para ${aprovarPara.toUpperCase()}!`)
    setPreview([])
    setMarcadas({})
    carregarDados(edicaoId)
  }

  const toggleMarcada = (id) => {
    setMarcadas((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const statusPreview = (eq) => {
    const item = previewPorId[eq.id]
    if (!item) return null
    if (item.status === 'aprovar') return { texto: item.motivo ? `Aprovar (${item.motivo})` : 'Aprovar', classe: 'bg-green-100 text-green-700' }
    if (item.status === 'ja_liberada') return { texto: 'Já liberada', classe: 'bg-blue-100 text-blue-700' }
    return { texto: 'Não passa', classe: 'bg-red-50 text-red-600' }
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
                      <option value="aprovados_final">Aprovados para Fase Final</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Aprovação por fases</h2>
                <p className='text-xs text-neutral-500'>Gere o preview, confira quem passa e só então grave a liberação. Empate na linha de corte avança em conjunto. Desempate: Df, depois N3, N2, N1.</p>
                <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-end'>
                  <div>
                    <label className='text-xs text-neutral-500 mb-1 block'>Transição</label>
                    <select value={aprovarPara} onChange={(e) => setAprovarPara(e.target.value)} className='rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
                      <option value="fase2">Fase 1 → 2 (N1 mínimo)</option>
                      <option value="fase3">Fase 2 → 3 (N2 mínimo)</option>
                      <option value="fase4">Fase 3 → 4 (125 AC + 125 pública)</option>
                      <option value="fase_final">Fase 4 → Final (até 120, mínimo 60 públicas)</option>
                    </select>
                  </div>
                </div>

                {(aprovarPara === 'fase2' || aprovarPara === 'fase3') && (
                  <div className='max-w-xs'>
                    <label className='text-xs text-neutral-500 mb-1 block'>Nota bruta mínima</label>
                    <input type="number" min="0" step="0.01" value={minimo} onChange={(e) => setMinimo(e.target.value)}
                      className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                  </div>
                )}

                {aprovarPara === 'fase4' && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div>
                      <label className='text-xs text-neutral-500 mb-1 block'>Vagas ampla concorrência</label>
                      <input type="number" min="0" value={vagasAC} onChange={(e) => setVagasAC(e.target.value)}
                        className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                    </div>
                    <div>
                      <label className='text-xs text-neutral-500 mb-1 block'>Vagas reservadas (pública)</label>
                      <input type="number" min="0" value={vagasVR} onChange={(e) => setVagasVR(e.target.value)}
                        className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                    </div>
                  </div>
                )}

                {aprovarPara === 'fase_final' && (
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    <div>
                      <label className='text-xs text-neutral-500 mb-1 block'>Vagas totais</label>
                      <input type="number" min="0" value={vagasTotais} onChange={(e) => setVagasTotais(e.target.value)}
                        className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                    </div>
                    <div>
                      <label className='text-xs text-neutral-500 mb-1 block'>Bloco inicial (ranking geral)</label>
                      <input type="number" min="0" value={vagasACInicial} onChange={(e) => setVagasACInicial(e.target.value)}
                        className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                    </div>
                    <div>
                      <label className='text-xs text-neutral-500 mb-1 block'>Mínimo de públicas</label>
                      <input type="number" min="0" value={minimoPublicas} onChange={(e) => setMinimoPublicas(e.target.value)}
                        className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]' />
                    </div>
                  </div>
                )}

                <div className='flex flex-col sm:flex-row gap-3'>
                  <button onClick={handlePreview} className='border border-[#82181A] text-[#82181A] font-semibold px-8 py-3 rounded-xl hover:bg-red-50 transition-all cursor-pointer'>Gerar preview</button>
                  <button onClick={handleConfirmar} className='bg-[#82181A] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#631214] transition-all cursor-pointer'>Confirmar aprovação</button>
                </div>
                {msg && <p className='text-sm font-medium text-green-700'>{msg}</p>}
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden'>
                <div className='p-6 border-b border-neutral-100'>
                  <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Equipes ({equipesFiltradas.length})</h2>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
                        {preview.length > 0 && <th className='text-center px-2 py-3 font-medium'>OK</th>}
                        <th className='text-left px-4 py-3 font-medium'>#</th>
                        <th className='text-left px-4 py-3 font-medium'>Equipe</th>
                        <th className='text-left px-4 py-3 font-medium'>Escola</th>
                        <th className='text-left px-4 py-3 font-medium'>Modalidade</th>
                        <th className='text-left px-4 py-3 font-medium'>Rede</th>
                        {fases.map((f) => <th key={f.id} className='text-center px-2 py-3 font-medium'>{f.nome}<span className='block font-normal normal-case text-neutral-400'>Ni / Di</span></th>)}
                        <th className='text-center px-4 py-3 font-medium text-[#82181A]'>Df</th>
                        <th className='text-center px-4 py-3 font-medium'>Status</th>
                        {preview.length > 0 && <th className='text-center px-4 py-3 font-medium'>Preview</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {carregando ? (
                        <tr><td colSpan={9 + fases.length} className='text-center py-10 text-neutral-400'>Carregando...</td></tr>
                      ) : equipesFiltradas.length === 0 ? (
                        <tr><td colSpan={9 + fases.length} className='text-center py-10 text-neutral-400'>Nenhuma equipe encontrada.</td></tr>
                      ) : equipesFiltradas.map((eq, idx) => {
                        const previewStatus = statusPreview(eq)
                        const rowClass = eq.status === 'aprovar' ? 'bg-green-50/70' : eq.status === 'nao_passa' ? 'bg-red-50/40' : eq.aprovadoAte ? 'bg-green-50/50' : ''
                        return (
                        <tr key={eq.id} className={`border-t border-neutral-100 ${rowClass}`}>
                          {preview.length > 0 && (
                            <td className='text-center px-2 py-3'>
                              {eq.status === 'aprovar' ? (
                                <input type="checkbox" checked={!!marcadas[eq.id]} onChange={() => toggleMarcada(eq.id)} />
                              ) : null}
                            </td>
                          )}
                          <td className='px-4 py-3 font-bold text-neutral-400'>{idx + 1}</td>
                          <td className='px-4 py-3 font-semibold'>{eq.nome}</td>
                          <td className='px-4 py-3 text-neutral-500'>{eq.escola}</td>
                          <td className='px-4 py-3 capitalize'>{eq.modalidade?.replace('_', ' ')}</td>
                          <td className='px-4 py-3 capitalize'>{eq.tipoEscola}</td>
                          {fases.map((f) => (
                            <td key={f.id} className='text-center px-2 py-3 text-xs'>
                              {formatNota(eq.pontuacao?.[f.id]?.ni)} / {formatNota(eq.pontuacao?.[f.id]?.di)}
                            </td>
                          ))}
                          <td className='text-center px-4 py-3 font-bold text-[#82181A]'>{formatNota(eq.df)}</td>
                          <td className='text-center px-4 py-3'>
                            {eq.aprovadoAte ? (
                              <span className='text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold'>{eq.aprovadoAte.toUpperCase()}</span>
                            ) : (
                              <span className='text-[10px] bg-neutral-100 text-neutral-400 px-2 py-1 rounded-full font-semibold'>—</span>
                            )}
                          </td>
                          {preview.length > 0 && (
                            <td className='text-center px-4 py-3'>
                              {previewStatus && (
                                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${previewStatus.classe}`}>{previewStatus.texto}</span>
                              )}
                            </td>
                          )}
                        </tr>
                        )
                      })}
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
