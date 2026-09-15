import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  writeBatch,
  updateDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function normalizarEspacos(raw) {
  return String(raw || '').trim().replace(/\s+/g, ' ')
}

export function normalizarNomeEquipe(nome) {
  const mapa = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '8': 'b', '7': 't', '2': 'z', '6': 'g', '9': 'q' }
  const acentos = { 'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n' }
  let s = String(nome || '').toLowerCase().trim()
  let r = ''
  for (const ch of s) {
    if (acentos[ch]) { r += acentos[ch]; continue }
    if (ch >= 'a' && ch <= 'z') { r += ch; continue }
    if (ch >= '0' && ch <= '9') { r += mapa[ch] || ''; continue }
  }
  return r
}

export function chaveMembroIndexCanonico(email, edicaoId) {
  return btoa(String(email || '').trim().toLowerCase()).replace(/=+$/, '') + '_' + edicaoId
}

export function chavesMembroIndex(email, edicaoId) {
  const raw = String(email || '').trim()
  const lower = raw.toLowerCase()
  const keys = new Set()
  for (const e of [raw, lower]) {
    if (!e) continue
    keys.add(btoa(e).replace(/=+$/, '') + '_' + edicaoId)
  }
  return [...keys]
}

export function calcularIsCompleta(membrosAtuais, novoMembro, op) {
  let lista = (membrosAtuais || []).filter((m) => m.status === 'ativo')
  if (op === 'add') lista.push(novoMembro)
  else if (op === 'remove') lista = lista.filter((m) => m.uid !== novoMembro.uid)

  const profs = lista.filter((m) => m.papel === 'professor_orientador').length
  const resps = lista.filter((m) => m.papel === 'responsavel').length
  const alunos = lista.filter((m) => m.papel === 'aluno').length
  return profs === 1 && resps === 1 && alunos === 2
}

export async function listarEdicoes() {
  const snap = await getDocs(query(collection(db, 'edicoes'), limit(20)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function buscarUserPorEmail(email) {
  const termo = String(email || '').trim()
  if (!termo) return null
  const tentativas = [...new Set([termo.toLowerCase(), termo])]
  for (const e of tentativas) {
    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', e), limit(1)))
    if (!snap.empty) {
      const d = snap.docs[0]
      return { id: d.id, ...d.data() }
    }
  }
  return null
}

export async function buscarUserPorUid(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function carregarEquipe(equipeId) {
  const snap = await getDoc(doc(db, 'equipes', equipeId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

async function coletarEquipeIdsDoUsuario(user, edicaoIds) {
  const uid = user.id
  const ids = new Set()

  const pSnap = await getDocs(query(collection(db, 'users', uid, 'participacoes'), limit(50)))
  pSnap.forEach((d) => {
    const equipeId = d.data().equipeId
    if (equipeId) ids.add(equipeId)
  })

  for (const edicaoId of edicaoIds) {
    for (const key of chavesMembroIndex(user.email, edicaoId)) {
      const mi = await getDoc(doc(db, 'membro-index', key))
      if (mi.exists() && mi.data().equipeId) ids.add(mi.data().equipeId)
    }
  }

  if (user.tipo === 'professor') {
    const restSnap = await getDocs(query(
      collection(db, 'equipes'),
      where('orientadorUids', 'array-contains', uid),
      limit(30)
    ))
    restSnap.forEach((d) => ids.add(d.id))
  }

  return [...ids]
}

export async function listarQuestionarios(uid) {
  const snap = await getDocs(query(collection(db, 'users', uid, 'questionarios'), limit(50)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function salvarQuestionario(uid, edicaoId, data) {
  await setDoc(doc(db, 'users', uid, 'questionarios', edicaoId), data)
}

export async function apagarQuestionario(uid, edicaoId) {
  await deleteDoc(doc(db, 'users', uid, 'questionarios', edicaoId))
}

export async function criarEquipeAdmin({ edicaoId, nome, escola, tipoEscola, modalidade, criador }) {
  const nomeTrim = String(nome || '').trim()
  if (!edicaoId) throw new Error('Selecione a edição.')
  if (!nomeTrim) throw new Error('Digite o nome da equipe.')
  if (!escola?.id || !escola?.nome) throw new Error('Selecione uma escola da lista.')
  if (!tipoEscola) throw new Error('Selecione o tipo da escola.')
  if (!modalidade) throw new Error('Selecione a modalidade.')
  if (!criador?.id) throw new Error('Criador não encontrado. Busque o e-mail da conta.')

  const nomeLowerBusca = nomeTrim.toLowerCase()
  const dupSnap = await getDocs(query(
    collection(db, 'equipes'),
    where('edicaoId', '==', edicaoId),
    where('nomeLower', '==', nomeLowerBusca),
    limit(1)
  ))
  if (!dupSnap.empty) throw new Error('Já existe uma equipe com este nome nesta edição.')

  const papelCriador = criador.tipo === 'professor' ? 'professor_orientador' : 'responsavel'
  const nomeMembro = `${criador.nome || ''} ${criador.sobrenome || ''}`.trim()
  const equipeRef = doc(collection(db, 'equipes'))
  const miKey = chaveMembroIndexCanonico(criador.email, edicaoId)

  if (papelCriador !== 'professor_orientador') {
    const miSnap = await getDoc(doc(db, 'membro-index', miKey))
    if (miSnap.exists() && miSnap.data().equipeId !== equipeRef.id) {
      throw new Error('Este usuário já está em outra equipe nesta edição.')
    }
  }

  const pExist = await getDoc(doc(db, 'users', criador.id, 'participacoes', edicaoId))
  if (pExist.exists() && papelCriador !== 'professor_orientador') {
    throw new Error('Este usuário já tem participação nesta edição.')
  }

  const batch = writeBatch(db)
  const payload = {
    edicaoId,
    nome: nomeTrim,
    nomeLower: nomeLowerBusca,
    nomeNormalized: normalizarNomeEquipe(nomeTrim),
    escola: escola.nome,
    escolaId: escola.id,
    tipoEscola,
    modalidade,
    criadorUid: criador.id,
    criadorNome: nomeMembro,
    criadorEmail: criador.email,
    membros: [
      { uid: criador.id, nome: nomeMembro, email: criador.email, papel: papelCriador, status: 'ativo' },
    ],
    createdAt: new Date().toISOString(),
  }
  if (criador.tipo === 'professor') payload.orientadorUids = [criador.id]
  batch.set(equipeRef, payload)

  if (!pExist.exists()) {
    batch.set(doc(db, 'users', criador.id, 'participacoes', edicaoId), {
      equipeId: equipeRef.id,
      papel: papelCriador,
    })
  }

  const miSnap = await getDoc(doc(db, 'membro-index', miKey))
  if (!miSnap.exists()) {
    batch.set(doc(db, 'membro-index', miKey), {
      equipeId: equipeRef.id,
      papel: papelCriador,
      uid: criador.id,
    })
  }

  await batch.commit()
  return equipeRef.id
}

export async function renomearEquipe(equipe, novoNome) {
  const nomeTrim = String(novoNome || '').trim()
  if (!nomeTrim) throw new Error('O nome da equipe não pode ser vazio.')
  if (nomeTrim === equipe.nome) return

  const nomeLowerBusca = nomeTrim.toLowerCase()
  const dupSnap = await getDocs(query(
    collection(db, 'equipes'),
    where('edicaoId', '==', equipe.edicaoId),
    where('nomeLower', '==', nomeLowerBusca),
    limit(5)
  ))
  const conflito = dupSnap.docs.some((d) => d.id !== equipe.id)
  if (conflito) throw new Error('Já existe uma equipe com este nome nesta edição.')

  await updateDoc(doc(db, 'equipes', equipe.id), {
    nome: nomeTrim,
    nomeLower: nomeLowerBusca,
    nomeNormalized: normalizarNomeEquipe(nomeTrim),
    ultimoNomeEditadoEm: Date.now(),
  })
}

export async function atualizarEscolaEquipe(equipe, { escola, tipoEscola, modalidade }) {
  const updates = {}
  if (escola?.id && escola?.nome) {
    updates.escola = escola.nome
    updates.escolaId = escola.id
  }
  if (tipoEscola) updates.tipoEscola = tipoEscola
  if (modalidade) updates.modalidade = modalidade
  if (Object.keys(updates).length === 0) throw new Error('Nada para atualizar.')
  await updateDoc(doc(db, 'equipes', equipe.id), updates)
}

export async function adicionarMembro(equipe, email, papel) {
  const user = await buscarUserPorEmail(email)
  if (!user) throw new Error('Usuário com este e-mail não encontrado.')
  const membros = equipe.membros || []
  if (membros.some((m) => m.uid === user.id)) throw new Error('Este usuário já é membro da equipe.')

  if (papel === 'professor_orientador' && user.tipo !== 'professor') {
    throw new Error('Apenas contas do tipo professor podem ser orientadores.')
  }
  if (papel !== 'professor_orientador' && user.tipo === 'professor') {
    throw new Error('Professor não pode entrar como estudante. Use o papel orientador.')
  }

  if (papel !== 'professor_orientador') {
    for (const key of chavesMembroIndex(user.email, equipe.edicaoId)) {
      const miSnap = await getDoc(doc(db, 'membro-index', key))
      if (miSnap.exists() && miSnap.data().equipeId !== equipe.id) {
        throw new Error('Este usuário já está em outra equipe nesta edição.')
      }
    }
  }

  const nome = `${user.nome || ''} ${user.sobrenome || ''}`.trim()
  const novo = { uid: user.id, nome, email: user.email, papel, status: 'ativo' }
  const updates = {
    membros: [...membros, novo],
    isCompleta: calcularIsCompleta(membros.filter((m) => m.status === 'ativo'), novo, 'add'),
  }
  if (papel === 'professor_orientador') {
    const uids = [...new Set([...(equipe.orientadorUids || []), user.id])]
    updates.orientadorUids = uids
  }

  const batch = writeBatch(db)
  batch.update(doc(db, 'equipes', equipe.id), updates)

  const pRef = doc(db, 'users', user.id, 'participacoes', equipe.edicaoId)
  const pExist = await getDoc(pRef)
  if (!pExist.exists()) {
    batch.set(pRef, { equipeId: equipe.id, papel })
  }

  const miKey = chaveMembroIndexCanonico(user.email, equipe.edicaoId)
  const miExist = await getDoc(doc(db, 'membro-index', miKey))
  if (!miExist.exists()) {
    batch.set(doc(db, 'membro-index', miKey), { equipeId: equipe.id, papel, uid: user.id })
  }

  await batch.commit()
  return { ...equipe, ...updates }
}

export async function removerMembro(equipe, membro) {
  const membrosAtivos = (equipe.membros || []).filter((m) => m.status !== 'inativo')
  const membros = (equipe.membros || []).filter((m) => m.uid !== membro.uid)
  const updates = {
    membros,
    isCompleta: calcularIsCompleta(membrosAtivos, membro, 'remove'),
  }
  if (membro.papel === 'professor_orientador') {
    updates.orientadorUids = (equipe.orientadorUids || []).filter((id) => id !== membro.uid)
  }

  const batch = writeBatch(db)
  batch.update(doc(db, 'equipes', equipe.id), updates)

  if (membro.papel === 'professor_orientador' && membro.uid) {
    const restSnap = await getDocs(query(
      collection(db, 'equipes'),
      where('orientadorUids', 'array-contains', membro.uid),
      limit(20)
    ))
    const outras = restSnap.docs.filter((d) => d.id !== equipe.id && d.data().edicaoId === equipe.edicaoId)
    if (outras.length > 0) {
      const pRef = doc(db, 'users', membro.uid, 'participacoes', equipe.edicaoId)
      const pSnap = await getDoc(pRef)
      if (!pSnap.exists() || pSnap.data().equipeId === equipe.id) {
        batch.set(pRef, { equipeId: outras[0].id, papel: membro.papel || 'professor_orientador' })
      }
      await batch.commit()
      return { ...equipe, ...updates }
    }
  }

  if (membro.uid) {
    batch.delete(doc(db, 'users', membro.uid, 'participacoes', equipe.edicaoId))
  }
  for (const key of chavesMembroIndex(membro.email, equipe.edicaoId)) {
    batch.delete(doc(db, 'membro-index', key))
  }
  await batch.commit()
  return { ...equipe, ...updates }
}

export async function trocarPapelMembro(equipe, membro, novoPapel) {
  if (membro.papel === novoPapel) return equipe
  if (!['aluno', 'responsavel', 'professor_orientador'].includes(novoPapel)) {
    throw new Error('Papel inválido.')
  }

  const membros = (equipe.membros || []).map((m) => (
    m.uid === membro.uid ? { ...m, papel: novoPapel } : m
  ))
  let orientadorUids = [...(equipe.orientadorUids || [])]
  if (membro.papel === 'professor_orientador' && novoPapel !== 'professor_orientador') {
    orientadorUids = orientadorUids.filter((id) => id !== membro.uid)
  }
  if (novoPapel === 'professor_orientador' && !orientadorUids.includes(membro.uid)) {
    orientadorUids.push(membro.uid)
  }

  const ativos = membros.filter((m) => m.status === 'ativo')
  const dummy = { uid: '__none__' }
  const isCompleta = calcularIsCompleta(ativos, dummy, 'remove')

  const batch = writeBatch(db)
  batch.update(doc(db, 'equipes', equipe.id), { membros, orientadorUids, isCompleta })
  if (membro.uid) {
    batch.set(doc(db, 'users', membro.uid, 'participacoes', equipe.edicaoId), {
      equipeId: equipe.id,
      papel: novoPapel,
    })
  }
  const miKey = chaveMembroIndexCanonico(membro.email, equipe.edicaoId)
  const miSnap = await getDoc(doc(db, 'membro-index', miKey))
  if (miSnap.exists()) {
    batch.set(doc(db, 'membro-index', miKey), { ...miSnap.data(), papel: novoPapel, equipeId: equipe.id, uid: membro.uid })
  }
  await batch.commit()
  return { ...equipe, membros, orientadorUids, isCompleta }
}

export async function moverMembro(equipeOrigem, membro, equipeDestinoId) {
  if (!equipeDestinoId) throw new Error('Informe o ID da equipe destino.')
  if (equipeDestinoId === equipeOrigem.id) throw new Error('A equipe destino é a mesma.')

  const destino = await carregarEquipe(equipeDestinoId)
  if (!destino) throw new Error('Equipe destino não encontrada.')
  if (destino.edicaoId !== equipeOrigem.edicaoId) throw new Error('As equipes precisam ser da mesma edição.')
  if ((destino.membros || []).some((m) => m.uid === membro.uid)) {
    throw new Error('O membro já está na equipe destino.')
  }

  if (membro.papel !== 'professor_orientador') {
    for (const key of chavesMembroIndex(membro.email, destino.edicaoId)) {
      const miSnap = await getDoc(doc(db, 'membro-index', key))
      if (miSnap.exists() && miSnap.data().equipeId && miSnap.data().equipeId !== equipeOrigem.id && miSnap.data().equipeId !== destino.id) {
        throw new Error('Este usuário já está em outra equipe nesta edição.')
      }
    }
  }

  const origemMembros = (equipeOrigem.membros || []).filter((m) => m.uid !== membro.uid)
  const origemUpdates = {
    membros: origemMembros,
    isCompleta: calcularIsCompleta((equipeOrigem.membros || []).filter((m) => m.status === 'ativo'), membro, 'remove'),
  }
  if (membro.papel === 'professor_orientador') {
    origemUpdates.orientadorUids = (equipeOrigem.orientadorUids || []).filter((id) => id !== membro.uid)
  }

  const destMembros = [...(destino.membros || []), { ...membro, status: 'ativo' }]
  const destUpdates = {
    membros: destMembros,
    isCompleta: calcularIsCompleta((destino.membros || []).filter((m) => m.status === 'ativo'), membro, 'add'),
  }
  if (membro.papel === 'professor_orientador') {
    destUpdates.orientadorUids = [...new Set([...(destino.orientadorUids || []), membro.uid])]
  }

  const batch = writeBatch(db)
  batch.update(doc(db, 'equipes', equipeOrigem.id), origemUpdates)
  batch.update(doc(db, 'equipes', destino.id), destUpdates)
  if (membro.uid) {
    batch.set(doc(db, 'users', membro.uid, 'participacoes', destino.edicaoId), {
      equipeId: destino.id,
      papel: membro.papel,
    })
  }

  const miKey = chaveMembroIndexCanonico(membro.email, destino.edicaoId)
  const miSnap = await getDoc(doc(db, 'membro-index', miKey))
  if (membro.papel === 'professor_orientador') {
    if (miSnap.exists() && miSnap.data().equipeId === equipeOrigem.id) {
      batch.set(doc(db, 'membro-index', miKey), { ...miSnap.data(), equipeId: destino.id, papel: membro.papel, uid: membro.uid })
    } else if (!miSnap.exists()) {
      batch.set(doc(db, 'membro-index', miKey), { equipeId: destino.id, papel: membro.papel, uid: membro.uid })
    }
  } else {
    for (const key of chavesMembroIndex(membro.email, destino.edicaoId)) {
      if (key !== miKey) batch.delete(doc(db, 'membro-index', key))
    }
    batch.set(doc(db, 'membro-index', miKey), { equipeId: destino.id, papel: membro.papel, uid: membro.uid })
  }

  await batch.commit()
  return { origem: { ...equipeOrigem, ...origemUpdates }, destino: { ...destino, ...destUpdates } }
}

export async function trocarMembros(equipeA, membroA, equipeBId, emailB) {
  const equipeB = await carregarEquipe(equipeBId)
  if (!equipeB) throw new Error('Equipe B não encontrada.')
  if (equipeB.edicaoId !== equipeA.edicaoId) throw new Error('As equipes precisam ser da mesma edição.')

  const membroB = (equipeB.membros || []).find((m) => String(m.email || '').toLowerCase() === String(emailB || '').trim().toLowerCase())
  if (!membroB) throw new Error('Membro com este e-mail não está na equipe B.')
  if (membroA.uid === membroB.uid) throw new Error('São a mesma pessoa.')

  const updateA = {
    membros: (equipeA.membros || []).filter((m) => m.uid !== membroA.uid).concat({ ...membroB }),
  }
  const updateB = {
    membros: (equipeB.membros || []).filter((m) => m.uid !== membroB.uid).concat({ ...membroA }),
  }

  if (membroA.papel === 'professor_orientador' || membroB.papel === 'professor_orientador') {
    let uidsA = [...(equipeA.orientadorUids || [])]
    let uidsB = [...(equipeB.orientadorUids || [])]
    if (membroA.papel === 'professor_orientador') {
      uidsA = uidsA.filter((id) => id !== membroA.uid)
      uidsB = [...new Set([...uidsB, membroA.uid])]
    }
    if (membroB.papel === 'professor_orientador') {
      uidsB = uidsB.filter((id) => id !== membroB.uid)
      uidsA = [...new Set([...uidsA, membroB.uid])]
    }
    updateA.orientadorUids = uidsA
    updateB.orientadorUids = uidsB
  }

  const batch = writeBatch(db)
  batch.update(doc(db, 'equipes', equipeA.id), updateA)
  batch.update(doc(db, 'equipes', equipeB.id), updateB)
  if (membroA.uid) {
    batch.set(doc(db, 'users', membroA.uid, 'participacoes', equipeA.edicaoId), { equipeId: equipeB.id, papel: membroA.papel })
  }
  if (membroB.uid) {
    batch.set(doc(db, 'users', membroB.uid, 'participacoes', equipeB.edicaoId), { equipeId: equipeA.id, papel: membroB.papel })
  }

  const keyA = chaveMembroIndexCanonico(membroA.email, equipeA.edicaoId)
  const keyB = chaveMembroIndexCanonico(membroB.email, equipeB.edicaoId)
  const [snapA, snapB] = await Promise.all([
    getDoc(doc(db, 'membro-index', keyA)),
    getDoc(doc(db, 'membro-index', keyB)),
  ])
  if (snapA.exists()) {
    batch.set(doc(db, 'membro-index', keyA), { ...snapA.data(), equipeId: equipeB.id })
  }
  if (snapB.exists()) {
    batch.set(doc(db, 'membro-index', keyB), { ...snapB.data(), equipeId: equipeA.id })
  }

  await batch.commit()
  return { equipeA: { ...equipeA, ...updateA }, equipeB: { ...equipeB, ...updateB } }
}

export async function recriarMembroIndex({ email, edicaoId, equipeId, papel, uid }) {
  if (!email || !edicaoId || !equipeId || !uid) throw new Error('E-mail, edição, equipe e uid são obrigatórios.')
  const key = chaveMembroIndexCanonico(email, edicaoId)
  await setDoc(doc(db, 'membro-index', key), { equipeId, papel: papel || '', uid })
  return key
}

export async function espelharNomeNasEquipes(user, { nome, sobrenome }, edicaoIds) {
  const nomeCompleto = `${nome} ${sobrenome}`.trim()
  const ids = await coletarEquipeIdsDoUsuario(user, edicaoIds)
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', user.id), { nome, sobrenome })
  for (const equipeId of ids) {
    const snap = await getDoc(doc(db, 'equipes', equipeId))
    if (!snap.exists()) continue
    const data = snap.data()
    const membros = (data.membros || []).map((m) => (
      m.uid === user.id ? { ...m, nome: nomeCompleto } : m
    ))
    const updates = { membros }
    if (data.criadorUid === user.id) updates.criadorNome = nomeCompleto
    batch.update(doc(db, 'equipes', equipeId), updates)
  }
  await batch.commit()
}

export async function reescreverEmailNasEquipes(user, emailAntigo, emailNovo, edicaoIds) {
  const ids = await coletarEquipeIdsDoUsuario({ ...user, email: emailAntigo }, edicaoIds)
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', user.id), { email: emailNovo })

  const vinculosPorEdicao = new Map()

  for (const equipeId of ids) {
    const snap = await getDoc(doc(db, 'equipes', equipeId))
    if (!snap.exists()) continue
    const data = snap.data()
    const membros = (data.membros || []).map((m) => (
      m.uid === user.id ? { ...m, email: emailNovo } : m
    ))
    const updates = { membros }
    if (data.criadorUid === user.id) updates.criadorEmail = emailNovo
    batch.update(doc(db, 'equipes', equipeId), updates)

    const membro = (data.membros || []).find((m) => m.uid === user.id)
    if (data.edicaoId) {
      vinculosPorEdicao.set(data.edicaoId, {
        equipeId,
        papel: membro?.papel || '',
      })
    }
  }

  for (const edicaoId of edicaoIds) {
    for (const key of chavesMembroIndex(emailAntigo, edicaoId)) {
      const mi = await getDoc(doc(db, 'membro-index', key))
      if (mi.exists()) {
        const prev = mi.data()
        vinculosPorEdicao.set(edicaoId, {
          equipeId: prev.equipeId,
          papel: prev.papel || vinculosPorEdicao.get(edicaoId)?.papel || '',
        })
        batch.delete(doc(db, 'membro-index', key))
      }
    }
  }

  for (const [edicaoId, vinculo] of vinculosPorEdicao) {
    if (!vinculo.equipeId) continue
    const novaKey = chaveMembroIndexCanonico(emailNovo, edicaoId)
    batch.set(doc(db, 'membro-index', novaKey), {
      equipeId: vinculo.equipeId,
      papel: vinculo.papel || '',
      uid: user.id,
    })
  }

  await batch.commit()
}

export async function cascataExcluirFirestore(user, edicaoIds) {
  const uid = user.id
  const ids = await coletarEquipeIdsDoUsuario(user, edicaoIds)
  const qSnap = await getDocs(query(collection(db, 'users', uid, 'questionarios'), limit(50)))
  const pSnap = await getDocs(query(collection(db, 'users', uid, 'participacoes'), limit(50)))

  const batch = writeBatch(db)

  for (const equipeId of ids) {
    const snap = await getDoc(doc(db, 'equipes', equipeId))
    if (!snap.exists()) continue
    const data = snap.data()
    const membros = (data.membros || []).filter((m) => m.uid !== uid)
    const updates = { membros }
    if ((data.orientadorUids || []).includes(uid)) {
      updates.orientadorUids = (data.orientadorUids || []).filter((id) => id !== uid)
    }
    batch.update(doc(db, 'equipes', equipeId), updates)
  }

  qSnap.forEach((d) => batch.delete(doc(db, 'users', uid, 'questionarios', d.id)))
  pSnap.forEach((d) => batch.delete(doc(db, 'users', uid, 'participacoes', d.id)))

  for (const edicaoId of edicaoIds) {
    for (const key of chavesMembroIndex(user.email, edicaoId)) {
      batch.delete(doc(db, 'membro-index', key))
    }
  }

  batch.delete(doc(db, 'users', uid))
  await batch.commit()
}
