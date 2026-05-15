'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function DocumentosContent() {
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('pendente')
  const [modal, setModal] = useState(null)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else setAutenticado(true)
  }, [router])

  useEffect(() => {
    if (!autenticado) return
    const carregar = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.documento)
          .sort((a, b) => {
            const ordem = { pendente: 0, aprovado: 1, recusado: 2 }
            return (ordem[a.documentoStatus] || 0) - (ordem[b.documentoStatus] || 0)
          })
        setUsuarios(lista)
      } catch {} finally { setCarregando(false) }
    }
    carregar()
  }, [autenticado])

  const handleAprovar = async (uid) => {
    try {
      await updateDoc(doc(db, 'users', uid), { documentoStatus: 'aprovado' })
      setUsuarios((prev) => prev.map((u) => u.id === uid ? { ...u, documentoStatus: 'aprovado' } : u))
      setModal(null)
    } catch {}
  }

  const handleRecusar = async (uid) => {
    try {
      await updateDoc(doc(db, 'users', uid), { documentoStatus: 'recusado', documentoRecusadoMotivo: motivo })
      setUsuarios((prev) => prev.map((u) => u.id === uid ? { ...u, documentoStatus: 'recusado', documentoRecusadoMotivo: motivo } : u))
      setModal(null)
      setMotivo('')
    } catch {}
  }

  const filtrados = usuarios.filter((u) => {
    if (filtro === 'pendente') return u.documentoStatus === 'pendente'
    if (filtro === 'aprovado') return u.documentoStatus === 'aprovado'
    return true
  })

  if (!autenticado) return null

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <h1 className='text-lg font-bold text-[#82181A]'>Documentos de Professores</h1>
            </div>
            <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Voltar</button>
          </div>
        </header>

        <main className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            <div className='flex items-center gap-4'>
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className='rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
                <option value="pendente">Pendentes ({usuarios.filter((u) => u.documentoStatus === 'pendente').length})</option>
                <option value="aprovado">Aprovados ({usuarios.filter((u) => u.documentoStatus === 'aprovado').length})</option>
                <option value="todos">Todos ({usuarios.length})</option>
              </select>
              <p className='text-sm text-neutral-400'>{filtrados.length} professor(es)</p>
            </div>
          </div>

          {carregando ? (
            <p className='text-center text-neutral-400 py-10'>Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className='text-center text-neutral-400 py-10'>Nenhum documento encontrado.</p>
          ) : (
            <div className='space-y-4'>
              {filtrados.map((user) => (
                <div key={user.id} className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1'>
                      <p className='font-bold text-base'>{user.nome} {user.sobrenome}</p>
                      <p className='text-sm text-neutral-500'>{user.email}</p>
                      <div className='flex items-center gap-3 mt-1'>
                        <span className='text-xs bg-neutral-100 px-2 py-0.5 rounded-full'>{user.documentoTipo?.replace('_', ' ') || '—'}</span>
                        {user.documentoStatus === 'pendente' && <span className='text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold'>Pendente</span>}
                        {user.documentoStatus === 'aprovado' && <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold'>Aprovado</span>}
                        {user.documentoStatus === 'recusado' && <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold'>Recusado</span>}
                      </div>
                      {user.documentoRecusadoMotivo && (
                        <p className='text-xs text-red-500 mt-1'>Motivo: {user.documentoRecusadoMotivo}</p>
                      )}
                    </div>

                    <div className='flex flex-col gap-2'>
                      {user.documento && (
                        <button onClick={() => setModal(modal === user.id ? null : user.id)}
                          className='text-xs font-semibold text-blue-600 hover:underline cursor-pointer'>
                          {modal === user.id ? 'Fechar' : 'Ver Documento'}
                        </button>
                      )}
                    </div>
                  </div>

                  {modal === user.id && user.documento && (
                    <div className='mt-4 border-t border-neutral-200 pt-4'>
                      <div className='max-h-[500px] overflow-auto'>
                        {user.documentoMime === 'application/pdf' ? (
                          <embed src={user.documento} type="application/pdf" className='w-full h-[400px] rounded-lg' />
                        ) : (
                          <img src={user.documento} alt="Documento" className='max-w-full rounded-lg' />
                        )}
                      </div>

                      {user.documentoStatus === 'pendente' && (
                        <div className='flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100'>
                          <button onClick={() => handleAprovar(user.id)}
                            className='bg-green-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-green-700 transition-all cursor-pointer'>Aprovar</button>
                          <input type="text" placeholder="Motivo da recusa (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                            className='flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-[#82181A]' />
                          <button onClick={() => handleRecusar(user.id)}
                            className='bg-red-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-red-700 transition-all cursor-pointer'>Recusar</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
      <DocumentosContent />
    </Suspense>
  )
}
