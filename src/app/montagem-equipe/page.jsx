'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { doc, getDoc, updateDoc, arrayUnion, setDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function SingleTeamView({ equipeId, authUser, userData }) {
  const [equipe, setEquipe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [slotInputs, setSlotInputs] = useState({})
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    if (!equipeId) return
    setCarregando(true)
    const unsub = onSnapshot(doc(db, 'equipes', equipeId), (snap) => {
      if (snap.exists()) setEquipe({ id: snap.id, ...snap.data() })
      setCarregando(false)
    })
    return () => unsub()
  }, [equipeId])

  const membrosAtivos = equipe?.membros?.filter((m) => m.status === 'ativo') || []

  const professorMembro = membrosAtivos.find(m => m.papel === 'professor_orientador')
  const alunosMembros = membrosAtivos.filter(m => m.papel === 'aluno')
  const responsavelMembro = membrosAtivos.find(m => m.papel === 'responsavel')

  const currentUserMembro = membrosAtivos.find(m => m.uid === authUser?.uid)
  const currentUserPapel = currentUserMembro?.papel
  const podeAddMembro = currentUserPapel === 'professor_orientador' || currentUserPapel === 'responsavel'

  const slotsDisponiveis = () => {
    if (!equipe) return { professor: 0, aluno: 0, responsavel: 0, total: 0 }
    const p = membrosAtivos.filter(m => m.papel === 'professor_orientador').length
    const r = membrosAtivos.filter(m => m.papel === 'responsavel').length
    const a = membrosAtivos.filter(m => m.papel === 'aluno').length
    const t = membrosAtivos.length
    if (userData?.tipo === 'professor') return { professor: 0, responsavel: 1 - r, aluno: 2 - a, total: 4 - t }
    return { professor: 1 - p, responsavel: 1 - r, aluno: 2 - a, total: 4 - t }
  }

  const handleAddSlot = async (slotKey, papel) => {
    const data = slotInputs[slotKey]
    if (!data?.email?.trim()) { setErro('Digite o email do participante.'); return }
    if (slotsDisponiveis().total <= 0) { setErro('Equipe já está completa.'); return }
    setErro('')
    setSucesso('')
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', data.email.trim())))
      if (usersSnap.empty) { setErro('Usuário com este email não encontrado.'); return }
      const userDoc = usersSnap.docs[0]
      if (membrosAtivos.some(m => m.uid === userDoc.id)) { setErro('Este usuário já é membro da equipe.'); return }

      const nome = `${userDoc.data().nome || ''} ${userDoc.data().sobrenome || ''}`.trim()
      await updateDoc(doc(db, 'equipes', equipeId), {
        membros: arrayUnion({ uid: userDoc.id, nome, email: data.email.trim(), papel, status: 'ativo' }),
      })
      await setDoc(doc(db, 'users', userDoc.id, 'participacoes', equipe.edicaoId), { equipeId, papel })
      await setDoc(doc(db, 'membro-index', btoa(data.email.trim()).replace(/=+$/, '') + '_' + equipe.edicaoId), {
        equipeId, papel, uid: userDoc.id,
      })

      setSucesso(`${nome} adicionado como ${papel === 'professor_orientador' ? 'Professor Orientador' : papel === 'responsavel' ? 'Responsável' : 'Estudante'}!`)
      setSlotInputs(prev => ({ ...prev, [slotKey]: {} }))
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro('Erro: ' + (err.code || err.message || 'Erro ao adicionar membro.'))
    }
  }

  const s = slotsDisponiveis()

  const slotConfig = [
    { key: 'professor', papel: 'professor_orientador', label: 'Orientador', membro: professorMembro, podeAdd: podeAddMembro && s.professor > 0 },
  ]

  slotConfig.push(
    { key: 'resp', papel: 'responsavel', label: 'Responsável', membro: responsavelMembro, podeAdd: podeAddMembro && s.responsavel > 0 },
  )

  const totalAlunoSlots = 2
  for (let i = 0; i < totalAlunoSlots; i++) {
    const membro = alunosMembros[i] || null
    const dentroDoLimite = i < alunosMembros.length + s.aluno
    const podeAdd = podeAddMembro && !membro && dentroDoLimite
    slotConfig.push({ key: `aluno${i}`, papel: 'aluno', label: 'Estudante', membro, podeAdd })
  }

  if (carregando) return <p className="text-[#82181A] text-lg text-center py-20">Carregando equipe...</p>
  if (!equipe) return <p className="text-[#82181A] text-lg text-center py-20">Equipe não encontrada.</p>

  const formatarModalidade = equipe.modalidade?.replaceAll('_', ' ') || '(selecionada na inscrição)'

  const podeRemover = currentUserPapel === 'professor_orientador' || currentUserPapel === 'responsavel'

  const handleRemoverMembro = async (membro) => {
    if (!window.confirm(`Tem certeza que deseja remover ${membro.nome} da equipe?`)) return
    setErro('')
    setSucesso('')
    try {
      await updateDoc(doc(db, 'equipes', equipeId), {
        membros: membrosAtivos.filter(m => m.uid !== membro.uid)
      })
      await deleteDoc(doc(db, 'users', membro.uid, 'participacoes', equipe.edicaoId))
      await deleteDoc(doc(db, 'membro-index', btoa(membro.email).replace(/=+$/, '') + '_' + equipe.edicaoId))
      setSucesso(`${membro.nome} removido da equipe!`)
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro('Erro ao remover membro: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const placeholderSlot = (slot) => {
    if (slot.papel === 'professor_orientador') return 'professor orientador'
    if (slot.papel === 'responsavel') return 'responsável'
    return 'estudante'
  }

  const textoSlotVazio = (slot) => (
    <span className="inline-flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-arrow-right-short" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
      </svg>
      <span>
        {slot.papel === 'professor_orientador'
          ? 'Orientador A equipe não possui um professor orientador!'
          : `${slot.label} A equipe falta integrantes! Insira os dados do participante.`}
      </span>
    </span>
  )

  const nomeMembro = (membro) => membro.nome

  return (
    <div className="w-full flex justify-center items-center">
      <section className="w-full max-w-[85rem] min-h-[540px] px-7 py-9 sm:px-12 sm:py-12 md:min-h-[675px] md:px-[86px] md:pt-[54px] md:pb-[76px]">
        <div className="mx-auto w-full max-w-[692px]">
          <h1 className="text-[2.65rem] font-bold leading-[1.13] text-white sm:text-[3.1rem] md:text-[3.35rem]">
            Tela de montagem<br />da equipe
          </h1>

          <div className="mt-7 w-full overflow-hidden bg-[#5f5f5f]">
            <div className="grid gap-8 px-5 pb-12 pt-4 text-white sm:grid-cols-[1.35fr_1fr] sm:gap-10 md:px-6 md:pb-[58px]">
              <div className="flex flex-col justify-between gap-8">
                <div>
                  <p className="text-[13px] leading-tight text-white/80">Equipe #</p>
                  <p className="text-[13px] leading-tight text-white/80">{equipe.id}</p>
                </div>
                <h2 className="text-[1.35rem] font-medium leading-tight text-white sm:text-[1.55rem]">
                  {equipe.nome || 'Nome da equipe'}
                </h2>
              </div>

              <div className="space-y-3 pt-10 text-[13px] leading-tight text-white/80 sm:max-w-[180px]">
                <div>
                  <p className="text-white">Escola:</p>
                  <p>{equipe.escola || '(escola da inscrição)'}</p>
                </div>
                <div>
                  <p className="text-white">Responsável:</p>
                  <p>{equipe.criadorNome || '(dono da conta)'}</p>
                </div>
                <div>
                  <p className="text-white">Modalidade:</p>
                  <p className="capitalize">{formatarModalidade}</p>
                </div>
              </div>
            </div>

            {slotConfig.map((slot) => (
              <div key={slot.key}>
                {slot.membro ? (
                  <>
                    <div className="bg-[#8f0000] px-5 py-[13px] text-[12px] font-semibold leading-tight text-white">
                      <p className="flex items-center gap-4">
                        <span aria-hidden="true" className="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                          </svg>
                        </span>
                        <span>{nomeMembro(slot.membro)} ({slot.membro.email})</span>
                        {podeRemover && (
                          <button
                            onClick={() => handleRemoverMembro(slot.membro)}
                            className="ml-auto text-[10px] underline hover:text-white/70"
                          >
                            Remover
                          </button>
                        )}
                      </p>
                    </div>
                    <div className="bg-[#650000] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                      <p>
                        <span className="inline-flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                          </svg>
                          <span>Tudo certo! {nomeMembro(slot.membro)} {slot.membro.uid === equipe.criadorUid ? 'já criou uma conta!' : 'já faz parte da equipe.'}</span>
                        </span>
                      </p>
                    </div>
                  </>
                ) : slot.podeAdd ? (
                  <>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        handleAddSlot(slot.key, slot.papel)
                      }}
                      className="grid gap-3 bg-[#bfbfbf] px-5 py-[10px] sm:grid-cols-2 sm:gap-8"
                    >
                      <label className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="text-[18px] font-bold leading-none text-[#ffe15a]">!</span>
                        <input
                          placeholder={`Nome do ${placeholderSlot(slot)}`}
                          value={slotInputs[slot.key]?.nome || ''}
                          onChange={(e) => setSlotInputs(prev => ({
                            ...prev, [slot.key]: { ...prev[slot.key], nome: e.target.value }
                          }))}
                          className="h-[20px] min-w-0 flex-1 rounded-[3px] bg-[#e7e7e7] px-2 text-[10px] italic leading-none text-[#555] outline-none placeholder:text-[#aaa]"
                        />
                      </label>
                      <label className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="text-[18px] font-bold leading-none text-[#ffe15a]">!</span>
                        <input
                          placeholder={`Email do ${placeholderSlot(slot)}`}
                          value={slotInputs[slot.key]?.email || ''}
                          onChange={(e) => setSlotInputs(prev => ({
                            ...prev, [slot.key]: { ...prev[slot.key], email: e.target.value }
                          }))}
                          className="h-[20px] min-w-0 flex-1 rounded-[3px] bg-[#e7e7e7] px-2 text-[10px] italic leading-none text-[#555] outline-none placeholder:text-[#aaa]"
                        />
                      </label>
                      <button type="submit" className="sr-only">Adicionar integrante</button>
                    </form>
                    <div className="bg-[#4f4f4f] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                      <p>{textoSlotVazio(slot)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#bfbfbf] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                      <p>Vaga disponível</p>
                    </div>
                    <div className="bg-[#4f4f4f] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                      <p>{textoSlotVazio(slot)}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {s.total === 0 && (
            <div className="mt-7 text-center">
              <a
                href={`/sala-de-equipe?equipeId=${equipeId}`}
                className="inline-block bg-white px-8 py-3 text-sm font-semibold text-[#830000] transition-colors hover:bg-gray-100"
              >
                Sala de Equipe
              </a>
            </div>
          )}

          {erro && <p className="mt-4 bg-white/90 px-4 py-2 text-sm font-medium text-[#82181A]">{erro}</p>}
          {sucesso && <p className="mt-4 bg-white/90 px-4 py-2 text-sm font-medium text-[#82181A]">{sucesso}</p>}
        </div>
      </section>
    </div>
  )
}

function MultiTeamView({ authUser, userData, edicoes }) {
  const [equipes, setEquipes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [multiSlotInputs, setMultiSlotInputs] = useState({})

  useEffect(() => {
    if (!authUser) return

    const edMap = {}
    ;(edicoes || []).forEach((e) => { edMap[e.id] = e })

    const carregarTudo = async () => {
      const mapa = new Map()

      const [pSnap, minhasSnap] = await Promise.all([
        getDocs(query(collection(db, 'users', authUser.uid, 'participacoes'))),
        getDocs(query(collection(db, 'equipes'), where('criadorUid', '==', authUser.uid))),
      ])

      const teamPromises = pSnap.docs.map(async (pDoc) => {
        const pData = pDoc.data()
        try {
          const eSnap = await getDoc(doc(db, 'equipes', pData.equipeId))
          if (eSnap.exists()) {
            return {
              id: eSnap.id,
              edicaoNome: edMap[pDoc.id]?.nome || 'Edição',
              ...eSnap.data(),
            }
          }
        } catch {}
        return null
      })
      const teams = (await Promise.all(teamPromises)).filter(Boolean)
      teams.forEach(t => mapa.set(t.id, t))
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
    <div className="w-full flex justify-center items-center">
      <section className="w-full max-w-[85rem] min-h-[540px] px-7 py-9 sm:px-12 sm:py-12 md:min-h-[675px] md:px-[86px] md:pt-[54px] md:pb-[76px]">
        <div className="mx-auto w-full max-w-[692px]">
          <h1 className="text-[2.65rem] font-bold leading-[1.13] text-white sm:text-[3.1rem] md:text-[3.35rem] text-center">
            Minhas Equipes
          </h1>

          <div className="mt-10 text-center">
            <a href="/criar-equipe"
              className="inline-block bg-white px-8 py-3 text-sm font-semibold text-[#830000] transition-colors hover:bg-gray-100">
              Criar Nova Equipe
            </a>
          </div>

          {equipes.length === 0 ? (
            <p className="text-white/80 text-center mt-16 text-lg">Você não participa de nenhuma equipe ainda.</p>
          ) : (
            <div className="mt-8 space-y-8">
              {equipes.map((equipe) => {
                const membrosAtivos = equipe.membros?.filter((m) => m.status === 'ativo') || []
                const formatarModalidade = equipe.modalidade?.replaceAll('_', ' ') || '(selecionada na inscrição)'
                const memberRole = equipe.membros?.find(m => m.uid === authUser?.uid)?.papel
                const podeAddMembro = memberRole === 'professor_orientador' || memberRole === 'responsavel'
                const podeRemover = podeAddMembro
                const papelOrdem = { 'professor_orientador': 0, 'responsavel': 1, 'aluno': 2 }
                const membrosOrdenados = [...membrosAtivos].sort((a, b) => papelOrdem[a.papel] - papelOrdem[b.papel])
                const emptySlots = 4 - membrosAtivos.length

                const handleRemoverMembro = async (membro) => {
                  if (!window.confirm(`Tem certeza que deseja remover ${membro.nome} da equipe?`)) return
                  try {
                    await updateDoc(doc(db, 'equipes', equipe.id), {
                      membros: membrosAtivos.filter(m => m.uid !== membro.uid)
                    })
                    await deleteDoc(doc(db, 'users', membro.uid, 'participacoes', equipe.edicaoId))
                    await deleteDoc(doc(db, 'membro-index', btoa(membro.email).replace(/=+$/, '') + '_' + equipe.edicaoId))
                    setEquipes(prev => prev.map(eq =>
                      eq.id === equipe.id ? { ...eq, membros: eq.membros.filter(m => m.uid !== membro.uid) } : eq
                    ))
                  } catch (err) {
                    alert('Erro ao remover membro: ' + (err.message || 'Erro desconhecido'))
                  }
                }

                const handleAddMembroMulti = async (papel, data) => {
                  if (!data?.email?.trim()) return
                  try {
                    const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', data.email.trim())))
                    if (usersSnap.empty) { alert('Usuário com este email não encontrado.'); return }
                    const userDoc = usersSnap.docs[0]
                    if (membrosAtivos.some(m => m.uid === userDoc.id)) { alert('Este usuário já é membro da equipe.'); return }

                    const nome = `${userDoc.data().nome || ''} ${userDoc.data().sobrenome || ''}`.trim()
                    const novoMembro = { uid: userDoc.id, nome, email: data.email.trim(), papel, status: 'ativo' }
                    await updateDoc(doc(db, 'equipes', equipe.id), {
                      membros: arrayUnion(novoMembro),
                    })
                    await setDoc(doc(db, 'users', userDoc.id, 'participacoes', equipe.edicaoId), { equipeId: equipe.id, papel })
                    await setDoc(doc(db, 'membro-index', btoa(data.email.trim()).replace(/=+$/, '') + '_' + equipe.edicaoId), {
                      equipeId: equipe.id, papel, uid: userDoc.id,
                    })
                    setMultiSlotInputs(prev => ({ ...prev, [equipe.id]: {} }))
                    setEquipes(prev => prev.map(eq =>
                      eq.id === equipe.id ? { ...eq, membros: [...(eq.membros || []), novoMembro] } : eq
                    ))
                  } catch (err) {
                    alert('Erro ao adicionar: ' + (err.message || 'Erro desconhecido'))
                  }
                }

                const determinarProximoPapel = () => {
                  if (!membrosAtivos.some(m => m.papel === 'professor_orientador')) return 'professor_orientador'
                  if (!membrosAtivos.some(m => m.papel === 'responsavel')) return 'responsavel'
                  return 'aluno'
                }

                const nextPapel = emptySlots > 0 ? determinarProximoPapel() : null
                const nextPapelLabel = nextPapel === 'professor_orientador' ? 'orientador' : nextPapel === 'responsavel' ? 'responsável' : 'estudante'
                const multiInput = multiSlotInputs[equipe.id] || {}

                return (
                  <React.Fragment key={equipe.id}>
                    <div className="mt-7 w-full overflow-hidden bg-[#5f5f5f]">
                      <div className="grid gap-8 px-5 pb-12 pt-4 text-white sm:grid-cols-[1.35fr_1fr] sm:gap-10 md:px-6 md:pb-[58px]">
                        <div className="flex flex-col justify-between gap-8">
                          <div>
                            <p className="text-[13px] leading-tight text-white/80">Equipe #</p>
                            <p className="text-[13px] leading-tight text-white/80">{equipe.id}</p>
                          </div>
                          <h2 className="text-[1.35rem] font-medium leading-tight text-white sm:text-[1.55rem]">
                            {equipe.nome || 'Nome da equipe'}
                          </h2>
                        </div>
                        <div className="space-y-3 pt-10 text-[13px] leading-tight text-white/80 sm:max-w-[180px]">
                          <div>
                            <p className="text-white">Escola:</p>
                            <p>{equipe.escola || '(escola da inscrição)'}</p>
                          </div>
                          <div>
                            <p className="text-white">Responsável:</p>
                            <p>{equipe.criadorNome || '(dono da conta)'}</p>
                          </div>
                          <div>
                            <p className="text-white">Modalidade:</p>
                            <p className="capitalize">{formatarModalidade}</p>
                          </div>
                        </div>
                      </div>

                      {membrosOrdenados.map((m, i) => (
                        <div key={i}>
                          <div className="bg-[#8f0000] px-5 py-[13px] text-[12px] font-semibold leading-tight text-white">
                            <p className="flex items-center gap-4">
                              <span aria-hidden="true" className="inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                                  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                                </svg>
                              </span>
                              <span>{m.nome} ({m.email})</span>
                              {podeRemover && (
                                <button
                                  onClick={() => handleRemoverMembro(m)}
                                  className="ml-auto text-[10px] underline hover:text-white/70"
                                >
                                  Remover
                                </button>
                              )}
                            </p>
                          </div>
                          <div className="bg-[#650000] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                            <p>
                              <span className="inline-flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
                                  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                                </svg>
                                <span>Tudo certo! {m.nome} {m.uid === equipe.criadorUid ? 'já criou uma conta!' : 'já faz parte da equipe.'}</span>
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}

                      {emptySlots > 0 && podeAddMembro ? (
                        <div>
                          <form
                            onSubmit={(e) => { e.preventDefault(); handleAddMembroMulti(nextPapel, multiInput) }}
                            className="grid gap-3 bg-[#bfbfbf] px-5 py-[10px] sm:grid-cols-2 sm:gap-8"
                          >
                            <label className="flex min-w-0 items-center gap-2">
                              <span aria-hidden="true" className="text-[18px] font-bold leading-none text-[#ffe15a]">!</span>
                              <input
                                placeholder={`Nome do ${nextPapelLabel}`}
                                value={multiInput.nome || ''}
                                onChange={(e) => setMultiSlotInputs(prev => ({ ...prev, [equipe.id]: { ...prev[equipe.id], nome: e.target.value } }))}
                                className="h-[20px] min-w-0 flex-1 rounded-[3px] bg-[#e7e7e7] px-2 text-[10px] italic leading-none text-[#555] outline-none placeholder:text-[#aaa]"
                              />
                            </label>
                            <label className="flex min-w-0 items-center gap-2">
                              <span aria-hidden="true" className="text-[18px] font-bold leading-none text-[#ffe15a]">!</span>
                              <input
                                placeholder={`Email do ${nextPapelLabel}`}
                                value={multiInput.email || ''}
                                onChange={(e) => setMultiSlotInputs(prev => ({ ...prev, [equipe.id]: { ...prev[equipe.id], email: e.target.value } }))}
                                className="h-[20px] min-w-0 flex-1 rounded-[3px] bg-[#e7e7e7] px-2 text-[10px] italic leading-none text-[#555] outline-none placeholder:text-[#aaa]"
                              />
                            </label>
                            <button type="submit" className="sr-only">Adicionar integrante</button>
                          </form>
                          <div className="bg-[#4f4f4f] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                            <p>
                              <span className="inline-flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-arrow-right-short" viewBox="0 0 16 16">
                                  <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                                </svg>
                                <span>A equipe falta integrantes!</span>
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : emptySlots > 0 ? (
                        Array.from({ length: emptySlots }).map((_, i) => (
                          <div key={`empty-${i}`}>
                            <div className="bg-[#bfbfbf] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                              <p>Vaga disponível</p>
                            </div>
                            <div className="bg-[#4f4f4f] px-5 py-[10px] text-[11px] font-semibold leading-tight text-white">
                              <p>
                                <span className="inline-flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-arrow-right-short" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                                  </svg>
                                  <span>A equipe falta integrantes!</span>
                                </span>
                              </p>
                            </div>
                          </div>
                        ))
                      ) : null}

                    </div>

                    <div className="mt-7 text-center">
                      {membrosAtivos.length === 4 ? (
                        <a href={`/sala-de-equipe?equipeId=${equipe.id}`}
                          className="inline-block bg-white px-8 py-3 text-sm font-semibold text-[#830000] transition-colors hover:bg-gray-100">
                          Sala de Equipe
                        </a>
                      ) : !podeAddMembro && (
                        <p className="text-white/60 text-sm">Aguardando os administradores completarem a equipe.</p>
                      )}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
      </section>
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

        <main style={{ backgroundImage: 'url(/bg-dhpb.svg)' }} className='w-full bg-cover bg-center px-4 pb-8 sm:px-6 md:px-8'>
          {equipeId ? (
            <SingleTeamView equipeId={equipeId} authUser={authUser} userData={userData} />
          ) : (
            <div className="py-12">
              <MultiTeamView authUser={authUser} userData={userData} edicoes={edicoes} />
            </div>
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
