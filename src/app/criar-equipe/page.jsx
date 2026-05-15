'use client'

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { collection, query, where, orderBy, getDocs, addDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function CriarEquipeForm() {
  const { authUser, userData, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const edicaoParam = searchParams.get('edicaoId')

  const [edicaoId, setEdicaoId] = useState(edicaoParam || '')
  const [edicoes, setEdicoes] = useState([])

  const [nomeEquipe, setNomeEquipe] = useState('')
  const [buscaEscola, setBuscaEscola] = useState('')
  const [escolaSelecionada, setEscolaSelecionada] = useState(null)
  const [sugestoes, setSugestoes] = useState([])
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [tipoEscola, setTipoEscola] = useState('')
  const [modalidade, setModalidade] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!edicaoParam) {
      const carregar = async () => {
        const q = query(collection(db, 'edicoes'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        setEdicoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }
      carregar()
    }
  }, [edicaoParam])

  useEffect(() => {
    const escolaId = searchParams.get('escolaId')
    const escolaNome = searchParams.get('escolaNome')
    if (escolaId && escolaNome) {
      setEscolaSelecionada({ id: escolaId, nome: decodeURIComponent(escolaNome) })
      setBuscaEscola(decodeURIComponent(escolaNome))
    }
  }, [searchParams])

  const buscarEscolas = useCallback(async (termo) => {
    if (!termo.trim()) {
      setSugestoes([])
      setShowSugestoes(false)
      return
    }

    setBuscando(true)

    try {
      const termoLower = termo.toLowerCase()
      const q = query(
        collection(db, 'escolas'),
        where('nome', '>=', termoLower),
        where('nome', '<=', termoLower + '\uf8ff')
      )
      const snap = await getDocs(q)
      let resultados = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (resultados.length === 0) {
        const qUpper = query(
          collection(db, 'escolas'),
          where('nome', '>=', termo),
          where('nome', '<=', termo + '\uf8ff')
        )
        const snapUpper = await getDocs(qUpper)
        resultados = snapUpper.docs.map((d) => ({ id: d.id, ...d.data() }))
      }

      setSugestoes(resultados)
      setShowSugestoes(true)
    } catch {
      setSugestoes([])
    } finally {
      setBuscando(false)
    }
  }, [])

  const handleBuscaChange = (e) => {
    const valor = e.target.value
    setBuscaEscola(valor)
    setEscolaSelecionada(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarEscolas(valor), 400)
  }

  const selecionarEscola = (escola) => {
    setEscolaSelecionada(escola)
    setBuscaEscola(escola.nome)
    setShowSugestoes(false)
    setTipoEscola(escola.tipo || '')
  }

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSugestoes(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleCriar = async (e) => {
    e.preventDefault()
    setErro('')

    if (!edicaoId) {
      setErro('Edição não encontrada.')
      return
    }

    if (!nomeEquipe.trim()) {
      setErro('Digite o nome da equipe.')
      return
    }

    if (!escolaSelecionada) {
      setErro('Selecione uma escola da lista.')
      return
    }

    if (!tipoEscola) {
      setErro('Selecione o tipo da escola.')
      return
    }

    if (!modalidade) {
      setErro('Selecione a modalidade.')
      return
    }

    setCarregando(true)

    try {
      const papelCriador = userData?.tipo === 'professor' ? 'professor_orientador' : 'responsavel'

      const equipeRef = await addDoc(collection(db, 'equipes'), {
        edicaoId,
        nome: nomeEquipe.trim(),
        escola: escolaSelecionada.nome,
        escolaId: escolaSelecionada.id,
        tipoEscola,
        modalidade,
        criadorUid: authUser.uid,
        criadorNome: `${userData?.nome || ''} ${userData?.sobrenome || ''}`.trim(),
        criadorEmail: authUser.email,
        membros: [
          {
            uid: authUser.uid,
            nome: `${userData?.nome || ''} ${userData?.sobrenome || ''}`.trim(),
            email: authUser.email,
            papel: papelCriador,
            status: 'ativo',
          },
        ],
        createdAt: new Date().toISOString(),
      })

      await setDoc(doc(db, 'users', authUser.uid, 'participacoes', edicaoId), {
        equipeId: equipeRef.id,
        papel: papelCriador,
      })
      await setDoc(doc(db, 'membro-index', btoa(authUser.email).replace(/=+$/, '') + '_' + edicaoId), {
        equipeId: equipeRef.id, papel: papelCriador, uid: authUser.uid,
      })

      router.push(userData?.tipo === 'professor' ? '/montagem-equipe' : `/montagem-equipe?equipeId=${equipeRef.id}`)
    } catch {
      setErro('Erro ao criar equipe.')
    } finally {
      setCarregando(false)
    }
  }

  if (loading || !authUser) {
    return (
      <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}>
        <p className="text-[#82181A] text-lg">Carregando...</p>
      </div>
    )
  }

  if (!edicaoId) {
    return (
      <div className={poppins.className}>
        <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
          <main className='flex flex-col lg:flex-row flex-1'>
            <div className='hidden lg:block lg:w-1/2'>
              <div className='bg-[#fff] leading-none'><Image src="/bg-criarequipe.svg" width={800} height={100} alt="Background" className="w-full h-full object-cover align-middle" style={{ display: 'block' }} /></div>
            </div>
            <div className='w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pl-50 lg:pt-30 flex flex-col justify-start items-center lg:items-start'>
              <div className='w-full max-w-md'>
                <div className='text-center lg:text-left'>
                  <h1 className='text-3xl md:text-[2.2rem] text-[#82181A] font-medium'>Criar Equipe</h1>
                  <p className='text-[#2e2e2e] pt-5'>Selecione a edição para criar sua equipe</p>
                </div>
                <div className='space-y-4 pt-10'>
                  {edicoes.length === 0 ? (
                    <p className='text-neutral-500'>Carregando edições...</p>
                  ) : (
                    edicoes.map((ed) => (
                      <button
                        key={ed.id}
                        onClick={() => setEdicaoId(ed.id)}
                        className='w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-xl lg:rounded-none'
                      >
                        {ed.nome}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
        <main className='flex flex-col lg:flex-row flex-1'>
          <div className='hidden lg:block lg:w-1/2 bg-[#fff] leading-none'>
            <Image
              src="/bg-criarequipe.svg"
              width={800}
              height={100}
              alt="Background"
              className="w-full h-full object-cover align-middle"
              style={{ display: 'block' }}
            />
          </div>

          <div className='w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pl-50 lg:pt-30 flex flex-col justify-start items-center lg:items-start'>
            <div className='w-full max-w-md'>
              <div className='text-center lg:text-left'>
                <h1 className='text-3xl md:text-[2.2rem] text-[#82181A] font-medium'>Criar Equipe</h1>
                <p className='text-[#2e2e2e] pt-5'>Preencha as informações para criar sua equipe</p>
              </div>

              <form onSubmit={handleCriar} className="space-y-6 pt-10">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Nome da Equipe</label>
                  <input
                    type="text"
                    placeholder="Escreva aqui"
                    value={nomeEquipe}
                    onChange={(e) => setNomeEquipe(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  />
                </div>

                <div className="space-y-2 relative" ref={searchRef}>
                  <label className="block text-sm font-medium text-neutral-900">Nome da Escola</label>
                  <input
                    type="text"
                    placeholder="Digite para buscar sua escola..."
                    value={buscaEscola}
                    onChange={handleBuscaChange}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  />

                  {showSugestoes && (
                    <div className="absolute z-10 w-full bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {buscando ? (
                        <p className="p-4 text-sm text-neutral-500">Buscando...</p>
                      ) : sugestoes.length > 0 ? (
                        sugestoes.map((esc) => (
                          <button
                            key={esc.id}
                            type="button"
                            onClick={() => selecionarEscola(esc)}
                            className="w-full text-left p-4 text-sm hover:bg-[#82181A]/5 border-b border-neutral-100 last:border-0 cursor-pointer"
                          >
                            <p className="font-medium">{esc.nome}</p>
                            <p className="text-xs text-neutral-500">{esc.tipo}</p>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-neutral-500">
                          <p>Nenhuma escola encontrada.</p>
                          <a
                            href={`/cadastro-escola?edicaoId=${edicaoId || ''}`}
                            className="text-[#82181A] font-bold hover:underline"
                          >
                            Cadastre aqui
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <p className='text-[0.8rem] text-[#82181A]'>
                    Sua escola não está na lista?{' '}
                    <a href={`/cadastro-escola?edicaoId=${edicaoId || ''}`} className='font-bold hover:underline'>
                      Cadastre aqui
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Qual é o tipo da sua escola?</label>
                  <select
                    value={tipoEscola}
                    onChange={(e) => setTipoEscola(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  >
                    <option value="" disabled>Selecione uma opção</option>
                    <option value="publica">Pública</option>
                    <option value="particular">Particular</option>
                    <option value="federal">Federal</option>
                    <option value="estadual">Estadual</option>
                    <option value="municipal">Municipal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Modalidade de participação da equipe</label>
                  <select
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  >
                    <option value="" disabled>Selecione uma opção</option>
                    <option value="fundamental">Fundamental</option>
                    <option value="medio">Médio</option>
                    <option value="eja">EJA</option>
                    <option value="eja_fundamental">EJA Fundamental</option>
                    <option value="eja_medio">EJA Médio</option>
                  </select>
                </div>

                {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-xl lg:rounded-none disabled:opacity-50"
                >
                  {carregando ? 'Criando...' : 'Prosseguir'}
                </button>
              </form>
            </div>
          </div>
        </main>

        <footer className="w-full pt-12 pb-10 border-t border-neutral-100">
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
              <div className="hidden lg:block w-px h-20 bg-neutral-300" />
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
              <div className="hidden lg:block w-px h-20 bg-neutral-300" />
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
      <CriarEquipeForm />
    </Suspense>
  )
}
