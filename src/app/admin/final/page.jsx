'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, orderBy, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

function FinalContent() {
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoId, setEdicaoId] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [publicado, setPublicado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [publicando, setPublicando] = useState(false)
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
      const ed = edicoes.find(e => e.id === edId)
      setManualUrl(ed?.manualFinalistaUrl || '')
      setPublicado(ed?.resultadoFinalPublicado === true)
      const eSnap = await getDocs(query(
        collection(db, 'equipes'),
        where('edicaoId', '==', edId),
        where('aprovadoAte', '==', 'fase_final')
      ))
      const equipesData = eSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      equipesData.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
      setEquipes(equipesData)
    } catch (e) {
      setMsg('Erro ao carregar finalistas: ' + e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { if (edicaoId) carregarDados(edicaoId) }, [edicaoId])

  const handleUploadManual = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !edicaoId) return
    if (file.type !== 'application/pdf') { setMsg('Envie um arquivo PDF.'); return }
    setEnviando(true)
    setMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'dhpb/manuais')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      )
      if (!res.ok) throw new Error('Falha no upload')
      const data = await res.json()
      await updateDoc(doc(db, 'edicoes', edicaoId), { manualFinalistaUrl: data.secure_url })
      setManualUrl(data.secure_url)
      setMsg('Manual do finalista atualizado com sucesso!')
    } catch (err) {
      setMsg('Erro ao enviar o manual: ' + (err?.message || 'desconhecido'))
    } finally {
      setEnviando(false)
    }
  }

  const handlePublicar = async (valor) => {
    if (!edicaoId || publicando) return
    setPublicando(true)
    setMsg('')
    try {
      await updateDoc(doc(db, 'edicoes', edicaoId), { resultadoFinalPublicado: valor })
      setPublicado(valor)
      setEdicoes((prev) => prev.map((ed) => ed.id === edicaoId ? { ...ed, resultadoFinalPublicado: valor } : ed))
      setMsg(valor ? 'Resultado publicado. As equipes passam a ver o encaminhamento.' : 'Resultado oculto. Nenhuma equipe vê o encaminhamento.')
    } catch (err) {
      setMsg('Erro ao atualizar a publicação: ' + (err?.message || 'desconhecido'))
    } finally {
      setPublicando(false)
    }
  }

  const confirmadas = equipes.filter(eq => eq.presencaFinalConfirmada).length

  if (!autenticado) return null

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <h1 className='text-lg font-bold text-[#82181A]'>Final — Manual e Presenças</h1>
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
              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-3'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Publicação do resultado</h2>
                <p className='text-sm text-neutral-600'>
                  {publicado ? 'As equipes estão vendo o encaminhamento da final.' : 'Oculto. Nenhuma equipe vê FINALISTA nem a mensagem de não classificação.'}
                </p>
                <button
                  type='button'
                  onClick={() => handlePublicar(!publicado)}
                  disabled={publicando}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 ${publicado ? 'border border-[#82181A] text-[#82181A] hover:bg-red-50' : 'bg-[#82181A] text-white hover:bg-[#631214]'}`}
                >
                  {publicando ? 'Salvando...' : publicado ? 'Ocultar resultado' : 'Publicar resultado da final'}
                </button>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
                <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Manual do finalista (PDF)</h2>
                {manualUrl && (
                  <p className='text-sm text-neutral-600'>
                    Manual atual:{' '}
                    <a href={manualUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 font-semibold hover:underline'>abrir PDF</a>
                  </p>
                )}
                <label className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${enviando ? 'bg-neutral-200 text-neutral-400' : 'bg-[#82181A] text-white hover:bg-[#631214]'}`}>
                  {enviando ? 'Enviando...' : manualUrl ? 'Substituir manual' : 'Enviar manual'}
                  <input type="file" accept="application/pdf" onChange={handleUploadManual} disabled={enviando} className='hidden' />
                </label>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden'>
                <div className='p-6 border-b border-neutral-100 flex items-center justify-between'>
                  <h2 className='text-sm font-bold text-[#82181A] uppercase tracking-wide'>Finalistas ({equipes.length})</h2>
                  <span className='text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold'>{confirmadas} com presença confirmada</span>
                </div>
                {msg && <p className='px-6 py-3 text-sm font-medium text-neutral-700'>{msg}</p>}
                {carregando ? (
                  <p className='text-center text-neutral-400 py-10'>Carregando...</p>
                ) : equipes.length === 0 ? (
                  <p className='text-center text-neutral-400 py-10'>Nenhuma equipe finalista nesta edição.</p>
                ) : (
                  <div className='divide-y divide-neutral-100'>
                    {equipes.map((eq) => (
                      <div key={eq.id} className='p-6'>
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <p className='font-bold text-base'>{eq.nome}</p>
                            <p className='text-sm text-neutral-500'>{eq.escola}</p>
                          </div>
                          {eq.presencaFinalConfirmada ? (
                            <span className='text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Presença confirmada</span>
                          ) : (
                            <span className='text-xs bg-neutral-100 text-neutral-400 px-3 py-1 rounded-full font-semibold whitespace-nowrap'>Pendente</span>
                          )}
                        </div>
                        <ul className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-neutral-600'>
                          {(eq.membros || []).filter(m => m.status === 'ativo').map((m, i) => (
                            <li key={m.uid || i}>
                              {m.nome} <span className='text-neutral-400'>— {m.papel?.replace(/_/g, ' ')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
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
      <FinalContent />
    </Suspense>
  )
}
