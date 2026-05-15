'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function SalaEquipeContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipeId = searchParams.get('equipeId')

  const [equipe, setEquipe] = useState(null)
  const [edicaoNome, setEdicaoNome] = useState('')
  const [fases, setFases] = useState([])
  const [carregando, setCarregando] = useState(true)
  const membrosAtivos = equipe?.membros?.filter((m) => m.status === 'ativo') || []

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!authUser || !equipeId) return

    const carregar = async () => {
      try {
        const eSnap = await getDoc(doc(db, 'equipes', equipeId))
        if (!eSnap.exists()) { setCarregando(false); return }

        const team = { id: eSnap.id, ...eSnap.data() }
        setEquipe(team)

        const edSnap = await getDoc(doc(db, 'edicoes', team.edicaoId))
        if (edSnap.exists()) setEdicaoNome(edSnap.data().nome || '')

        const unsub = onSnapshot(
          query(collection(db, 'edicoes', team.edicaoId, 'fases'), orderBy('dataInicio', 'asc')),
          (snap) => {
            setFases(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
            setCarregando(false)
          },
          () => { setCarregando(false) }
        )
        return () => unsub()
      } catch {} finally { setCarregando(false) }
    }

    carregar()
  }, [authUser, equipeId])

  if (loading || !authUser) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000]'>
        <header className='flex flex-col lg:flex-row justify-around items-center pt-5 pb-5 gap-6 px-4'>
          <div><Image src="/logo.svg" width={100} height={100} alt="Logo" /></div>
          <nav>
            <ul className='flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base'>
              <li className='hover:text-[#82181A] hover:underline transition-colors'>
                <a href={userData?.tipo === 'professor' ? '/home-professor' : '/home'}>Home</a>
              </li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/calendario">Calendário</a></li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/contato">Contato</a></li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/regulamento">Regulamento</a></li>
            </ul>
          </nav>
          <button onClick={logout} className='border-[#82181A] border-[3px] text-[#82181A] font-medium px-6 py-2 hover:bg-[#82181A] hover:text-[#fff] transition-colors cursor-pointer whitespace-nowrap'>Sair</button>
        </header>

        <main style={{ backgroundImage: 'url(/bg-dhpb.svg)' }} className='w-full min-h-screen bg-cover bg-center px-4 py-8'>
          <div className='max-w-5xl mx-auto'>
            {carregando ? (
              <div className='flex items-center justify-center py-20'>
                <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-10 py-6'>
                  <p className="text-[#82181A] text-lg font-medium">Carregando...</p>
                </div>
              </div>
            ) : !equipe ? (
              <div className='flex items-center justify-center py-20'>
                <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-10 py-6'>
                  <p className="text-[#82181A] text-lg font-medium">Equipe não encontrada.</p>
                </div>
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Cabeçalho */}
                <div className='bg-white rounded-2xl shadow-md p-6 md:p-8'>
                  <p className='text-sm text-neutral-400 font-medium mb-1'>{edicaoNome || 'Edição'}</p>
                  <h1 className='text-xl md:text-2xl font-bold text-[#82181A]'>
                    Sala de Prova — {equipe.nome}
                  </h1>
                  <p className='text-sm text-neutral-500 mt-2'>
                    {equipe.escola} · {membrosAtivos?.length || 0} membro(s)
                  </p>
                </div>

                {/* Fases */}
                <div>
                  <h2 className='text-sm font-semibold text-neutral-500 mb-3 uppercase tracking-wide'>Fases</h2>

                  {fases.length === 0 ? (
                    <div className='bg-white rounded-2xl shadow-md p-10 text-center'>
                      <p className='text-neutral-500'>Nenhuma fase cadastrada para esta edição.</p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                      {fases.map((fase, idx) => {
                        const st = fase.status || 'pendente'

                        const statusLabel = {
                          aberta: { text: 'Aberta', bg: 'bg-green-100 text-green-700' },
                          correcao: { text: 'Correção', bg: 'bg-blue-100 text-blue-700' },
                          finalizada: { text: 'Finalizada', bg: 'bg-neutral-200 text-neutral-500' },
                          pendente: { text: 'Pendente', bg: 'bg-amber-100 text-amber-700' },
                          fechada: { text: 'Pendente', bg: 'bg-amber-100 text-amber-700' },
                        }[st] || { text: st, bg: 'bg-neutral-100 text-neutral-500' }

                        const faseNum = idx + 1
                        const nivelAprov = `fase${faseNum}`
                        const aprovado = faseNum === 1 || (equipe?.aprovadoAte && (faseNum === 2 || ['fase2', 'fase3', 'fase4'].includes(equipe.aprovadoAte)) && nivelAprov <= (equipe.aprovadoAte || 'fase1'))
                        const aprovNiveis = ['fase1', 'fase2', 'fase3', 'fase4']
                        const acessivel = (st === 'aberta' || st === 'correcao') && (faseNum === 1 || (equipe?.aprovadoAte && aprovNiveis.indexOf(equipe.aprovadoAte) >= idx))

                        return (
                          <div
                            key={fase.id}
                            className={`bg-white rounded-2xl shadow-md overflow-hidden ${acessivel ? 'ring-2 ring-[#82181A]' : 'opacity-60'}`}
                          >
                            <div className='p-5'>
                              <div className='flex items-center justify-between mb-3'>
                                <span className='text-xs text-neutral-400 font-medium'>Status:</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusLabel.bg}`}>
                                  {statusLabel.text}
                                </span>
                              </div>
                              <h3 className='text-base font-bold text-[#82181A] mb-3'>{fase.nome}</h3>
                              <div className='text-sm space-y-1'>
                                <p><span className='text-neutral-400'>Início:</span> <span className='font-medium'>{fase.dataInicio?.split('-').reverse().join('/')}</span></p>
                                <p><span className='text-neutral-400'>Fim:</span> <span className='font-medium'>{fase.dataFim?.split('-').reverse().join('/')}</span></p>
                              </div>
                            </div>
                            {acessivel && (
                              <button onClick={() => router.push(`/resumo-fase?faseId=${fase.id}&edicaoId=${equipe.edicaoId}&equipeId=${equipe.id}`)}
                              className='w-full bg-[#82181A] text-white text-sm font-semibold py-2.5 hover:bg-[#631214] transition-colors cursor-pointer'>
                                Acessar Prova
                              </button>
                            )}
                            {st === 'finalizada' && (
                              <div className='w-full bg-neutral-400 text-white text-sm font-semibold py-2.5 text-center'>
                                Finalizada
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="w-full pt-12 md:pt-10 pb-10">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center lg:items-start gap-4">
                <img src="/logo.svg" alt="DHPB" className="h-14 w-auto object-contain" />
                <div className="flex items-center gap-4 text-black">
                  <a href="https://www.instagram.com/oficialdhpb/" target="_blank" rel="noopener noreferrer" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
                    </svg>
                  </a>
                  <a href="https://www.tiktok.com/@oficialdhpb" target="_blank" rel="noopener noreferrer" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16">
                      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
                    </svg>
                  </a>
                  <a href="#" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-youtube" viewBox="0 0 16 16">
                      <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="hidden lg:block w-px h-20 bg-[#000]" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Realização:</span>
                <img src="/ifpb-logo.svg" alt="IFPB" className="h-10 w-auto object-contain" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Apoio:</span>
                <div className="flex items-center gap-5 flex-wrap justify-center">
                  <img src="/anpuhpb.svg" alt="ANPUH" className="h-10 w-auto object-contain" />
                  <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
                  <img src="/logo-gov.svg" alt="Governo" className="h-14 w-auto object-contain" />
                </div>
              </div>
              <div className="hidden lg:block w-px h-20 bg-[#000]" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Powered by:</span>
                <div className="flex items-center gap-4">
                  <img src="/kodeo-logo.svg" alt="Kodeo" className="h-10 w-auto object-contain" />
                  <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <SalaEquipeContent />
    </Suspense>
  )
}
