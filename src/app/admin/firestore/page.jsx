'use client'

import React, { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, doc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function FirestoreAdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const router = useRouter()

  const [aba, setAba] = useState('equipes') // 'equipes' ou 'usuarios'

  // Busca Equipes
  const [equipeQuery, setEquipeQuery] = useState('')
  const [equipeResultados, setEquipeResultados] = useState([])
  const [buscandoEquipes, setBuscandoEquipes] = useState(false)

  // Busca Usuários
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [usuarioResultado, setUsuarioResultado] = useState(null)
  const [membroIndexResultados, setMembroIndexResultados] = useState([])
  const [participacoesResultados, setParticipacoesResultados] = useState([])
  const [buscandoUsuario, setBuscandoUsuario] = useState(false)

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); setVerificando(false) }
  }, [router])

  const buscarEquipes = async (e) => {
    e.preventDefault()
    if (!equipeQuery.trim()) return
    setBuscandoEquipes(true)
    setEquipeResultados([])
    
    try {
      const resultados = []
      
      // Tenta buscar por ID exato primeiro
      try {
        const docRef = doc(db, 'equipes', equipeQuery.trim())
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          resultados.push({ id: docSnap.id, ...docSnap.data() })
        }
      } catch (err) {
        console.error("Não é um ID válido, tentando por nome...", err)
      }

      // Se não achou por ID, tenta por nome exato (usando nomeLower)
      if (resultados.length === 0) {
        const q = query(collection(db, 'equipes'), where('nomeLower', '==', equipeQuery.trim().toLowerCase()))
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
          resultados.push({ id: doc.id, ...doc.data() })
        })
      }

      setEquipeResultados(resultados)
    } catch (err) {
      alert("Erro ao buscar equipes: " + err.message)
    }
    setBuscandoEquipes(false)
  }

  const excluirEquipeProfundamente = async (equipe) => {
    if (!window.confirm(`ATENÇÃO: Você está prestes a excluir a equipe "${equipe.nome}".\n\nIsso irá:\n1. Deletar a equipe.\n2. Deletar os arquivos membro-index de todos os integrantes.\n3. Deletar as participações desses usuários.\n\nEsta ação é IRREVERSÍVEL. Tem certeza?`)) return
    
    try {
      const edicaoId = equipe.edicaoId
      let indexExcluidos = 0
      let participacoesExcluidas = 0

      // 1. Excluir dependências dos membros
      if (equipe.membros && Array.isArray(equipe.membros)) {
        for (const membro of equipe.membros) {
          // A. Deletar membro-index
          if (membro.email) {
            const emailBase = btoa(membro.email.trim().toLowerCase()).replace(/=+$/, '')
            const miKey = `${emailBase}_${edicaoId}`
            await deleteDoc(doc(db, 'membro-index', miKey)).catch(() => {})
            indexExcluidos++
          }
          // B. Deletar participacao
          if (membro.uid) {
            await deleteDoc(doc(db, 'users', membro.uid, 'participacoes', edicaoId)).catch(() => {})
            participacoesExcluidas++
          }
        }
      }

      // 2. Excluir a equipe em si
      await deleteDoc(doc(db, 'equipes', equipe.id))

      alert(`Equipe excluída com sucesso!\n\nForam apagados:\n- 1 Documento de Equipe\n- ${indexExcluidos} Documentos membro-index\n- ${participacoesExcluidas} Registros de participação`)
      
      // Limpar resultados
      setEquipeResultados(prev => prev.filter(eq => eq.id !== equipe.id))
      
    } catch (err) {
      alert("Erro ao excluir profundamente: " + err.message)
    }
  }

  const buscarUsuario = async (e) => {
    e.preventDefault()
    if (!usuarioEmail.trim()) return
    setBuscandoUsuario(true)
    setUsuarioResultado(null)
    setMembroIndexResultados([])
    setParticipacoesResultados([])

    try {
      const emailQuery = usuarioEmail.trim().toLowerCase()
      
      // 1. Buscar usuário
      const qUser = query(collection(db, 'users'), where('email', '==', emailQuery))
      const userSnap = await getDocs(qUser)
      
      let uidEncontrado = null
      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0]
        uidEncontrado = userDoc.id
        setUsuarioResultado({ id: uidEncontrado, ...userDoc.data() })
        
        // Buscar participacoes
        const partSnap = await getDocs(collection(db, 'users', uidEncontrado, 'participacoes'))
        const partArr = []
        partSnap.forEach(d => partArr.push({ id: d.id, ...d.data() }))
        setParticipacoesResultados(partArr)
      } else {
        alert("Usuário não encontrado na coleção 'users'. Procurando apenas no membro-index...")
      }

      // 2. Buscar membro-index associado a esse email
      // Precisamos buscar nas edições possíveis. Como não sabemos a edição,
      // e membro-index tem ID fixo {btoa(email)}_{edicaoId}, teremos que usar uma query se possível,
      // ou se não houver um campo fácil de query, podemos apenas mostrar as participações.
      // Ops, membro-index não tem um campo fixo para query a menos que a gente busque diretamente.
      // Vamos assumir que a equipeId está lá para buscar. Como a busca é por e-mail, e membro-index ID = btoa(email)_edicao.
      // O melhor é buscar todas as edições e tentar dar getDoc.
      const edicoesSnap = await getDocs(collection(db, 'edicoes'))
      const miEncontrados = []
      const emailBase = btoa(emailQuery).replace(/=+$/, '')
      
      for (const edDoc of edicoesSnap.docs) {
        const miKey = `${emailBase}_${edDoc.id}`
        const miSnap = await getDoc(doc(db, 'membro-index', miKey))
        if (miSnap.exists()) {
          miEncontrados.push({ id: miSnap.id, edicaoId: edDoc.id, ...miSnap.data() })
        }
      }
      setMembroIndexResultados(miEncontrados)

    } catch (err) {
      alert("Erro ao buscar usuário: " + err.message)
    }
    setBuscandoUsuario(false)
  }

  const excluirMembroIndex = async (id) => {
    if (!window.confirm(`Deletar o registro de membro-index "${id}"? Isso fará com que o sistema não saiba que este e-mail já está em uma equipe (pode gerar duplicidade se ele for adicionado de novo).`)) return
    try {
      await deleteDoc(doc(db, 'membro-index', id))
      setMembroIndexResultados(prev => prev.filter(m => m.id !== id))
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
      setParticipacoesResultados(prev => prev.filter(p => p.id !== edicaoId))
      alert('Participação excluída.')
    } catch (err) {
      alert('Erro ao excluir: ' + err.message)
    }
  }

  if (verificando) return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Verificando...</p></div>

  return (
    <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]`}>
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div>
              <h1 className='text-lg font-bold text-[#82181A]'>Ferramentas de Suporte (Firestore)</h1>
              <p className='text-xs text-neutral-400'>Acesso rápido e econômico ao banco de dados</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>
            Voltar ao Dashboard
          </button>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-6 py-8'>
        {/* Toggle Abas */}
        <div className='flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-neutral-200 inline-flex'>
          <button onClick={() => setAba('equipes')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${aba === 'equipes' ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>Buscar Equipes</button>
          <button onClick={() => setAba('usuarios')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${aba === 'usuarios' ? 'bg-[#82181A] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>Buscar Usuário (Email)</button>
        </div>

        {/* ABA: EQUIPES */}
        {aba === 'equipes' && (
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6'>
            <form onSubmit={buscarEquipes} className='flex flex-col sm:flex-row gap-3'>
              <input type="text" placeholder="Cole o ID da Equipe ou o Nome exato..." value={equipeQuery} onChange={(e) => setEquipeQuery(e.target.value)}
                className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
              <button type="submit" disabled={buscandoEquipes} className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                {buscandoEquipes ? 'Buscando...' : 'Buscar Equipe'}
              </button>
            </form>

            <div className='space-y-4'>
              {equipeResultados.length === 0 && !buscandoEquipes && equipeQuery && (
                <p className='text-neutral-500 text-sm'>Nenhuma equipe encontrada para esta busca.</p>
              )}
              {equipeResultados.map(eq => (
                <div key={eq.id} className='border border-neutral-200 rounded-xl p-5 space-y-4 bg-neutral-50'>
                  <div className='flex justify-between items-start flex-wrap gap-4'>
                    <div>
                      <h3 className='font-bold text-lg text-neutral-800'>{eq.nome} <span className='text-xs font-normal text-neutral-500 bg-neutral-200 px-2 py-1 rounded-md ml-2'>{eq.id}</span></h3>
                      <p className='text-sm text-neutral-600 mt-1'>{eq.escola} — {eq.modalidade}</p>
                      <p className='text-xs text-neutral-500 mt-1'>Criada por: {eq.criadorNome} ({eq.criadorUid})</p>
                    </div>
                    <button onClick={() => excluirEquipeProfundamente(eq)} className='bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors cursor-pointer border border-red-200'>
                      Excluir Equipe Profundamente
                    </button>
                  </div>

                  <div className='pt-3 border-t border-neutral-200'>
                    <p className='text-sm font-semibold text-neutral-700 mb-2'>Membros Ativos ({eq.membros?.length || 0}):</p>
                    <div className='grid gap-2 grid-cols-1 sm:grid-cols-2'>
                      {(eq.membros || []).map((m, idx) => (
                        <div key={idx} className='bg-white border border-neutral-200 p-3 rounded-lg text-xs'>
                          <p className='font-semibold'>{m.nome}</p>
                          <p className='text-neutral-500'>{m.email}</p>
                          <p className='text-neutral-400 mt-1 capitalize'>Papel: {m.papel} | Status: {m.status}</p>
                          <p className='text-[10px] text-neutral-400 mt-1 break-all'>UID: {m.uid}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {eq.orientadorUids && eq.orientadorUids.length > 0 && (
                    <div className='pt-3 border-t border-neutral-200'>
                       <p className='text-xs font-semibold text-neutral-700'>Orientadores registrados (orientadorUids):</p>
                       <p className='text-[10px] text-neutral-500 break-all'>{eq.orientadorUids.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: USUARIOS */}
        {aba === 'usuarios' && (
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6'>
            <form onSubmit={buscarUsuario} className='flex flex-col sm:flex-row gap-3'>
              <input type="email" placeholder="Email exato do usuário..." value={usuarioEmail} onChange={(e) => setUsuarioEmail(e.target.value)}
                className="flex-1 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A] transition-all" />
              <button type="submit" disabled={buscandoUsuario} className='bg-[#82181A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap'>
                {buscandoUsuario ? 'Buscando...' : 'Buscar E-mail'}
              </button>
            </form>

            <div className='grid gap-6 grid-cols-1 md:grid-cols-2'>
              {/* Painel do Usuario */}
              <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4'>
                <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Dados do Usuário</h3>
                {usuarioResultado ? (
                  <div className='text-sm space-y-2 text-neutral-700'>
                    <p><strong>Nome:</strong> {usuarioResultado.nome} {usuarioResultado.sobrenome}</p>
                    <p><strong>Email:</strong> {usuarioResultado.email}</p>
                    <p><strong>UID:</strong> {usuarioResultado.id}</p>
                    <p><strong>Tipo:</strong> <span className='capitalize'>{usuarioResultado.tipo}</span></p>
                    <p><strong>Documento Status:</strong> {usuarioResultado.documentoStatus || 'N/A'}</p>
                    <p><strong>Telefone:</strong> {usuarioResultado.telefone || 'N/A'}</p>
                    <p><strong>Escola:</strong> {usuarioResultado.escola || 'N/A'}</p>
                  </div>
                ) : (
                  <p className='text-sm text-neutral-400'>Nenhum perfil encontrado para este email.</p>
                )}
              </div>

              {/* Painel de Participacoes */}
              <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4'>
                <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Participações (Equipes conectadas)</h3>
                {participacoesResultados.length === 0 ? (
                  <p className='text-sm text-neutral-400'>Nenhuma participação registrada.</p>
                ) : (
                  <div className='space-y-3'>
                    {participacoesResultados.map(p => (
                      <div key={p.id} className='bg-white p-3 rounded-lg border border-neutral-200 text-xs flex justify-between items-center'>
                        <div>
                          <p><strong>Edição:</strong> {p.id}</p>
                          <p><strong>Equipe ID:</strong> {p.equipeId}</p>
                          <p><strong>Papel:</strong> {p.papel}</p>
                        </div>
                        <button onClick={() => excluirParticipacao(p.id)} className='text-red-600 hover:bg-red-50 p-2 rounded-md font-semibold cursor-pointer'>
                          Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Painel de Membro-Index */}
              <div className='border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4 md:col-span-2'>
                <h3 className='font-bold text-neutral-800 border-b border-neutral-200 pb-2'>Índices de Membro (membro-index)</h3>
                <p className='text-xs text-neutral-500'>Isso é o que impede o usuário de entrar em outra equipe na mesma edição.</p>
                {membroIndexResultados.length === 0 ? (
                  <p className='text-sm text-neutral-400'>Nenhum registro de membro-index encontrado.</p>
                ) : (
                  <div className='grid gap-3 grid-cols-1 sm:grid-cols-2'>
                    {membroIndexResultados.map(mi => (
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
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
