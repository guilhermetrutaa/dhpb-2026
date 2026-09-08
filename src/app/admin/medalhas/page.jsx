'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, orderBy, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

function MedalhasContent() {
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoId, setEdicaoId] = useState('')
  const [equipes, setEquipes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); carregarEdicoes() }
  }, [router])

  const carregarEdicoes = async () => {
    const snap = await getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))
    setEdicoes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const carregarDados = async (edId) => {
    if (!edId) return
    setCarregando(true)
    setMsg('')
    try {
      const eSnap = await getDocs(query(
        collection(db, 'equipes'), 
        where('edicaoId', '==', edId),
        where('aprovadoAte', '==', 'fase_final')
      ))
      const equipesData = eSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Ordenar por ordem alfabetica
      equipesData.sort((a, b) => a.nome.localeCompare(b.nome))
      setEquipes(equipesData)
    } catch (e) {
      setMsg('Erro ao carregar finalistas: ' + e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { if (edicaoId) carregarDados(edicaoId) }, [edicaoId])

  const handleUpdatePremiacao = async (equipeId, premiacao) => {
    try {
      await updateDoc(doc(db, 'equipes', equipeId), { premiacao })
      setEquipes(prev => prev.map(eq => eq.id === equipeId ? { ...eq, premiacao } : eq))
      setMsg('Premiação salva com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } catch (error) {
      setMsg('Erro ao salvar premiação.')
    }
  }

  if (!autenticado) return null

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <h1 className='text-lg font-bold text-[#82181A]'>Classificação Final / Medalhas</h1>
            </div>
            <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Voltar</button>
          </div>
        </header>

        <main className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            <label className='text-sm font-semibold text-neutral-500 mb-2 block'>Selecione a Edição para ver os Finalistas</label>
            <select value={edicaoId} onChange={(e) => setEdicaoId(e.target.value)} className='w-full md:w-96 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
              <option value="">— Selecione —</option>
              {edicoes.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
            </select>
          </div>

          {edicaoId && (
            <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden'>
              <div className='p-6 border-b border-neutral-100 flex justify-between items-center'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Equipes Finalistas ({equipes.length})</h2>
                {msg && <span className="text-green-600 font-medium text-sm">{msg}</span>}
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-neutral-50 text-neutral-500 uppercase text-xs'>
                      <th className='text-left px-4 py-3 font-medium'>#</th>
                      <th className='text-left px-4 py-3 font-medium'>Equipe</th>
                      <th className='text-left px-4 py-3 font-medium'>Escola</th>
                      <th className='text-left px-4 py-3 font-medium'>Modalidade</th>
                      <th className='text-left px-4 py-3 font-medium w-64'>Premiação / Certificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregando ? (
                      <tr><td colSpan={5} className='text-center py-10 text-neutral-400'>Carregando...</td></tr>
                    ) : equipes.length === 0 ? (
                      <tr><td colSpan={5} className='text-center py-10 text-neutral-400'>Nenhum finalista encontrado. Vá no Ranking e aprove equipes para a Fase Final.</td></tr>
                    ) : equipes.map((eq, idx) => (
                      <tr key={eq.id} className='border-t border-neutral-100'>
                        <td className='px-4 py-3 font-bold text-neutral-400'>{idx + 1}</td>
                        <td className='px-4 py-3 font-semibold'>{eq.nome}</td>
                        <td className='px-4 py-3 text-neutral-500'>{eq.escola}</td>
                        <td className='px-4 py-3 capitalize'>{eq.modalidade?.replace('_', ' ')}</td>
                        <td className='px-4 py-3'>
                          <select 
                            value={eq.premiacao || 'pendente'} 
                            onChange={(e) => handleUpdatePremiacao(eq.id, e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition-colors
                              ${eq.premiacao === 'ouro' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 
                                eq.premiacao === 'prata' ? 'bg-gray-200 border-gray-400 text-gray-800' :
                                eq.premiacao === 'bronze' ? 'bg-orange-100 border-orange-400 text-orange-800' :
                                eq.premiacao === 'honrosa' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                                eq.premiacao === 'finalista' ? 'bg-green-50 border-green-300 text-green-700' :
                                'bg-white border-neutral-300 text-neutral-500'
                              }
                            `}
                          >
                            <option value="pendente">⏳ Pendente (Sem certificado)</option>
                            <option value="finalista">Apenas Finalista (40h)</option>
                            <option value="honrosa">🏅 Menção Honrosa</option>
                            <option value="bronze">🥉 Medalha de Bronze</option>
                            <option value="prata">🥈 Medalha de Prata</option>
                            <option value="ouro">🥇 Medalha de Ouro</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <MedalhasContent />
    </Suspense>
  )
}
