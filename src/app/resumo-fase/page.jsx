'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc, collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function ResumoFaseContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')
  const equipeId = sp.get('equipeId')

  const [fase, setFase] = useState(null)
  const [edicaoNome, setEdicaoNome] = useState('')
  const [questoes, setQuestoes] = useState([])
  const [respostas, setRespostas] = useState({})
  const [equipeNome, setEquipeNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!authUser || !faseId) return
    const carregar = async () => {
      try {
        if (edicaoId) {
          const eSnap = await getDoc(doc(db, 'edicoes', edicaoId))
          if (eSnap.exists()) setEdicaoNome(eSnap.data().nome || '')
        }
        const fSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
        if (fSnap.exists()) setFase({ id: fSnap.id, ...fSnap.data() })
        if (equipeId) {
          const eqSnap = await getDoc(doc(db, 'equipes', equipeId))
          if (eqSnap.exists()) setEquipeNome(eqSnap.data().nome || '')
        }
      } catch {} finally { setCarregando(false) }
    }
    carregar()
  }, [authUser, faseId, edicaoId, equipeId])

  useEffect(() => {
    if (!faseId || !authUser) return
    const unsub = onSnapshot(doc(db, 'edicoes', edicaoId, 'fases', faseId), (snap) => {
      if (snap.exists()) {
        const st = snap.data().status
        if (st !== 'aberta' && st !== 'correcao') {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
        }
      }
    })
    return () => unsub()
  }, [authUser, faseId, edicaoId, router, userData])

  useEffect(() => {
    if (!faseId) return
    const q = query(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), orderBy('numero', 'asc'))
    const unsub = onSnapshot(q, (snap) => setQuestoes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [faseId, edicaoId])

  useEffect(() => {
    if (!equipeId || !faseId) return
    const carregarRespostas = async () => {
      try {
        const snap = await getDocs(collection(db, 'equipes', equipeId, 'respostas'))
        const m = {}
        snap.docs.forEach((d) => { m[d.id] = d.data() })
        setRespostas(m)
      } catch {}
    }
    carregarRespostas()
  }, [equipeId, faseId])

  const getStatus = (key) => {
    return respostas[key]?.status || 'pendente'
  }

  const tarefaStatus = getStatus('tarefa')

  const temTarefa = !!fase?.tarefa?.titulo

  const statusCount = (tipo) => {
    let count = 0
    questoes.forEach((q) => {
      if ((respostas[q.id]?.status || 'pendente') === tipo) count++
    })
    if (temTarefa && tarefaStatus === tipo) count++
    return count
  }

  const pendentes = statusCount('pendente')
  const rascunhos = statusCount('rascunho')
  const entregues = statusCount('entregue')

  if (loading || !authUser) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='bg-[#fff] w-full min-h-screen text-[#000]'>
              <header className='flex flex-col lg:flex-row justify-around items-center pt-5 pb-5 gap-6 px-4'>
                <div><Image src="/logo.svg" width={100} height={100} alt="Logo" /></div>
                <nav>
                  <ul className='flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base'>
                    <li className='hover:text-[#82181A] hover:underline transition-colors'>
                      <a href={userData?.tipo === 'professor' ? '/home-professor' : '/home'}>Home</a>
                    </li>
                    <li className='hover:text-[#82181A] hover:underline transition-colors'>
                      <a href={`/sala-de-equipe?equipeId=${equipeId}`}>Sala de Prova</a>
                    </li>
                    <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/calendario">Calendário</a></li>
                    <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/contato">Contato</a></li>
                    <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/regulamento">Regulamento</a></li>
                  </ul>
                </nav>
                <button onClick={logout} className='border-[#82181A] border-[3px] text-[#82181A] font-medium px-6 py-2 hover:bg-[#82181A] hover:text-[#fff] transition-colors cursor-pointer whitespace-nowrap'>Sair</button>
              </header>

      <section className='bg-[#fff] text-[#000]'>
        <div className='px-4 pt-10 sm:px-20 sm:pt-16'>
          <div className='flex flex-col py-5 sm:flex-row sm:py-8'>
            <div>
              <h1 className='text-2xl text-[#82181A] font-medium sm:text-[2.5rem]'>Resumo {fase?.nome || 'Fase'}</h1>
              <h1 className='text-[1.1rem] text-[#82181A] font-medium'>Equipe: {equipeNome}</h1>
              <div className='pt-3'>
                {fase?.provaPdfUrl ? (
                  <a href={fase.provaPdfUrl} target="_blank" rel="noopener noreferrer"
                    className='flex gap-2 w-[14rem] h-[2.5rem] bg-[#82181A] text-[#fff] justify-center items-center rounded-[5px] cursor-pointer hover:bg-[#631214] transition-colors'>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/></svg>
                    <span className='font-light'>Baixar prova em PDF</span>
                  </a>
                ) : (
                  <span className='flex gap-2 w-[14rem] h-[2.5rem] bg-neutral-300 text-neutral-500 justify-center items-center rounded-[5px] cursor-not-allowed text-sm'>
                    PDF não disponível
                  </span>
                )}
              </div>
            </div>

            <div className='mt-5 sm:pl-[36rem] sm:mt-0'>
              <p className='text-base text-[#000] font-medium'>Fase em andamento.</p>
              <div className='flex flex-wrap gap-4 pt-2'>
                <div className='flex items-center pr-3'>
                  <div className='w-8 h-8 flex items-center justify-center border-2 border-[#000]/25 bg-[#F7F7F7] text-sm font-medium'>{pendentes}</div>
                  <p className='pl-2 text-sm'>em branco</p>
                </div>
                <div className='flex items-center pr-3'>
                  <div className='w-8 h-8 flex items-center justify-center border-2 border-[#000]/25 bg-[#F8E3E3] text-sm font-medium'>{rascunhos}</div>
                  <p className='pl-2 text-sm'>em rascunho</p>
                </div>
                <div className='flex items-center'>
                  <div className='w-8 h-8 flex items-center justify-center border-2 border-[#000]/25 bg-[#CCFFE6] text-sm font-medium'>{entregues}</div>
                  <p className='pl-2 text-sm'>entregues</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {questoes.length === 0 ? (
            <div className="text-center py-10 text-neutral-500"><p>Nenhuma questão cadastrada.</p></div>
          ) : (
            questoes.map((q, idx) => {
              const st = getStatus(q.id)
              const bg = st === 'entregue' ? 'bg-[#CCFFE6]' : st === 'rascunho' ? 'bg-[#F8E3E3]' : 'bg-[#F7F7F7]'
              const prevId = idx > 0 ? questoes[idx - 1].id : ''
              const nextId = idx < questoes.length - 1 ? questoes[idx + 1].id : ''
              return (
                <div key={q.id} className='flex justify-center pt-5 sm:pt-8'>
                  <Link
                    href={`/questao?questaoId=${q.id}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}&prevId=${prevId}&nextId=${nextId}`}
                    className={`flex flex-col sm:flex-row justify-between items-center p-4 w-full mx-4 sm:w-[90rem] ${bg} hover:opacity-80 transition-opacity`}
                  >
                    <div><p className='text-base font-medium'>{q.numero} / Questão</p></div>
                    <div className='flex flex-col items-center mt-1 sm:flex-row sm:space-x-2 sm:mt-0'>
                      <p className='text-sm text-neutral-500'>Status: {st === 'entregue' ? 'Entregue' : st === 'rascunho' ? 'Rascunho' : 'Em branco'}</p>
                    </div>
                  </Link>
                </div>
              )
            })
          )}

          {fase?.tarefa?.titulo && (
            <div className='flex justify-center pt-5 sm:pt-8 pb-8'>
              <Link
                href={fase.tarefaUrl || '#'}
                className={`flex flex-col sm:flex-row justify-between items-center p-4 w-full mx-4 sm:w-[90rem] ${tarefaStatus === 'entregue' ? 'bg-[#CCFFE6]' : tarefaStatus === 'rascunho' ? 'bg-[#F8E3E3]' : 'bg-[#F7F7F7]'} hover:opacity-80 transition-opacity`}
              >
                <div><p className='text-base font-medium'>Tarefa — {fase.tarefa.titulo}</p></div>
                <div className='flex flex-col items-center mt-1 sm:flex-row sm:space-x-2 sm:mt-0'>
                  <p className='text-sm text-neutral-500'>Status: {tarefaStatus === 'entregue' ? 'Entregue' : tarefaStatus === 'rascunho' ? 'Rascunho' : 'Em branco'}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      <footer className="w-full pt-12 md:pt-55 pb-10">
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
      <ResumoFaseContent />
    </Suspense>
  )
}
