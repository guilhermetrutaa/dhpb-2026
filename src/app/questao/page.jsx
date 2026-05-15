'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function QuestaoContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const questaoId = sp.get('questaoId')
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')
  const equipeId = sp.get('equipeId')

  const [questao, setQuestao] = useState(null)
  const [fase, setFase] = useState(null)
  const [edicaoNome, setEdicaoNome] = useState('')
  const [selectedAlt, setSelectedAlt] = useState(null)
  const [respostaStatus, setRespostaStatus] = useState('pendente')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [showBotoes, setShowBotoes] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const questoesPorFase = 10

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!authUser || !questaoId) return
    const carregar = async () => {
      try {
        const [qSnap, fSnap, rSnap] = await Promise.all([
          getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', questaoId)),
          getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId)),
          equipeId ? getDoc(doc(db, 'equipes', equipeId, 'respostas', questaoId)) : Promise.resolve(null),
        ])
        if (qSnap.exists()) setQuestao({ id: qSnap.id, ...qSnap.data() })
        if (fSnap.exists()) setFase({ id: fSnap.id, ...fSnap.data() })
        if (rSnap?.exists()) {
          setSelectedAlt(rSnap.data().alternativa)
          setRespostaStatus(rSnap.data().status || 'pendente')
        }
        if (edicaoId) {
          const eSnap = await getDoc(doc(db, 'edicoes', edicaoId))
          if (eSnap.exists()) setEdicaoNome(eSnap.data().nome || '')
        }
      } catch (e) { setErro(e.message) } finally { setCarregando(false) }
    }
    carregar()
  }, [authUser, questaoId, faseId, edicaoId, equipeId])

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
    if (mensagem) setTimeout(() => setMensagem(''), 3000)
  }, [mensagem])

  const handleSelectAlt = (altKey) => {
    if (respostaStatus !== 'entregue') {
      setSelectedAlt(altKey)
      setShowBotoes(true)
    }
  }

  const handleSalvar = async (novoStatus) => {
    if (!selectedAlt) { alert('Selecione uma alternativa.'); return }
    if (respostaStatus === 'entregue') { alert('Questão já entregue.'); return }
    try {
      const peso = questao.alternativas?.find((a) => a.letra === selectedAlt)?.peso || 0
      await setDoc(doc(db, 'equipes', equipeId, 'respostas', questaoId), {
        alternativa: selectedAlt,
        status: novoStatus,
        peso,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: userData?.nome || authUser.email,
      })
      setRespostaStatus(novoStatus)
      setShowBotoes(false)
      setMensagem(novoStatus === 'entregue' ? 'Questão entregue!' : 'Rascunho salvo!')
    } catch {}
  }

  const qNumero = questao?.numero || 0
  const qPrevId = sp.get('prevId') || ''
  const qNextId = sp.get('nextId') || ''

  if (loading || !authUser) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }
  if (erro) {
    return <div className={`${poppins.className} min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4`}>
      <p className="text-red-600 font-bold text-xl mb-4">{erro}</p>
      <Link href={`/resumo-fase?faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`} className="text-blue-600 hover:underline">Voltar</Link>
    </div>
  }
  if (!questao) return null

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

      <section>
        <div className='flex flex-col md:flex-row px-4 md:px-20 lg:px-30 pt-8 md:pt-12'>
          <h1 className='text-[2rem] md:text-[2.5rem] text-[#82181A] font-medium'>{edicaoNome || 'DHPB'} ·</h1>
          <h1 className='text-[2rem] md:text-[2.5rem] font-medium text-[#82181A] pl-0 md:pl-2'>{fase?.nome || 'Fase'}</h1>
        </div>

        <div className='px-4 md:px-20 lg:px-50 pt-6'>
          <p className='text-[1.5rem] md:text-[2rem] text-[#5B5B5B] font-medium'>{qNumero}º Questão</p>
          <p className='text-[0.85rem] text-[#5B5B5B]'>Status: {respostaStatus === 'entregue' ? 'Entregue' : respostaStatus === 'rascunho' ? 'Rascunho' : 'Pendente'}</p>
        </div>

        {questao.documentos?.length > 0 && (
          <div className='px-0 pt-6 space-y-4'>
            {questao.documentos.map((doc, i) => (
              <div key={i} className='w-full bg-[#F8E6E6] py-8 px-4 md:px-10'>
                <div className='max-w-4xl mx-auto'>
                  <h2 className='text-lg md:text-xl text-neutral-500 font-medium'>Documento {String(i + 1).padStart(2, '0')}</h2>
                  <div className='text-center pt-4'>
                    {doc.titulo && <h3 className='text-lg md:text-xl text-neutral-500 font-bold'>{doc.titulo}</h3>}
                    {doc.subtitulo && <p className='text-sm md:text-base text-neutral-500 pt-1'>{doc.subtitulo}</p>}
                    <div className='pt-5'>
                      <a
                        href={`/documento?docIndex=${i}&questaoId=${questaoId}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`}
                        className='inline-block bg-[#82181A] text-white px-10 py-3 rounded-full text-base hover:underline cursor-pointer'
                      >
                        Abrir documento
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='px-4 md:px-20 lg:px-50 pt-10 text-center'>
          <div className='text-[#000] leading-relaxed text-lg' dangerouslySetInnerHTML={{ __html: questao.instrucao }} />
        </div>

        <div className='px-4 md:px-20 lg:px-50 pt-16'>
          <h2 className='text-[1.3rem] md:text-[1.6rem] text-[#555] font-medium mb-4'>Alternativas</h2>
          <div className='space-y-3'>
            {questao.alternativas?.map((alt) => {
              const selecionada = selectedAlt === alt.letra
              const locked = respostaStatus === 'entregue' || fase?.status === 'correcao'
              let classe = 'flex items-center w-full rounded-xl p-4 min-h-[60px] cursor-pointer border-2 transition-all '
              if (locked) {
                classe += 'cursor-not-allowed '
                classe += selecionada ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-transparent opacity-60'
              } else {
                classe += selecionada ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-transparent hover:bg-gray-200'
              }
              return (
                <div key={alt.letra} className={classe} onClick={() => handleSelectAlt(alt.letra)}>
                  <div className='w-8 h-8 rounded-full bg-[#82181A]/10 flex items-center justify-center font-bold text-[#82181A] text-sm mr-3'>{alt.letra}</div>
                  <p className='text-gray-800'>{alt.texto}</p>
                  
                </div>
              )
            })}
          </div>

          {respostaStatus !== 'entregue' && fase?.status !== 'correcao' && showBotoes && (
            <div className='mt-8 flex flex-col md:flex-row justify-center gap-4'>
              <button onClick={() => handleSalvar('rascunho')} className='px-8 py-3 rounded-full font-bold text-white bg-[#82181A] hover:bg-[#631214] shadow-lg cursor-pointer'>
                Salvar Rascunho
              </button>
              <button onClick={() => { if (confirm('Tem certeza? Não será possível alterar depois.')) handleSalvar('entregue') }}
                className='px-8 py-3 rounded-full font-bold text-black bg-[#c2e45c] hover:bg-[#a8d635] shadow-lg cursor-pointer'>
                Entregar Questão
              </button>
            </div>
          )}

          {mensagem && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center font-medium">{mensagem}</div>
          )}

          {(fase?.status === 'finalizada' || fase?.status === 'correcao') && questao?.comentario && (
            <div className='border-l-4 border-green-500 bg-green-50 rounded-r-2xl p-6 mt-6'>
              <p className='text-xs font-semibold text-green-700 uppercase tracking-wide mb-1'>Comentário da Questão</p>
              <div className='text-neutral-700 text-sm' dangerouslySetInnerHTML={{ __html: questao.comentario }} />
            </div>
          )}

          <div className='flex justify-center items-center pt-12'>
            <div className='text-center'>
              <p className='text-xs text-neutral-500 pb-2'>Navegar entre questões:</p>
              <div className='flex items-center justify-center gap-4'>
                {qPrevId ? (
                  <Link href={`/questao?questaoId=${qPrevId}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`}>
                    <svg width="20" height="45" fill="#666" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/></svg>
                  </Link>
                ) : (
                  <svg width="20" height="45" fill="#ccc" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/></svg>
                )}
                <p className='text-2xl text-[#666] font-medium'>{qNumero}/10</p>
                {qNextId ? (
                  <Link href={`/questao?questaoId=${qNextId}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`}>
                    <svg width="20" height="45" fill="#666" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/></svg>
                  </Link>
                ) : (
                  <svg width="20" height="45" fill="#ccc" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/></svg>
                )}
              </div>
            </div>
          </div>

          <div className='flex justify-center pt-8 pb-12'>
            <Link href={`/resumo-fase?faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`}
              className='border-2 border-neutral-400 px-6 py-2 rounded-full text-sm text-neutral-500 font-medium hover:border-[#82181A] hover:text-[#82181A] transition-colors'>
              Voltar para lista de questões
            </Link>
          </div>
        </div>
      </section>

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
      <QuestaoContent />
    </Suspense>
  )
}
