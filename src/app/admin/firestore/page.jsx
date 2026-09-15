'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, doc, getDoc, getDocs, query, where, deleteDoc, limit, updateDoc, deleteField } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import {
  listarEdicoes,
  buscarUserPorEmail,
  buscarUserPorUid,
  listarQuestionarios,
  salvarQuestionario,
  apagarQuestionario,
  criarEquipeAdmin,
  renomearEquipe,
  atualizarEscolaEquipe,
  adicionarMembro,
  removerMembro,
  trocarPapelMembro,
  moverMembro,
  trocarMembros,
  recriarMembroIndex,
  espelharNomeNasEquipes,
  reescreverEmailNasEquipes,
  cascataExcluirFirestore,
  carregarEquipe,
  chavesMembroIndex,
  normalizarEspacos,
  normalizarNomeEquipe,
} from './ops'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const inputCls = 'w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#82181A] transition-all'
const btnPrimary = 'bg-[#82181A] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer'
const btnGhost = 'border border-neutral-300 text-neutral-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'
const btnDanger = 'bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors cursor-pointer border border-red-200'

function extrairEquipeId(raw) {
  const t = String(raw || '').trim()
  if (!t) return { id: '', extraidoDeUrl: false }

  const qsMatch = t.match(/[?&]equipeId=([^&#]+)/i)
  if (qsMatch) {
    try {
      return { id: decodeURIComponent(qsMatch[1]).trim(), extraidoDeUrl: true }
    } catch {
      return { id: qsMatch[1].trim(), extraidoDeUrl: true }
    }
  }

  return { id: t, extraidoDeUrl: false }
}

function idFirestoreValido(id) {
  if (!id || id.includes('/') || id.includes('..')) return false
  return true
}

function parseNomeCompleto(raw) {
  const partes = normalizarEspacos(raw).split(/\s+/).filter(Boolean)
  if (partes.length < 2) return null
  return { nome: partes[0], sobrenome: partes.slice(1).join(' ') }
}

function normalizarNomeBuscaEscola(nome) {
  return String(nome || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

async function adminApi(path, body) {
  const user = auth.currentUser
  if (!user) throw new Error('Sessão Firebase do admin expirada. Entre de novo em /admin.')
  const token = await user.getIdToken()
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)
  return data
}

export default function FirestoreAdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const router = useRouter()

  const [aba, setAba] = useState('equipes')
  const [edicoes, setEdicoes] = useState([])

  const [equipeQuery, setEquipeQuery] = useState('')
  const [equipeResultados, setEquipeResultados] = useState([])
  const [buscandoEquipes, setBuscandoEquipes] = useState(false)
  const [equipeMensagem, setEquipeMensagem] = useState('')

  const [novaEquipe, setNovaEquipe] = useState({
    edicaoId: '', nome: '', criadorEmail: '', tipoEscola: '', modalidade: '',
  })
  const [escolaCriar, setEscolaCriar] = useState(null)
  const [buscaEscolaCriar, setBuscaEscolaCriar] = useState('')
  const [sugestoesCriar, setSugestoesCriar] = useState([])
  const [criandoEquipe, setCriandoEquipe] = useState(false)

  const [usuarioQuery, setUsuarioQuery] = useState('')
  const [usuarioResultado, setUsuarioResultado] = useState(null)
  const [usuarioCandidatos, setUsuarioCandidatos] = useState([])
  const [membroIndexResultados, setMembroIndexResultados] = useState([])
  const [participacoesResultados, setParticipacoesResultados] = useState([])
  const [questionarios, setQuestionarios] = useState([])
  const [authMeta, setAuthMeta] = useState(null)
  const [buscandoUsuario, setBuscandoUsuario] = useState(false)
  const [usuarioMensagem, setUsuarioMensagem] = useState('')

  const [editNome, setEditNome] = useState('')
  const [editSobrenome, setEditSobrenome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editTipo, setEditTipo] = useState('estudante')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmExcluir, setConfirmExcluir] = useState('')
  const [qEdicaoId, setQEdicaoId] = useState('')
  const [qJson, setQJson] = useState('')

  const [novaConta, setNovaConta] = useState({
    email: '', password: '', nome: '', sobrenome: '', tipo: 'estudante',
  })
  const [criandoConta, setCriandoConta] = useState(false)

  const escolasCacheRef = useRef([])
  const debounceRef = useRef(null)

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); setVerificando(false) }
  }, [router])

  useEffect(() => {
    if (!autenticado) return
    listarEdicoes().then((lista) => {
      setEdicoes(lista)
      setNovaEquipe((prev) => prev.edicaoId ? prev : { ...prev, edicaoId: lista[0]?.id || '' })
    }).catch(() => {})
  }, [autenticado])

  const edicaoIds = edicoes.map((e) => e.id)

  const buscarEscolas = useCallback(async (termo, setSugestoes) => {
    const termoBusca = normalizarNomeBuscaEscola(termo)
    if (!termoBusca) { setSugestoes([]); return }
    if (escolasCacheRef.current.length === 0) {
      const res = await fetch('/escolas-pb.json')
      if (!res.ok) return
      escolasCacheRef.current = await res.json()
    }
    const resultados = escolasCacheRef.current.filter((esc) => {
      const busca = esc.nomeBusca || esc.nomeLower || String(esc.nome || '').toLowerCase()
      return busca.includes(termoBusca)
    }).slice(0, 12)
    setSugestoes(resultados)
  }, [])

  const onBuscaEscolaCriar = (valor) => {
    setBuscaEscolaCriar(valor)
    setEscolaCriar(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarEscolas(valor, setSugestoesCriar), 300)
  }

  const buscarEquipes = async (e) => {
    e.preventDefault()
    const termo = equipeQuery.trim()
    if (!termo) return
    setBuscandoEquipes(true)
    setEquipeResultados([])
    setEquipeMensagem('')

    try {
      const resultados = []
      const { id, extraidoDeUrl } = extrairEquipeId(termo)
      let mensagem = ''

      if (idFirestoreValido(id)) {
        try {
          const docSnap = await getDoc(doc(db, 'equipes', id))
          if (docSnap.exists()) {
            resultados.push({ id: docSnap.id, ...docSnap.data() })
          }
        } catch (err) {
          console.error('Falha no getDoc da equipe:', err)
        }
      } else if (extraidoDeUrl) {
        mensagem = 'ID inválido na URL (equipeId ausente ou contém caracteres não permitidos).'
      }

      if (resultados.length === 0 && !extraidoDeUrl) {
        const termoNorm = normalizarNomeEquipe(termo)
        if (termoNorm) {
          const qNorm = query(
            collection(db, 'equipes'),
            where('nomeNormalized', '>=', termoNorm),
            where('nomeNormalized', '<=', termoNorm + '\uf8ff'),
            limit(15)
          )
          const snapNorm = await getDocs(qNorm)
          snapNorm.forEach((d) => {
            resultados.push({ id: d.id, ...d.data() })
          })
        }

        if (resultados.length === 0) {
          const q = query(collection(db, 'equipes'), where('nomeLower', '==', termo.toLowerCase()))
          const querySnapshot = await getDocs(q)
          querySnapshot.forEach((d) => {
            resultados.push({ id: d.id, ...d.data() })
          })
        }
      }

      setEquipeResultados(resultados)
      if (resultados.length === 0 && !mensagem) {
        mensagem = extraidoDeUrl
          ? `Nenhuma equipe encontrada para o ID extraído (${id}).`
          : 'Nenhuma equipe encontrada para esta busca.'
      }
      setEquipeMensagem(mensagem)
    } catch (err) {
      alert('Erro ao buscar equipes: ' + err.message)
    }
    setBuscandoEquipes(false)
  }

  const substituirEquipe = (atualizada) => {
    setEquipeResultados((prev) => prev.map((eq) => eq.id === atualizada.id ? atualizada : eq))
  }

  const excluirEquipeProfundamente = async (equipe) => {
    if (!window.confirm(`ATENÇÃO: Você está prestes a excluir a equipe "${equipe.nome}".\n\nIsso irá:\n1. Deletar a equipe.\n2. Deletar os arquivos membro-index de todos os integrantes.\n3. Deletar as participações desses usuários.\n\nEsta ação é IRREVERSÍVEL. Tem certeza?`)) return

    try {
      const edicaoId = equipe.edicaoId
      let indexExcluidos = 0
      let participacoesExcluidas = 0

      if (equipe.membros && Array.isArray(equipe.membros)) {
        for (const membro of equipe.membros) {
          if (membro.email) {
            for (const miKey of chavesMembroIndex(membro.email, edicaoId)) {
              await deleteDoc(doc(db, 'membro-index', miKey)).catch(() => {})
              indexExcluidos++
            }
          }
          if (membro.uid) {
            await deleteDoc(doc(db, 'users', membro.uid, 'participacoes', edicaoId)).catch(() => {})
            participacoesExcluidas++
          }
        }
      }

      await deleteDoc(doc(db, 'equipes', equipe.id))

      alert(`Equipe excluída com sucesso!\n\nForam apagados:\n- 1 Documento de Equipe\n- ${indexExcluidos} Documentos membro-index\n- ${participacoesExcluidas} Registros de participação`)

      setEquipeResultados((prev) => prev.filter((eq) => eq.id !== equipe.id))
    } catch (err) {
      alert('Erro ao excluir profundamente: ' + err.message)
    }
  }

  const carregarDetalhesUsuario = async (user) => {
    setUsuarioResultado(user)
    setEditNome(user.nome || '')
    setEditSobrenome(user.sobrenome || '')
    setEditEmail(user.email || '')
    setEditTipo(user.tipo === 'professor' ? 'professor' : 'estudante')
    setConfirmExcluir('')
    setNovaSenha('')
    setParticipacoesResultados([])
    setMembroIndexResultados([])
    setQuestionarios([])
    setAuthMeta(null)
    setQEdicaoId('')
    setQJson('')

    const partSnap = await getDocs(query(collection(db, 'users', user.id, 'participacoes'), limit(50)))
    const partArr = []
    partSnap.forEach((d) => partArr.push({ id: d.id, ...d.data() }))
    setParticipacoesResultados(partArr)

    const qs = await listarQuestionarios(user.id)
    setQuestionarios(qs)

    const emailQuery = (user.email || '').trim().toLowerCase()
    const miEncontrados = []
    if (emailQuery) {
      for (const ed of edicoes.length ? edicoes : await listarEdicoes()) {
        for (const miKey of chavesMembroIndex(user.email, ed.id)) {
          const miSnap = await getDoc(doc(db, 'membro-index', miKey))
          if (miSnap.exists() && !miEncontrados.some((m) => m.id === miSnap.id)) {
            miEncontrados.push({ id: miSnap.id, edicaoId: ed.id, ...miSnap.data() })
          }
        }
      }
    }
    setMembroIndexResultados(miEncontrados)

    try {
      const meta = await adminApi('/api/admin/auth/get-user', { uid: user.id, email: user.email })
      setAuthMeta(meta)
    } catch (err) {
      setAuthMeta({ erro: err.message })
    }
  }

  const buscarUsuario = async (e) => {
    e.preventDefault()
    const termo = normalizarEspacos(usuarioQuery)
    if (!termo) return

    setUsuarioMensagem('')
    setUsuarioResultado(null)
    setUsuarioCandidatos([])
    setMembroIndexResultados([])
    setParticipacoesResultados([])
    setQuestionarios([])
    setAuthMeta(null)

    setBuscandoUsuario(true)

    try {
      if (termo.includes('@')) {
        const emailQuery = termo.toLowerCase()
        const qUser = query(collection(db, 'users'), where('email', '==', emailQuery), limit(1))
        const userSnap = await getDocs(qUser)

        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0]
          await carregarDetalhesUsuario({ id: userDoc.id, ...userDoc.data() })
        } else {
          setUsuarioMensagem("Usuário não encontrado na coleção 'users'. Procurando apenas no membro-index...")
          const miEncontrados = []
          for (const ed of edicoes.length ? edicoes : await listarEdicoes()) {
            for (const miKey of chavesMembroIndex(emailQuery, ed.id)) {
              const miSnap = await getDoc(doc(db, 'membro-index', miKey))
              if (miSnap.exists() && !miEncontrados.some((m) => m.id === miSnap.id)) {
                miEncontrados.push({ id: miSnap.id, edicaoId: ed.id, ...miSnap.data() })
              }
            }
          }
          setMembroIndexResultados(miEncontrados)
        }
      } else if (!termo.includes(' ')) {
        const byUid = await buscarUserPorUid(termo)
        if (byUid) {
          await carregarDetalhesUsuario(byUid)
        } else {
          setUsuarioMensagem('Nenhuma pessoa encontrada com este UID. Para nome, digite nome e sobrenome.')
        }
      } else {
        const parsed = parseNomeCompleto(termo)
        if (!parsed) {
          setUsuarioMensagem('Digite o nome completo (nome e sobrenome, como no cadastro), um e-mail ou um UID.')
          setBuscandoUsuario(false)
          return
        }
        const { nome, sobrenome } = parsed
        const qUser = query(
          collection(db, 'users'),
          where('nome', '==', nome),
          where('sobrenome', '==', sobrenome),
          limit(15)
        )
        const userSnap = await getDocs(qUser)
        const candidatos = userSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setUsuarioCandidatos(candidatos)

        if (candidatos.length === 0) {
          setUsuarioMensagem('Nenhuma pessoa encontrada com esse nome e sobrenome (igualdade exata, como no cadastro).')
        } else if (candidatos.length === 1) {
          await carregarDetalhesUsuario(candidatos[0])
        } else {
          setUsuarioMensagem(`${candidatos.length} pessoas com o mesmo nome. Selecione uma para ver os detalhes.`)
        }
      }
    } catch (err) {
      if (err.code === 'failed-precondition') {
        const link = (err.message && err.message.match(/https:\/\/\S+/)) ? err.message.match(/https:\/\/\S+/)[0] : null
        setUsuarioMensagem(link
          ? `Índice composto necessário no Firestore (users: nome + sobrenome). Abra o link do Firebase para criar: ${link}`
          : 'Índice composto necessário no Firestore (coleção users, campos nome ASC e sobrenome ASC). Crie no Console e tente de novo.')
      } else {
        alert('Erro ao buscar usuário: ' + err.message)
      }
    }
    setBuscandoUsuario(false)
  }

  const selecionarCandidato = async (user) => {
    setBuscandoUsuario(true)
    setUsuarioMensagem('')
    try {
      await carregarDetalhesUsuario(user)
    } catch (err) {
      alert('Erro ao carregar detalhes: ' + err.message)
    }
    setBuscandoUsuario(false)
  }

  const excluirMembroIndex = async (id) => {
    if (!window.confirm(`Deletar o registro de membro-index "${id}"? Isso fará com que o sistema não saiba que este e-mail já está em uma equipe (pode gerar duplicidade se ele for adicionado de novo).`)) return
    try {
      await deleteDoc(doc(db, 'membro-index', id))
      setMembroIndexResultados((prev) => prev.filter((m) => m.id !== id))
      alert('Excluído com sucesso.')
    } catch (err) {
      alert('Erro ao excluir: ' + err.message)
    }
  }

  const excluirParticipacao = async (edicaoId) => {
    if (!usuarioResultado) return
    if (!window.confirm(`Deletar a participação deste usuário na edição ${edicaoId}? Ele perderá o acesso à sala de equipe dessa edição.`)) return
    try {
      await deleteDoc(doc(db, 'users', usuarioResultado.id, 'participacoes', edicaoId))
      setParticipacoesResultados((prev) => prev.filter((p) => p.id !== edicaoId))
      alert('Participação excluída.')
    } catch (err) {
      alert('Erro ao excluir: ' + err.message)
    }
  }

  const handleCriarConta = async (e) => {
    e.preventDefault()
    setCriandoConta(true)
    try {
      const data = await adminApi('/api/admin/auth/create-user', novaConta)
      alert(`Conta criada. UID: ${data.uid}`)
      setNovaConta({ email: '', password: '', nome: '', sobrenome: '', tipo: 'estudante' })
      const user = await buscarUserPorUid(data.uid)
      if (user) await carregarDetalhesUsuario(user)
    } catch (err) {
      alert(err.message)
    }
    setCriandoConta(false)
  }

  const handleSalvarPerfil = async () => {
    if (!usuarioResultado) return
    const nome = normalizarEspacos(editNome)
    const sobrenome = normalizarEspacos(editSobrenome)
    if (!nome || !sobrenome) { alert('Nome e sobrenome são obrigatórios.'); return }
    try {
      await espelharNomeNasEquipes(usuarioResultado, { nome, sobrenome }, edicaoIds)
      if (editTipo !== usuarioResultado.tipo) {
        await updateDoc(doc(db, 'users', usuarioResultado.id), { tipo: editTipo })
      }
      const atualizado = { ...usuarioResultado, nome, sobrenome, tipo: editTipo }
      setUsuarioResultado(atualizado)
      alert('Nome/tipo atualizados no perfil e nas equipes.')
    } catch (err) {
      alert('Erro ao salvar perfil: ' + err.message)
    }
  }

  const handleSalvarEmail = async () => {
    if (!usuarioResultado) return
    const emailNovo = normalizarEspacos(editEmail).toLowerCase()
    const emailAntigo = String(usuarioResultado.email || '').trim()
    if (!emailNovo.includes('@')) { alert('E-mail inválido.'); return }
    if (emailNovo === emailAntigo.toLowerCase()) { alert('O e-mail é o mesmo.'); return }
    if (!window.confirm(`Alterar e-mail de ${emailAntigo} para ${emailNovo} no Auth, no perfil e no membro-index?`)) return
    try {
      await adminApi('/api/admin/auth/update-user', { uid: usuarioResultado.id, email: emailNovo })
      await reescreverEmailNasEquipes(usuarioResultado, emailAntigo, emailNovo, edicaoIds)
      const atualizado = { ...usuarioResultado, email: emailNovo }
      await carregarDetalhesUsuario(atualizado)
      alert('E-mail atualizado no Auth e no Firestore.')
    } catch (err) {
      alert('Erro ao alterar e-mail: ' + err.message)
    }
  }

  const handleDefinirSenha = async () => {
    if (!usuarioResultado) return
    if (novaSenha.length < 6) { alert('Senha deve ter pelo menos 6 caracteres.'); return }
    try {
      await adminApi('/api/admin/auth/update-user', { uid: usuarioResultado.id, password: novaSenha })
      setNovaSenha('')
      alert('Senha atualizada no Auth.')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleResetSenha = async () => {
    if (!usuarioResultado?.email) return
    try {
      await sendPasswordResetEmail(auth, usuarioResultado.email)
      alert('E-mail de redefinição enviado.')
    } catch (err) {
      alert('Erro ao enviar reset: ' + (err.message || err.code))
    }
  }

  const handleExcluirConta = async () => {
    if (!usuarioResultado) return
    const email = String(usuarioResultado.email || '').trim().toLowerCase()
    if (email === 'admin@dhpb.com') { alert('Não é permitido excluir a conta admin.'); return }
    if (normalizarEspacos(confirmExcluir).toLowerCase() !== email) {
      alert('Digite o e-mail da conta para confirmar a exclusão.')
      return
    }
    if (!window.confirm(`Excluir em cascata ${email}? Auth + perfil + questionários + equipes/membro-index. Irreversível.`)) return
    try {
      await cascataExcluirFirestore(usuarioResultado, edicaoIds)
      try {
        await adminApi('/api/admin/auth/delete-user', { uid: usuarioResultado.id })
        alert('Conta excluída no Firestore e no Auth.')
      } catch (err) {
        alert('Firestore limpo. Auth pendente: ' + err.message)
      }
      setUsuarioResultado(null)
      setParticipacoesResultados([])
      setMembroIndexResultados([])
      setQuestionarios([])
      setAuthMeta(null)
      setConfirmExcluir('')
    } catch (err) {
      alert('Erro na cascata Firestore: ' + err.message)
    }
  }

  const handleSalvarQuestionario = async () => {
    if (!usuarioResultado || !qEdicaoId) { alert('Informe o edicaoId do questionário.'); return }
    let parsed
    try {
      parsed = qJson.trim() ? JSON.parse(qJson) : {}
    } catch {
      alert('JSON inválido.')
      return
    }
    try {
      await salvarQuestionario(usuarioResultado.id, qEdicaoId, parsed)
      const qs = await listarQuestionarios(usuarioResultado.id)
      setQuestionarios(qs)
      alert('Questionário salvo.')
    } catch (err) {
      alert('Erro ao salvar questionário: ' + err.message)
    }
  }

  const handleApagarQuestionario = async (edicaoId) => {
    if (!usuarioResultado) return
    if (!window.confirm(`Apagar questionário da edição ${edicaoId}? A pessoa verá o modal de novo.`)) return
    try {
      await apagarQuestionario(usuarioResultado.id, edicaoId)
      setQuestionarios((prev) => prev.filter((q) => q.id !== edicaoId))
      if (qEdicaoId === edicaoId) { setQEdicaoId(''); setQJson('') }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCriarEquipe = async (e) => {
    e.preventDefault()
    setCriandoEquipe(true)
    try {
      const criador = await buscarUserPorEmail(novaEquipe.criadorEmail)
      if (!criador) throw new Error('Conta do criador não encontrada. Crie a conta na aba Usuário primeiro.')
      const id = await criarEquipeAdmin({
        edicaoId: novaEquipe.edicaoId,
        nome: novaEquipe.nome,
        escola: escolaCriar,
        tipoEscola: novaEquipe.tipoEscola || escolaCriar?.tipo || '',
        modalidade: novaEquipe.modalidade,
        criador,
      })
      const eq = await carregarEquipe(id)
      if (eq) setEquipeResultados((prev) => [eq, ...prev.filter((p) => p.id !== id)])
      alert('Equipe criada: ' + id)
      setNovaEquipe((prev) => ({ ...prev, nome: '', criadorEmail: '' }))
      setEscolaCriar(null)
      setBuscaEscolaCriar('')
    } catch (err) {
      alert(err.message)
    }
    setCriandoEquipe(false)
  }

  if (verificando) return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Verificando...</p></div>

  return (
    <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]`}>
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div>
              <h1 className='text-lg font-bold text-[#82181A]'>Ferramentas de Suporte (Firestore)</h1>
              <p className='text-xs text-neutral-400'>Contas, equipes e questionários — sem console Firebase</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>
            Voltar ao Dashboard
          </button>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-6 py-8'>
        <div className='flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-neutral-200 inline-flex'>
          <button onClick={() => setAba('equipes')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${aba === 'equipes' ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>Equipes</button>
          <button onClick={() => setAba('usuarios')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${aba === 'usuarios' ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>Usuários</button>
        </div>

        {aba === 'equipes' && (
          <div className='space-y-6'>
            <form onSubmit={handleCriarEquipe} className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
              <h2 className='font-bold text-neutral-800'>Criar equipe</h2>
              <p className='text-xs text-neutral-500'>Não reabre o cadastro público. O criador precisa ter conta. Escola vem de escolas-pb.json.</p>
              <div className='grid gap-3 sm:grid-cols-2'>
                <select className={inputCls} value={novaEquipe.edicaoId} onChange={(e) => setNovaEquipe((p) => ({ ...p, edicaoId: e.target.value }))}>
                  <option value="">Edição...</option>
                  {edicoes.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome || ed.id}</option>)}
                </select>
                <input className={inputCls} placeholder="Nome da equipe" value={novaEquipe.nome} onChange={(e) => setNovaEquipe((p) => ({ ...p, nome: e.target.value }))} />
                <input className={inputCls} placeholder="E-mail do criador (conta existente)" value={novaEquipe.criadorEmail} onChange={(e) => setNovaEquipe((p) => ({ ...p, criadorEmail: e.target.value }))} />
                <div className='relative'>
                  <input className={inputCls} placeholder="Buscar escola..." value={buscaEscolaCriar} onChange={(e) => onBuscaEscolaCriar(e.target.value)} />
                  {sugestoesCriar.length > 0 && !escolaCriar && (
                    <div className='absolute z-10 w-full bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto'>
                      {sugestoesCriar.map((esc) => (
                        <button key={esc.id} type="button" onClick={() => { setEscolaCriar(esc); setBuscaEscolaCriar(esc.nome); setSugestoesCriar([]); setNovaEquipe((p) => ({ ...p, tipoEscola: p.tipoEscola || esc.tipo || '' })) }} className='w-full text-left p-3 text-sm hover:bg-[#82181A]/5 cursor-pointer'>
                          {esc.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select className={inputCls} value={novaEquipe.tipoEscola} onChange={(e) => setNovaEquipe((p) => ({ ...p, tipoEscola: e.target.value }))}>
                  <option value="">Tipo da escola...</option>
                  <option value="municipal">municipal</option>
                  <option value="estadual">estadual</option>
                  <option value="federal">federal</option>
                  <option value="particular">particular</option>
                  <option value="publica">publica</option>
                </select>
                <select className={inputCls} value={novaEquipe.modalidade} onChange={(e) => setNovaEquipe((p) => ({ ...p, modalidade: e.target.value }))}>
                  <option value="">Modalidade...</option>
                  <option value="fundamental">fundamental</option>
                  <option value="medio">medio</option>
                  <option value="eja">eja</option>
                  <option value="eja_fundamental">eja_fundamental</option>
                  <option value="eja_medio">eja_medio</option>
                </select>
              </div>
              <button type="submit" disabled={criandoEquipe} className={btnPrimary}>{criandoEquipe ? 'Criando...' : 'Criar equipe'}</button>
            </form>

            <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6'>
              <form onSubmit={buscarEquipes} className='flex flex-col sm:flex-row gap-3'>
                <input type="text" placeholder="ID, URL de montagem-equipe ou parte do nome (sem acento)..." value={equipeQuery} onChange={(e) => setEquipeQuery(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
                <button type="submit" disabled={buscandoEquipes} className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                  {buscandoEquipes ? 'Buscando...' : 'Buscar Equipe'}
                </button>
              </form>

              <div className='space-y-4'>
                {equipeResultados.length === 0 && !buscandoEquipes && equipeMensagem && (
                  <p className='text-neutral-500 text-sm'>{equipeMensagem}</p>
                )}
                {equipeResultados.map((eq) => (
                  <EquipeCard
                    key={eq.id}
                    eq={eq}
                    onRefresh={substituirEquipe}
                    onExcluir={excluirEquipeProfundamente}
                    buscarEscolas={buscarEscolas}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'usuarios' && (
          <div className='space-y-6'>
            <form onSubmit={handleCriarConta} className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4'>
              <h2 className='font-bold text-neutral-800'>Criar conta</h2>
              <p className='text-xs text-neutral-500'>Equivalente ao cadastro antigo. `/cadastro` público continua fechado. A sessão admin@dhpb.com não é substituída.</p>
              <div className='grid gap-3 sm:grid-cols-2'>
                <input className={inputCls} placeholder="E-mail" value={novaConta.email} onChange={(e) => setNovaConta((p) => ({ ...p, email: e.target.value }))} />
                <input className={inputCls} type="password" placeholder="Senha (≥ 6)" value={novaConta.password} onChange={(e) => setNovaConta((p) => ({ ...p, password: e.target.value }))} />
                <input className={inputCls} placeholder="Nome" value={novaConta.nome} onChange={(e) => setNovaConta((p) => ({ ...p, nome: e.target.value }))} />
                <input className={inputCls} placeholder="Sobrenome" value={novaConta.sobrenome} onChange={(e) => setNovaConta((p) => ({ ...p, sobrenome: e.target.value }))} />
                <select className={inputCls} value={novaConta.tipo} onChange={(e) => setNovaConta((p) => ({ ...p, tipo: e.target.value }))}>
                  <option value="estudante">estudante</option>
                  <option value="professor">professor</option>
                </select>
              </div>
              <button type="submit" disabled={criandoConta} className={btnPrimary}>{criandoConta ? 'Criando...' : 'Criar conta'}</button>
            </form>

            <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6'>
              <form onSubmit={buscarUsuario} className='flex flex-col sm:flex-row gap-3'>
                <input type="text" placeholder="E-mail, UID ou nome completo..." value={usuarioQuery} onChange={(e) => setUsuarioQuery(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
                <button type="submit" disabled={buscandoUsuario} className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                  {buscandoUsuario ? 'Buscando...' : 'Buscar'}
                </button>
              </form>
              {usuarioMensagem && (
                <p className='text-sm text-neutral-600'>{usuarioMensagem}</p>
              )}

              {usuarioCandidatos.length > 1 && (
                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-neutral-700'>Resultados</p>
                  {usuarioCandidatos.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selecionarCandidato(u)}
                      className={`w-full text-left bg-white border rounded-lg p-3 text-sm hover:border-[#82181A] transition-colors cursor-pointer ${usuarioResultado?.id === u.id ? 'border-[#82181A]' : 'border-neutral-200'}`}
                    >
                      <p className='font-semibold'>{u.nome} {u.sobrenome}</p>
                      <p className='text-neutral-500 text-xs'>{u.email} · {u.tipo}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className='grid gap-6 grid-cols-1 md:grid-cols-2'>
                <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4'>
                  <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Dados do Usuário</h3>
                  {usuarioResultado ? (
                    <div className='text-sm space-y-3 text-neutral-700'>
                      <p className='text-xs text-neutral-400 break-all'>UID: {usuarioResultado.id}</p>
                      <p><strong>Documento:</strong> {usuarioResultado.documentoStatus || 'N/A'}</p>
                      <p><strong>Telefone:</strong> {usuarioResultado.telefone || 'N/A'}</p>
                      <p><strong>Escola:</strong> {usuarioResultado.escola || 'N/A'}</p>
                      <input className={inputCls} value={editNome} onChange={(e) => setEditNome(e.target.value)} placeholder="Nome" />
                      <input className={inputCls} value={editSobrenome} onChange={(e) => setEditSobrenome(e.target.value)} placeholder="Sobrenome" />
                      <select className={inputCls} value={editTipo} onChange={(e) => setEditTipo(e.target.value)}>
                        <option value="estudante">estudante</option>
                        <option value="professor">professor</option>
                      </select>
                      <button type="button" onClick={handleSalvarPerfil} className={btnPrimary}>Salvar nome/tipo</button>
                      <input className={inputCls} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="E-mail" />
                      <button type="button" onClick={handleSalvarEmail} className={btnPrimary}>Salvar e-mail (Auth + Firestore)</button>
                      <input className={inputCls} type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha temporária" />
                      <div className='flex flex-wrap gap-2'>
                        <button type="button" onClick={handleDefinirSenha} className={btnGhost}>Definir senha</button>
                        <button type="button" onClick={handleResetSenha} className={btnGhost}>Enviar reset</button>
                      </div>
                      {authMeta && !authMeta.erro && (
                        <div className='text-xs text-neutral-500 space-y-1 pt-2 border-t border-neutral-200'>
                          <p>Auth e-mail: {authMeta.email || '—'}</p>
                          <p>Verificado: {authMeta.emailVerified ? 'sim' : 'não'} · Desativado: {authMeta.disabled ? 'sim' : 'não'}</p>
                          <p>Último login: {authMeta.lastSignInAt || '—'}</p>
                          <p>Criado em: {authMeta.creationTime || '—'}</p>
                        </div>
                      )}
                      {authMeta?.erro && <p className='text-xs text-amber-700'>{authMeta.erro}</p>}
                      <div className='pt-3 border-t border-red-200 space-y-2'>
                        <p className='text-xs text-red-700'>Excluir conta (cascata). Digite o e-mail para confirmar.</p>
                        <input className={inputCls} value={confirmExcluir} onChange={(e) => setConfirmExcluir(e.target.value)} placeholder={usuarioResultado.email || 'e-mail'} />
                        <button type="button" onClick={handleExcluirConta} className={btnDanger}>Excluir conta</button>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-neutral-400'>Nenhum perfil selecionado.</p>
                  )}
                </div>

                <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4'>
                  <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Participações (Equipes conectadas)</h3>
                  {participacoesResultados.length === 0 ? (
                    <p className='text-sm text-neutral-400'>Nenhuma participação registrada.</p>
                  ) : (
                    <div className='space-y-3'>
                      {participacoesResultados.map((p) => (
                        <div key={p.id} className='bg-white p-3 rounded-lg border border-neutral-200 text-xs flex justify-between items-center'>
                          <div>
                            <p><strong>Edição:</strong> {p.id}</p>
                            <p><strong>Equipe ID:</strong> {p.equipeId}</p>
                            <p><strong>Papel:</strong> {p.papel}</p>
                            {p.equipeId && (
                              <a href={`/montagem-equipe?equipeId=${p.equipeId}`} target="_blank" rel="noopener noreferrer" className='text-[#82181A] font-semibold hover:underline'>
                                Abrir montagem
                              </a>
                            )}
                          </div>
                          <button onClick={() => excluirParticipacao(p.id)} className='text-red-600 hover:bg-red-50 p-2 rounded-md font-semibold cursor-pointer'>
                            Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4 md:col-span-2'>
                  <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Questionários individuais</h3>
                  {usuarioResultado ? (
                    <div className='space-y-3'>
                      {questionarios.length === 0 ? (
                        <p className='text-sm text-neutral-400'>Nenhum questionário.</p>
                      ) : (
                        <div className='flex flex-wrap gap-2'>
                          {questionarios.map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => { setQEdicaoId(q.id); setQJson(JSON.stringify(q, null, 2)) }}
                              className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer ${qEdicaoId === q.id ? 'border-[#82181A] bg-[#82181A]/5' : 'border-neutral-200'}`}
                            >
                              {q.id}
                            </button>
                          ))}
                        </div>
                      )}
                      <input className={inputCls} placeholder="edicaoId (novo ou existente)" value={qEdicaoId} onChange={(e) => setQEdicaoId(e.target.value)} />
                      <textarea className={`${inputCls} font-mono text-xs min-h-40`} value={qJson} onChange={(e) => setQJson(e.target.value)} placeholder='{ "nomeCompleto": "..." }' />
                      <div className='flex flex-wrap gap-2'>
                        <button type="button" onClick={handleSalvarQuestionario} className={btnPrimary}>Salvar questionário</button>
                        {qEdicaoId && (
                          <button type="button" onClick={() => handleApagarQuestionario(qEdicaoId)} className={btnDanger}>Apagar este</button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-neutral-400'>Selecione uma pessoa.</p>
                  )}
                </div>

                <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4 md:col-span-2'>
                  <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Índices de Membro (membro-index)</h3>
                  <p className='text-xs text-neutral-500'>Isso é o que impede o usuário de entrar em outra equipe na mesma edição.</p>
                  {membroIndexResultados.length === 0 ? (
                    <p className='text-sm text-neutral-400'>Nenhum registro de membro-index encontrado.</p>
                  ) : (
                    <div className='grid gap-3 grid-cols-1 sm:grid-cols-2'>
                      {membroIndexResultados.map((mi) => (
                        <div key={mi.id} className='bg-white p-3 rounded-lg border border-neutral-200 text-xs flex justify-between items-center'>
                          <div className='break-all'>
                            <p><strong>Edição:</strong> {mi.edicaoId}</p>
                            <p><strong>Equipe ID:</strong> {mi.equipeId}</p>
                            <p><strong>ID do Registro:</strong> {mi.id}</p>
                          </div>
                          <button onClick={() => excluirMembroIndex(mi.id)} className='text-red-600 hover:bg-red-50 p-2 rounded-md font-semibold cursor-pointer ml-2'>
                            Excluir Index
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {usuarioResultado && (
                    <RecriarIndexForm user={usuarioResultado} edicoes={edicoes} onDone={(key) => alert('Index recriado: ' + key)} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function RecriarIndexForm({ user, edicoes, onDone }) {
  const [edicaoId, setEdicaoId] = useState(edicoes[0]?.id || '')
  const [equipeId, setEquipeId] = useState('')
  const [papel, setPapel] = useState('aluno')

  useEffect(() => {
    if (!edicaoId && edicoes[0]?.id) setEdicaoId(edicoes[0].id)
  }, [edicoes, edicaoId])

  return (
    <div className='flex flex-col sm:flex-row gap-2 items-stretch sm:items-end pt-2'>
      <select className={inputCls} value={edicaoId} onChange={(e) => setEdicaoId(e.target.value)}>
        {edicoes.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome || ed.id}</option>)}
      </select>
      <input className={inputCls} placeholder="equipeId" value={equipeId} onChange={(e) => setEquipeId(e.target.value)} />
      <select className={inputCls} value={papel} onChange={(e) => setPapel(e.target.value)}>
        <option value="aluno">aluno</option>
        <option value="responsavel">responsavel</option>
        <option value="professor_orientador">professor_orientador</option>
      </select>
      <button
        type="button"
        className={btnGhost}
        onClick={async () => {
          try {
            const key = await recriarMembroIndex({
              email: user.email,
              edicaoId,
              equipeId,
              papel,
              uid: user.id,
            })
            onDone(key)
          } catch (err) {
            alert(err.message)
          }
        }}
      >
        Recriar index
      </button>
    </div>
  )
}

function EquipeCard({ eq, onRefresh, onExcluir, buscarEscolas }) {
  const [nome, setNome] = useState(eq.nome || '')
  const [modalidade, setModalidade] = useState(eq.modalidade || '')
  const [tipoEscola, setTipoEscola] = useState(eq.tipoEscola || '')
  const [buscaEscola, setBuscaEscola] = useState(eq.escola || '')
  const [escolaSel, setEscolaSel] = useState(null)
  const [sugestoes, setSugestoes] = useState([])
  const [addEmail, setAddEmail] = useState('')
  const [addPapel, setAddPapel] = useState('aluno')
  const [moverUid, setMoverUid] = useState('')
  const [moverDestino, setMoverDestino] = useState('')
  const [swapUid, setSwapUid] = useState('')
  const [swapDestino, setSwapDestino] = useState('')
  const [swapEmail, setSwapEmail] = useState('')
  const [qEquipeJson, setQEquipeJson] = useState(
    eq.questionarioEquipe ? JSON.stringify(eq.questionarioEquipe, null, 2) : ''
  )
  const debounceRef = useRef(null)

  useEffect(() => {
    setNome(eq.nome || '')
    setModalidade(eq.modalidade || '')
    setTipoEscola(eq.tipoEscola || '')
    setBuscaEscola(eq.escola || '')
    setQEquipeJson(eq.questionarioEquipe ? JSON.stringify(eq.questionarioEquipe, null, 2) : '')
  }, [eq])

  const recarregar = async () => {
    const fresh = await carregarEquipe(eq.id)
    if (fresh) onRefresh(fresh)
  }

  return (
    <div className='border border-neutral-200 rounded-xl p-5 space-y-4 bg-neutral-50'>
      <div className='flex justify-between items-start flex-wrap gap-4'>
        <div>
          <h3 className='font-bold text-lg text-neutral-800'>{eq.nome} <span className='text-xs font-normal text-neutral-500 bg-neutral-200 px-2 py-1 rounded-md ml-2'>{eq.id}</span></h3>
          <p className='text-sm text-neutral-600 mt-1'>{eq.escola} — {eq.modalidade}</p>
          <p className='text-xs text-neutral-500 mt-1'>Criada por: {eq.criadorNome} ({eq.criadorUid})</p>
          <a
            href={`/montagem-equipe?equipeId=${eq.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className='inline-block mt-2 text-sm font-semibold text-[#82181A] hover:underline'
          >
            Abrir montagem
          </a>
        </div>
        <button onClick={() => onExcluir(eq)} className={btnDanger}>
          Excluir Equipe Profundamente
        </button>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 pt-3 border-t border-neutral-200'>
        <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} />
        <button type="button" className={btnPrimary} onClick={async () => {
          try {
            await renomearEquipe(eq, nome)
            await recarregar()
            alert('Nome atualizado.')
          } catch (err) { alert(err.message) }
        }}>Renomear (sem cooldown)</button>
        <div className='relative sm:col-span-2'>
          <input className={inputCls} value={buscaEscola} onChange={(e) => {
            const v = e.target.value
            setBuscaEscola(v)
            setEscolaSel(null)
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => buscarEscolas(v, setSugestoes), 300)
          }} placeholder="Buscar escola..." />
          {sugestoes.length > 0 && !escolaSel && (
            <div className='absolute z-10 w-full bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto'>
              {sugestoes.map((esc) => (
                <button key={esc.id} type="button" onClick={() => { setEscolaSel(esc); setBuscaEscola(esc.nome); setSugestoes([]); setTipoEscola(esc.tipo || tipoEscola) }} className='w-full text-left p-3 text-sm hover:bg-[#82181A]/5 cursor-pointer'>
                  {esc.nome}
                </button>
              ))}
            </div>
          )}
        </div>
        <select className={inputCls} value={tipoEscola} onChange={(e) => setTipoEscola(e.target.value)}>
          <option value="">Tipo...</option>
          <option value="municipal">municipal</option>
          <option value="estadual">estadual</option>
          <option value="federal">federal</option>
          <option value="particular">particular</option>
          <option value="publica">publica</option>
        </select>
        <select className={inputCls} value={modalidade} onChange={(e) => setModalidade(e.target.value)}>
          <option value="">Modalidade...</option>
          <option value="fundamental">fundamental</option>
          <option value="medio">medio</option>
          <option value="eja">eja</option>
          <option value="eja_fundamental">eja_fundamental</option>
          <option value="eja_medio">eja_medio</option>
        </select>
        <button type="button" className={btnGhost} onClick={async () => {
          try {
            await atualizarEscolaEquipe(eq, { escola: escolaSel, tipoEscola, modalidade })
            await recarregar()
            alert('Escola/modalidade atualizadas.')
          } catch (err) { alert(err.message) }
        }}>Salvar escola/modalidade</button>
      </div>

      <div className='pt-3 border-t border-neutral-200 space-y-3'>
        <p className='text-sm font-semibold text-neutral-700'>Membros Ativos ({eq.membros?.length || 0}):</p>
        <div className='grid gap-2 grid-cols-1 sm:grid-cols-2'>
          {(eq.membros || []).map((m, idx) => (
            <div key={m.uid || idx} className='bg-white border border-neutral-200 p-3 rounded-lg text-xs space-y-2'>
              <p className='font-semibold'>{m.nome}</p>
              <p className='text-neutral-500'>{m.email}</p>
              <p className='text-neutral-400 capitalize'>Papel: {m.papel} | Status: {m.status}</p>
              <p className='text-[10px] text-neutral-400 break-all'>UID: {m.uid}</p>
              <select
                className={inputCls}
                value={m.papel}
                onChange={async (e) => {
                  try {
                    const atualizada = await trocarPapelMembro(eq, m, e.target.value)
                    onRefresh(atualizada)
                  } catch (err) { alert(err.message) }
                }}
              >
                <option value="aluno">aluno</option>
                <option value="responsavel">responsavel</option>
                <option value="professor_orientador">professor_orientador</option>
              </select>
              <button type="button" className='text-red-600 font-semibold cursor-pointer' onClick={async () => {
                if (!window.confirm(`Remover ${m.nome}?`)) return
                try {
                  const atualizada = await removerMembro(eq, m)
                  onRefresh(atualizada)
                } catch (err) { alert(err.message) }
              }}>Remover</button>
            </div>
          ))}
        </div>

        <div className='flex flex-col sm:flex-row gap-2'>
          <input className={inputCls} placeholder="E-mail para adicionar" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
          <select className={inputCls} value={addPapel} onChange={(e) => setAddPapel(e.target.value)}>
            <option value="aluno">aluno</option>
            <option value="responsavel">responsavel</option>
            <option value="professor_orientador">professor_orientador</option>
          </select>
          <button type="button" className={btnPrimary} onClick={async () => {
            try {
              const atualizada = await adicionarMembro(eq, addEmail, addPapel)
              onRefresh(atualizada)
              setAddEmail('')
            } catch (err) { alert(err.message) }
          }}>Adicionar</button>
        </div>

        <div className='grid gap-2 sm:grid-cols-3'>
          <select className={inputCls} value={moverUid} onChange={(e) => setMoverUid(e.target.value)}>
            <option value="">Mover membro...</option>
            {(eq.membros || []).map((m) => (
              <option key={m.uid} value={m.uid}>{m.nome}</option>
            ))}
          </select>
          <input className={inputCls} placeholder="ID equipe destino" value={moverDestino} onChange={(e) => setMoverDestino(e.target.value)} />
          <button type="button" className={btnGhost} onClick={async () => {
            const membro = (eq.membros || []).find((m) => m.uid === moverUid)
            if (!membro) { alert('Selecione o membro.'); return }
            try {
              await moverMembro(eq, membro, moverDestino.trim())
              await recarregar()
              alert('Membro movido.')
            } catch (err) { alert(err.message) }
          }}>Mover</button>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
          <select className={inputCls} value={swapUid} onChange={(e) => setSwapUid(e.target.value)}>
            <option value="">Trocar este membro...</option>
            {(eq.membros || []).map((m) => (
              <option key={m.uid} value={m.uid}>{m.nome}</option>
            ))}
          </select>
          <input className={inputCls} placeholder="ID da outra equipe" value={swapDestino} onChange={(e) => setSwapDestino(e.target.value)} />
          <input className={inputCls} placeholder="E-mail na outra equipe" value={swapEmail} onChange={(e) => setSwapEmail(e.target.value)} />
          <button type="button" className={btnGhost} onClick={async () => {
            const membro = (eq.membros || []).find((m) => m.uid === swapUid)
            if (!membro) { alert('Selecione o membro.'); return }
            try {
              await trocarMembros(eq, membro, swapDestino.trim(), swapEmail)
              await recarregar()
              alert('Membros trocados.')
            } catch (err) { alert(err.message) }
          }}>Trocar</button>
        </div>
      </div>

      {eq.orientadorUids && eq.orientadorUids.length > 0 && (
        <div className='pt-3 border-t border-neutral-200'>
          <p className='text-xs font-semibold text-neutral-700'>Orientadores registrados (orientadorUids):</p>
          <p className='text-[10px] text-neutral-500 break-all'>{eq.orientadorUids.join(', ')}</p>
        </div>
      )}

      <div className='pt-3 border-t border-neutral-200 space-y-2'>
        <p className='text-sm font-semibold text-neutral-700'>Questionário da equipe</p>
        <textarea className={`${inputCls} font-mono text-xs min-h-28`} value={qEquipeJson} onChange={(e) => setQEquipeJson(e.target.value)} placeholder="{ }" />
        <div className='flex gap-2'>
          <button type="button" className={btnPrimary} onClick={async () => {
            try {
              const parsed = qEquipeJson.trim() ? JSON.parse(qEquipeJson) : null
              if (!parsed) throw new Error('JSON vazio. Use apagar para remover.')
              await updateDoc(doc(db, 'equipes', eq.id), { questionarioEquipe: parsed })
              await recarregar()
              alert('Questionário da equipe salvo.')
            } catch (err) { alert(err.message) }
          }}>Salvar questionário da equipe</button>
          <button type="button" className={btnGhost} onClick={async () => {
            if (!window.confirm('Remover questionarioEquipe?')) return
            try {
              await updateDoc(doc(db, 'equipes', eq.id), { questionarioEquipe: deleteField() })
              setQEquipeJson('')
              await recarregar()
            } catch (err) { alert(err.message) }
          }}>Apagar</button>
        </div>
      </div>
    </div>
  )
}
