'use client'

import React, { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { collection, getDocs, getDoc, doc, orderBy, query, where } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const rotulos = {
  nomeCompleto: 'Nome Completo',
  nomeSocial: 'Nome Social',
  email: 'E-mail',
  telefone: 'Telefone',
  dataNascimento: 'Data de Nascimento',
  identidadeGenero: 'Identidade de Gênero',
  corRaca: 'Cor/Raça',
  religiao: 'Religião',
  pcd: 'PCD',
  pcdQual: 'Qual PCD?',
  moradia: 'Com quem mora',
  escolaridadeMae: 'Escolaridade da Mãe',
  escolaridadePai: 'Escolaridade do Pai',
  ensinoSuperiorFamilia: 'Ensino Superior na Família',
  ensinoSuperiorGeracoes: 'Gerações com Ensino Superior',
  formacaoMaxima: 'Formação Máxima',
  graduacaoHistoria: 'Graduação em História',
  lecionaExclusivamenteHistoria: 'Leciona exclusivamente História',
  outrasDisciplinas: 'Outras Disciplinas',
  escolasTrabalha: 'Escolas que trabalha',
  turmasFundamental: 'Turmas Fundamental',
  turmasMedio: 'Turmas Médio',
  anoSérie: 'Ano/Série',
  tipoEscolaFundamental: 'Tipo Escola Fundamental',
  programasSociais: 'Programas Sociais',
  televisores: 'Televisores',
  geladeirasFreezers: 'Geladeiras/Freezers',
  computadoresNotebooks: 'Computadores/Notebooks',
  acessoInternet: 'Acesso à Internet',
  meiosInformacao: 'Meios de Informação',
  redeSocialPreferida: 'Rede Social Preferida',
  cinema: 'Cinema',
  teatro: 'Teatro',
  comoSoube: 'Como soube do DHPB',
  motivoNome: 'Motivo do nome da equipe',
  participouDHPB: 'Participou do DHPB',
  edicoesDHPB: 'Edições DHPB',
  participouONHB: 'Participou da ONHB',
  edicoesONHB: 'Edições ONHB',
}

const formatar = (chave, valor) => {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (Array.isArray(valor)) return valor.length > 0 ? valor.join(', ') : '—'
  if (chave === 'identidadeGenero') {
    const mapa = { masculino: 'Masculino', feminino: 'Feminino', naoBinario: 'Não-binário', outro: 'Outro', prefiroNaoDeclarar: 'Prefiro não declarar' }
    return mapa[valor] || valor
  }
  if (chave === 'corRaca') return { branca: 'Branca', preta: 'Preta', parda: 'Parda', amarela: 'Amarela', indigena: 'Indígena' }[valor] || valor
  if (chave === 'religiao') return { semReligiao: 'Sem religião', catolica: 'Católica', evangelica: 'Evangélica', espirita: 'Espírita', matrizAfricana: 'Matriz Africana', outra: 'Outra' }[valor] || valor
  if (chave === 'moradia') return { paisFamilia: 'Pais/Família', conjugeParceiro: 'Cônjuge/Parceiro(a)', amigosRepublica: 'Amigos/República', sozinho: 'Sozinho(a)' }[valor] || valor
  if (chave === 'acessoInternet') return { bandaLarga: 'Sim, banda larga/Wi-Fi', dadosMoveis: 'Sim, apenas dados móveis', nao: 'Não' }[valor] || valor
  if (chave === 'redeSocialPreferida') return { instagram: 'Instagram', tiktok: 'TikTok', whatsapp: 'WhatsApp', x: 'X (Twitter)', youtube: 'YouTube', outra: 'Outra', nenhuma: 'Nenhuma' }[valor] || valor
  if (chave === 'cinema' || chave === 'teatro') return { sim: 'Sim', nao: 'Não', naoHa: 'Não há na cidade' }[valor] || valor
  if (chave === 'comoSoube') return { professor: 'Pelo(a) professor(a)', redesSociais: 'Redes sociais da organização', amigos: 'Por amigos/colegas', cartaz: 'Cartaz/Divulgação na escola' }[valor] || valor
  if (chave === 'formacaoMaxima') return { graduacao: 'Graduação', especializacao: 'Especialização', mestrado: 'Mestrado', doutorado: 'Doutorado' }[valor] || valor
  if (chave === 'anoSérie') return { '9anoEF': '9º ano EF', '1anoEM': '1º ano EM', '2anoEM': '2º ano EM', '3anoEM': '3º ano EM', outro: 'Outro' }[valor] || valor
  if (chave === 'tipoEscolaFundamental') return { publica: 'Pública', privadaBolsa: 'Privada com bolsa', privadaSemBolsa: 'Privada sem bolsa' }[valor] || valor
  if (chave === 'escolaridadeMae' || chave === 'escolaridadePai') return { naoAlfabetizado: 'Não alfabetizado(a)', fundamental: 'Fundamental Incompleto/Completo', medio: 'Médio Incompleto/Completo', superior: 'Superior Completo', posGraduacao: 'Pós-graduação' }[valor] || valor
  if (chave === 'escolasTrabalha') return { Pública: 'Pública', Privadas: 'Privadas', Ambas: 'Ambas' }[valor] || valor
  return valor
}

const camposComuns = ['nomeCompleto', 'nomeSocial', 'email', 'telefone', 'dataNascimento', 'identidadeGenero', 'corRaca', 'religiao', 'pcd', 'pcdQual', 'moradia', 'escolaridadeMae', 'escolaridadePai']
const camposProfessor = ['ensinoSuperiorFamilia', 'ensinoSuperiorGeracoes', 'formacaoMaxima', 'graduacaoHistoria', 'lecionaExclusivamenteHistoria', 'outrasDisciplinas', 'escolasTrabalha', 'turmasFundamental', 'turmasMedio']
const camposEstudante = ['anoSérie', 'tipoEscolaFundamental', 'programasSociais']
const camposSocioeconomicos = ['televisores', 'geladeirasFreezers', 'computadoresNotebooks', 'acessoInternet', 'meiosInformacao', 'redeSocialPreferida', 'cinema', 'teatro']
const camposEquipe = ['comoSoube', 'motivoNome', 'participouDHPB', 'edicoesDHPB', 'participouONHB', 'edicoesONHB']

function Page() {
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [edicoes, setEdicoes] = useState([])
  const [edicaoSelecionada, setEdicaoSelecionada] = useState('')
  const [equipes, setEquipes] = useState([])
  const [equipeSelecionada, setEquipeSelecionada] = useState(null)
  const [questionarioEquipe, setQuestionarioEquipe] = useState(null)
  const [questionariosIndividuais, setQuestionariosIndividuais] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [carregandoIndividuais, setCarregandoIndividuais] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else { setAutenticado(true); setVerificando(false) }
  }, [router])

  useEffect(() => {
    if (!autenticado) return
    const carregar = async () => {
      const snap = await getDocs(query(collection(db, 'edicoes'), orderBy('createdAt', 'desc')))
      setEdicoes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carregar()
  }, [autenticado])

  const handleSelecionarEdicao = async (edId) => {
    setEdicaoSelecionada(edId)
    setEquipeSelecionada(null)
    setQuestionarioEquipe(null)
    setQuestionariosIndividuais([])
    setCarregando(true)
    const snap = await getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edId)))
    setEquipes(snap.docs.map((d, i) => ({ id: d.id, idx: i + 1, ...d.data() })))
    setCarregando(false)
  }

  const handleSelecionarEquipe = async (equipe) => {
    setEquipeSelecionada(equipe)
    setQuestionarioEquipe(equipe.questionarioEquipe || null)

    setCarregandoIndividuais(true)
    const individuais = []
    const membros = equipe.membros || []
    for (const membro of membros) {
      try {
        const qSnap = await getDoc(doc(db, 'users', membro.uid, 'questionarios', edicaoSelecionada))
        if (qSnap.exists()) {
          individuais.push({ id: membro.uid, membroNome: membro.nome, ...qSnap.data() })
        }
      } catch {}
    }
    setQuestionariosIndividuais(individuais)
    setCarregandoIndividuais(false)
  }

  const handleSair = async () => {
    try { await signOut(auth) } catch {}
    localStorage.removeItem('admin-authenticated')
    router.push('/admin')
  }

  if (verificando) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Verificando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <div>
                <h1 className='text-lg font-bold text-[#82181A]'>Questionários</h1>
                <p className='text-xs text-neutral-400'>Visualize as respostas dos participantes</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button onClick={() => router.push('/admin/dashboard')} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Dashboard</button>
              <button onClick={() => router.push('/admin/ranking')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>Ranking</button>
              <button onClick={handleSair} className='border border-neutral-300 text-neutral-500 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Sair</button>
            </div>
          </div>
        </header>

        <main className='max-w-6xl mx-auto px-6 py-6'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-6'>
            <div className='flex items-center gap-3 pb-4 border-b border-neutral-100'>
              <h2 className='text-lg font-bold text-[#82181A]'>Questionários</h2>
            </div>

            <div className='pt-4 space-y-6'>
              <div>
                <label className='text-sm font-semibold text-neutral-500 block mb-2'>Selecione a Edição</label>
                <select
                  value={edicaoSelecionada}
                  onChange={e => handleSelecionarEdicao(e.target.value)}
                  className='w-full md:w-96 rounded-xl border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-[#82181A]'
                >
                  <option value="">Selecione...</option>
                  {edicoes.map(ed => (
                    <option key={ed.id} value={ed.id}>{ed.nome}</option>
                  ))}
                </select>
              </div>

              {edicaoSelecionada && (
                <div>
                  <label className='text-sm font-semibold text-neutral-500 block mb-2'>
                    Equipes {equipes.length > 0 && <span className='text-xs bg-[#82181A]/10 text-[#82181A] px-2 py-0.5 rounded-full'>{equipes.length}</span>}
                  </label>
                  {carregando && equipeSelecionada === null ? (
                    <p className='text-sm text-neutral-400'>Carregando equipes...</p>
                  ) : equipes.length === 0 ? (
                    <p className='text-sm text-neutral-400'>Nenhuma equipe nesta edição.</p>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                      {equipes.map(eq => (
                        <button
                          key={eq.id}
                          onClick={() => handleSelecionarEquipe(eq)}
                          className={`text-left p-4 rounded-xl border text-sm transition-all cursor-pointer ${equipeSelecionada?.id === eq.id ? 'border-[#82181A] bg-[#82181A]/5' : 'border-neutral-200 hover:border-neutral-300'}`}
                        >
                          <p className='font-semibold'>{eq.nome}</p>
                          <p className='text-xs text-neutral-400 mt-1'>{eq.escola || '—'}</p>
                          <p className='text-xs text-neutral-400'>{eq.membros?.length || 0} membro(s)</p>
                          {eq.questionarioEquipe ? (
                            <span className='text-[10px] text-green-600 mt-1 block'>Questionário da equipe ✓</span>
                          ) : (
                            <span className='text-[10px] text-amber-500 mt-1 block'>Equipe sem questionário</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {equipeSelecionada && (
                <div className='border-t border-neutral-100 pt-6 space-y-8'>
                  {/* Team Questionnaire */}
                  <div>
                    <h3 className='text-base font-bold text-[#82181A] mb-1'>Questionário da Equipe</h3>
                    <p className='text-xs text-neutral-400 mb-4'>Respondido por: {equipeSelecionada.nome}</p>

                    {questionarioEquipe ? (
                      <div className='border border-neutral-200 rounded-xl overflow-hidden'>
                        <div className='bg-[#82181A] text-white px-5 py-3'>
                          <p className='font-semibold text-sm'>Questionário da Equipe</p>
                          <p className='text-xs text-white/70'>Respondido por {questionarioEquipe.respondidoPorNome || '—'} ({questionarioEquipe.respondidoPorTipo || '—'})</p>
                        </div>
                        <div className='p-5 text-sm'>
                          <SectionCard titulo="Sobre a Equipe" campos={camposEquipe} data={questionarioEquipe} />
                        </div>
                      </div>
                    ) : (
                      <p className='text-sm text-neutral-400'>Nenhum questionário da equipe respondido ainda.</p>
                    )}
                  </div>

                  {/* Individual Questionnaires */}
                  <div>
                    <h3 className='text-base font-bold text-[#82181A] mb-1'>Questionários Individuais</h3>
                    <p className='text-xs text-neutral-400 mb-4'>Respostas dos membros da equipe</p>

                    {carregandoIndividuais ? (
                      <p className='text-sm text-neutral-400'>Carregando questionários individuais...</p>
                    ) : questionariosIndividuais.length === 0 ? (
                      <p className='text-sm text-neutral-400'>Nenhum questionário individual respondido.</p>
                    ) : (
                      <div className='space-y-6'>
                        {questionariosIndividuais.map((q) => (
                          <div key={q.id} className='border border-neutral-200 rounded-xl overflow-hidden'>
                            <div className='bg-[#82181A] text-white px-5 py-3'>
                              <p className='font-semibold text-sm'>{q.membroNome || 'Membro'}</p>
                              <p className='text-xs text-white/70'>{q.tipo === 'professor' ? 'Professor Orientador' : 'Estudante'} — {q.email}</p>
                            </div>
                            <div className='p-5 space-y-6 text-sm'>
                              <SectionCard titulo="Identificação e Perfil Geral" campos={camposComuns} data={q} />
                              {q.tipo === 'professor' ? (
                                <SectionCard titulo="Professor Orientador" campos={camposProfessor} data={q} />
                              ) : (
                                <SectionCard titulo="Estudante" campos={camposEstudante} data={q} />
                              )}
                              <SectionCard titulo="Socioeconômico e Cultural" campos={camposSocioeconomicos} data={q} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SectionCard({ titulo, campos, data }) {
  return (
    <div>
      <h4 className='font-semibold text-[#82181A] text-xs uppercase tracking-wide mb-3'>{titulo}</h4>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2'>
        {campos.map(campo => (
          <div key={campo} className='flex flex-col'>
            <span className='text-[10px] uppercase tracking-wider text-neutral-400 font-medium'>{rotulos[campo] || campo}</span>
            <span className='text-sm text-neutral-700'>{formatar(campo, data[campo])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Page
