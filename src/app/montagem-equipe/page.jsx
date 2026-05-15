'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { doc, getDoc, updateDoc, arrayUnion, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function SingleTeamView({ equipeId, authUser, userData, logout }) {
  const [equipe, setEquipe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [emailMembro, setEmailMembro] = useState('')
  const [papelMembro, setPapelMembro] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => {
    if (!equipeId) return
    const carregar = async () => {
      try {
        const snap = await getDoc(doc(db, 'equipes', equipeId))
        if (snap.exists()) setEquipe({ id: snap.id, ...snap.data() })
      } catch {} finally { setCarregando(false) }
    }
    carregar()
  }, [equipeId])

  const membrosAtivos = equipe?.membros?.filter((m) => m.status === 'ativo') || []
  const isCriador = authUser?.uid === equipe?.criadorUid
  const isProfessor = userData?.tipo === 'professor'

  const slots = () => {
    if (!equipe) return { professor: 0, aluno: 0, responsavel: 0, totalRestante: 0 }
    const p = membrosAtivos.filter((m) => m.papel === 'professor_orientador').length
    const r = membrosAtivos.filter((m) => m.papel === 'responsavel').length
    const a = membrosAtivos.filter((m) => m.papel === 'aluno').length
    const t = membrosAtivos.length
    if (isProfessor) return { professor: 0, responsavel: 1 - r, aluno: 3 - a - (1 - r), totalRestante: 4 - t }
    return { professor: 1 - p, responsavel: 0, aluno: 2 - a, totalRestante: 4 - t }
  }

  const s = slots()

  const handleAdicionar = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')
    if (!emailMembro.trim()) { setErro('Digite o email do membro.'); return }
    if (s.totalRestante <= 0) { setErro('Equipe já está completa (4 membros).'); return }

    let papel = papelMembro
    if (!papel) {
      if (isProfessor) papel = s.responsavel > 0 ? 'responsavel' : 'aluno'
      else if (s.professor > 0) papel = 'professor_orientador'
      else papel = 'aluno'
    }
    if (papel === 'professor_orientador' && s.professor <= 0) { setErro('Limite de professores orientadores atingido.'); return }
    if (papel === 'responsavel' && s.responsavel <= 0) { setErro('Limite de responsáveis atingido.'); return }
    if (papel === 'aluno' && s.aluno <= 0) { setErro('Limite de alunos atingido.'); return }

    setAdicionando(true)
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', emailMembro.trim())))
      if (usersSnap.empty) { setErro('Usuário com este email não encontrado.'); return }
      const userDoc = usersSnap.docs[0]
      if (membrosAtivos.some((m) => m.uid === userDoc.id)) { setErro('Este usuário já é membro da equipe.'); return }

      await updateDoc(doc(db, 'equipes', equipeId), {
        membros: arrayUnion({
          uid: userDoc.id,
          nome: `${userDoc.data().nome || ''} ${userDoc.data().sobrenome || ''}`.trim(),
          email: emailMembro.trim(),
          papel,
          status: 'ativo',
        }),
      })

      await setDoc(doc(db, 'users', userDoc.id, 'participacoes', equipe.edicaoId), {
        equipeId,
        papel,
      })
      await setDoc(doc(db, 'membro-index', btoa(emailMembro.trim()).replace(/=+$/, '') + '_' + equipe.edicaoId), {
        equipeId, papel, uid: userDoc.id,
      })

      setSucesso('Membro adicionado com sucesso!')
      setEmailMembro('')
      setPapelMembro('')
      setTimeout(() => setSucesso(''), 3000)
      const snap = await getDoc(doc(db, 'equipes', equipeId))
      if (snap.exists()) setEquipe({ id: snap.id, ...snap.data() })
    } catch (err) {
      setErro('Erro: ' + (err.code || err.message || 'Erro ao adicionar membro.'))
    } finally { setAdicionando(false) }
  }

  if (carregando) return <p className="text-[#82181A] text-lg text-center pt-20">Carregando equipe...</p>
  if (!equipe) return <p className="text-[#82181A] text-lg text-center pt-20">Equipe não encontrada.</p>

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2 space-y-6'>
        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8'>
          <h2 className='text-2xl font-bold text-[#82181A] mb-6'>Minha Equipe</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div><p className='text-xs text-neutral-500 uppercase tracking-wide'>Nome</p><p className='text-lg font-semibold'>{equipe.nome}</p></div>
              <div><p className='text-xs text-neutral-500 uppercase tracking-wide'>ID</p><p className='text-sm font-mono text-[#82181A]'>{equipe.id}</p></div>
              <div><p className='text-xs text-neutral-500 uppercase tracking-wide'>Escola</p><p className='text-lg font-semibold'>{equipe.escola}</p></div>
            </div>
            <div className='space-y-4'>
              <div><p className='text-xs text-neutral-500 uppercase tracking-wide'>Modalidade</p><p className='text-lg font-semibold capitalize'>{equipe.modalidade?.replace('_', ' ')}</p></div>
              <div><p className='text-xs text-neutral-500 uppercase tracking-wide'>Criador</p><p className='text-lg font-semibold'>{equipe.criadorNome}</p></div>
              <div><p className='text-xs text-neutral-500 uppercase tracking-wide'>Membros</p><p className='text-lg font-semibold'>{membrosAtivos.length}/4</p></div>
            </div>
          </div>
        </div>

        

        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8'>
          <h2 className='text-2xl font-bold text-[#82181A] mb-6'>Membros</h2>
          {membrosAtivos.length === 0 ? <p className="text-neutral-500">Nenhum membro.</p> : (
            <div className='space-y-3'>
              {membrosAtivos.map((m, i) => (
                <div key={i} className='border border-neutral-200 rounded-xl p-4 flex items-center justify-between'>
                  <div><p className='font-semibold'>{m.nome}</p><p className='text-sm text-neutral-500'>{m.email}</p></div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    m.papel === 'professor_orientador' ? 'bg-blue-100 text-blue-700'
                    : m.papel === 'responsavel' ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    {m.papel === 'professor_orientador' ? 'Professor Orientador' : m.papel === 'responsavel' ? 'Responsável' : 'Aluno'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='space-y-6'>
        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8'>
          <h2 className='text-xl font-bold text-[#82181A] mb-4'>Progresso</h2>
          <div className='flex items-center gap-2 mb-2'>
            <div className='flex-1 bg-neutral-200 rounded-full h-3'>
              <div className='bg-[#82181A] h-3 rounded-full transition-all' style={{ width: `${(membrosAtivos.length / 4) * 100}%` }} />
            </div>
            <span className='text-sm font-bold'>{membrosAtivos.length}/4</span>
          </div>
          <p className='text-xs text-neutral-500'>{s.totalRestante > 0 ? `Faltam ${s.totalRestante} membro(s)` : 'Equipe completa!'}</p>
        </div>

        {membrosAtivos.length === 4 && (
          <a href={`/sala-de-equipe?equipeId=${equipeId}`}
            className='block w-full bg-[#a71f22] text-[#fff] font-medium text-center py-4 rounded-xl hover:bg-[#82181A] transition-colors cursor-pointer text-lg'>
            Sala de Equipe
          </a>
        )}

        {isCriador && s.totalRestante > 0 && (
          <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8'>
            <h2 className='text-xl font-bold text-[#82181A] mb-4'>Adicionar Membro</h2>
            <form onSubmit={handleAdicionar} className='space-y-4'>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-1">Email</label>
                <input type="email" placeholder="email@exemplo.com" value={emailMembro} onChange={(e) => setEmailMembro(e.target.value)} required
                  className="block w-full rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]" />
              </div>
              {s.totalRestante > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-1">Papel</label>
                  <select value={papelMembro} onChange={(e) => setPapelMembro(e.target.value)}
                    className="block w-full rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]">
                    <option value="">Selecionar automaticamente</option>
                    {isProfessor ? (
                      <>{s.responsavel > 0 && <option value="responsavel">Responsável</option>}{s.aluno > 0 && <option value="aluno">Aluno</option>}</>
                    ) : (
                      <>{s.professor > 0 && <option value="professor_orientador">Professor Orientador</option>}{s.aluno > 0 && <option value="aluno">Aluno</option>}</>
                    )}
                  </select>
                </div>
              )}
              {erro && <p className="text-red-600 text-xs">{erro}</p>}
              {sucesso && <p className="text-green-600 text-xs">{sucesso}</p>}
              <button type="submit" disabled={adicionando}
                className="w-full bg-[#82181A] py-3 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-lg disabled:opacity-50">
                {adicionando ? 'Adicionando...' : 'Adicionar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function MultiTeamView({ authUser, userData, edicoes }) {
  const [equipes, setEquipes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!authUser) return

    const edMap = {}
    ;(edicoes || []).forEach((e) => { edMap[e.id] = e })

    const carregarTudo = async () => {
      const mapa = new Map()

      const pSnap = await getDocs(query(collection(db, 'users', authUser.uid, 'participacoes')))
      for (const pDoc of pSnap.docs) {
        const pData = pDoc.data()
        try {
          const eSnap = await getDoc(doc(db, 'equipes', pData.equipeId))
          if (eSnap.exists()) {
            mapa.set(eSnap.id, {
              id: eSnap.id,
              edicaoNome: edMap[pDoc.id]?.nome || 'Edição',
              ...eSnap.data(),
            })
          }
        } catch {}
      }

      const qMinhas = query(collection(db, 'equipes'), where('criadorUid', '==', authUser.uid))
      const minhasSnap = await getDocs(qMinhas)
      for (const doc_ of minhasSnap.docs) {
        if (!mapa.has(doc_.id)) {
          mapa.set(doc_.id, {
            id: doc_.id,
            edicaoNome: edMap[doc_.data().edicaoId]?.nome || 'Edição',
            ...doc_.data(),
          })
        }
      }

      setEquipes(Array.from(mapa.values()))
      setCarregando(false)
    }

    carregarTudo()
  }, [authUser, edicoes])

  if (carregando) return <p className="text-[#82181A] text-lg text-center pt-20">Carregando equipes...</p>

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-8'>
        <h1 className='text-2xl font-bold text-[#fff]'>Minhas Equipes</h1>
        <a
          href="/criar-equipe"
          className='bg-[#82181A] text-[#fff] font-semibold px-6 py-3 rounded-lg hover:bg-[#631214] transition-colors cursor-pointer inline-block'
        >
          Criar Nova Equipe
        </a>
      </div>

      {equipes.length === 0 ? (
        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center'>
          <p className='text-neutral-500 text-lg'>Você não participa de nenhuma equipe ainda.</p>
          <a
            href="/criar-equipe"
            className='mt-4 bg-[#82181A] text-[#fff] font-semibold px-6 py-3 rounded-lg hover:bg-[#631214] transition-colors cursor-pointer inline-block'
          >
            Criar Primeira Equipe
          </a>
        </div>
      ) : (
        <div className='space-y-6'>
          {equipes.map((equipe) => {
            const membrosAtivos = equipe.membros?.filter((m) => m.status === 'ativo') || []
            return (
              <div key={equipe.id} className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8'>
                <div className='flex flex-col sm:flex-row items-start justify-between gap-4 mb-6'>
                  <div>
                    <p className='text-xs text-neutral-500 uppercase tracking-wide mb-1'>{equipe.edicaoNome}</p>
                    <h2 className='text-xl font-bold text-[#82181A]'>{equipe.nome}</h2>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-neutral-500'>ID: <span className='font-mono text-[#82181A] text-sm'>{equipe.id}</span></p>
                    <p className='text-xs text-neutral-500 mt-1'>Membros: {membrosAtivos.length}/4</p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                  <div className='border border-neutral-200 rounded-xl p-4'>
                    <p className='text-xs text-neutral-500 uppercase tracking-wide mb-1'>Escola</p>
                    <p className='font-semibold'>{equipe.escola}</p>
                  </div>
                  <div className='border border-neutral-200 rounded-xl p-4'>
                    <p className='text-xs text-neutral-500 uppercase tracking-wide mb-1'>Criador</p>
                    <p className='font-semibold'>{equipe.criadorNome}</p>
                  </div>
                </div>

                <div>
                  <p className='text-sm font-semibold text-neutral-700 mb-3'>Membros</p>
                  <div className='space-y-2'>
                    {membrosAtivos.map((m, i) => (
                      <div key={i} className='border border-neutral-200 rounded-xl p-3 flex items-center justify-between'>
                        <div>
                          <p className='font-semibold text-sm'>{m.nome}</p>
                          <p className='text-xs text-neutral-500'>{m.email}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          m.papel === 'professor_orientador' ? 'bg-blue-100 text-blue-700'
                          : m.papel === 'responsavel' ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {m.papel === 'professor_orientador' ? 'Professor Orientador'
                            : m.papel === 'responsavel' ? 'Responsável' : 'Aluno'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='mt-4 pt-4 border-t border-neutral-200'>
                    {membrosAtivos.length < 4 ? (
                      <a href={`/montagem-equipe?equipeId=${equipe.id}`} className='text-[#82181A] font-semibold text-sm hover:underline'>
                        Gerenciar Membros →
                      </a>
                    ) : (
                      <a href={`/sala-de-equipe?equipeId=${equipe.id}`} className='block w-full bg-[#a71f22] text-[#fff] font-medium text-center py-4 rounded-xl hover:bg-[#82181A] transition-colors cursor-pointer text-lg'>
                        Sala de Equipe
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MontagemEquipeForm() {
  const { authUser, userData, loading, logout, edicoes } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipeId = searchParams.get('equipeId')

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

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
          {equipeId ? (
            <SingleTeamView equipeId={equipeId} authUser={authUser} userData={userData} logout={logout} />
          ) : (
            <MultiTeamView authUser={authUser} userData={userData} logout={logout} edicoes={edicoes} />
          )}
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
      <MontagemEquipeForm />
    </Suspense>
  )
}
