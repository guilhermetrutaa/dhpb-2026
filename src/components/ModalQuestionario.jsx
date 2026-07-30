'use client'

import React, { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function ModalQuestionario({ authUser, userData, equipe, equipeId, onComplete }) {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    nomeSocial: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    identidadeGenero: '',
    corRaca: '',
    religiao: '',
    pcd: false,
    pcdQual: '',
    moradia: '',
    escolaridadeMae: '',
    escolaridadePai: '',
    ensinoSuperiorFamilia: '',
    ensinoSuperiorGeracoes: '',
    formacaoMaxima: '',
    graduacaoHistoria: false,
    lecionaExclusivamenteHistoria: false,
    outrasDisciplinas: '',
    escolasTrabalha: '',
    turmasFundamental: '',
    turmasMedio: '',
    anoSérie: '',
    tipoEscolaFundamental: '',
    programasSociais: [],
    televisores: '',
    geladeirasFreezers: '',
    computadoresNotebooks: '',
    acessoInternet: '',
    meiosInformacao: [],
    redeSocialPreferida: '',
    cinema: '',
    teatro: '',
    comoSoube: '',
    motivoNome: '',
    participouDHPB: false,
    edicoesDHPB: [],
    participouONHB: false,
    edicoesONHB: [],
  })
  const [enviando, setEnviando] = useState(false)

  const tipo = userData?.tipo || 'estudante'

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      nomeCompleto: `${userData?.nome || ''} ${userData?.sobrenome || ''}`.trim(),
      email: authUser?.email || '',
    }))
  }, [userData, authUser])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxGroup = (field, option) => {
    setFormData(prev => {
      const current = prev[field] || []
      if (current.includes(option)) {
        return { ...prev, [field]: current.filter(o => o !== option) }
      }
      return { ...prev, [field]: [...current, option] }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await updateDoc(doc(db, 'equipes', equipeId), {
        [`questionario.${authUser.uid}`]: {
          ...formData,
          tipo,
          membroNome: formData.nomeCompleto,
          respondidoEm: serverTimestamp(),
        },
      })
      onComplete()
    } catch {
      alert('Erro ao salvar questionário. Tente novamente.')
    }
    setEnviando(false)
  }

  const inputClass = 'w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]'
  const labelClass = 'text-sm font-semibold text-[#82181A]'
  const sectionClass = 'mb-8 pb-8 border-b border-neutral-200 last:border-b-0'
  const sectionTitleClass = 'text-xl font-bold text-[#82181A] mb-6'

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-black/60 ${poppins.className}`}>
      <div className="flex items-start justify-center min-h-full px-4 py-8">
        <div className="relative w-full max-w-3xl bg-white">
          <div className="bg-[#82181A] text-white px-8 py-6 ">
            <h2 className="text-2xl font-bold">Questionário de Inscrição</h2>
            <p className="text-white/80 text-sm mt-1">Preencha seus dados para acessar a sala de equipe</p>
          </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-2 text-[#000]">
          {/* BLOCO COMUM */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Identificação e Perfil Geral</h3>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>1. Nome Completo</label>
                <input type="text" value={formData.nomeCompleto} onChange={e => handleChange('nomeCompleto', e.target.value)} className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>2. Nome Social</label>
                <input type="text" value={formData.nomeSocial} onChange={e => handleChange('nomeSocial', e.target.value)} className={inputClass} placeholder="(opcional)" />
              </div>

              <div>
                <label className={labelClass}>3. E-mail</label>
                <input type="email" value={formData.email} className={`${inputClass} bg-neutral-50`} disabled />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>4. Telefone</label>
                  <input type="tel" value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} className={inputClass} placeholder="(83) 99999-9999" />
                </div>
                <div>
                  <label className={labelClass}>5. Data de Nascimento</label>
                  <input type="date" value={formData.dataNascimento} onChange={e => handleChange('dataNascimento', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>6. Identidade de Gênero</label>
                <select value={formData.identidadeGenero} onChange={e => handleChange('identidadeGenero', e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="naoBinario">Não-binário</option>
                  <option value="outro">Outro</option>
                  <option value="prefiroNaoDeclarar">Prefiro não declarar</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>7. Cor/Raça (IBGE)</label>
                <select value={formData.corRaca} onChange={e => handleChange('corRaca', e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="branca">Branca</option>
                  <option value="preta">Preta</option>
                  <option value="parda">Parda</option>
                  <option value="amarela">Amarela</option>
                  <option value="indigena">Indígena</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>8. Religião</label>
                <select value={formData.religiao} onChange={e => handleChange('religiao', e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="semReligiao">Sem religião</option>
                  <option value="catolica">Católica</option>
                  <option value="evangelica">Evangélica</option>
                  <option value="espirita">Espírita</option>
                  <option value="matrizAfricana">Matriz Africana</option>
                  <option value="outra">Outra</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>9. Pessoa com Deficiência (PCD)?</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="pcd" checked={!formData.pcd} onChange={() => handleChange('pcd', false)} className="accent-[#82181A]" />
                    <span className="text-sm">Não</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="pcd" checked={formData.pcd} onChange={() => handleChange('pcd', true)} className="accent-[#82181A]" />
                    <span className="text-sm">Sim</span>
                  </label>
                </div>
                {formData.pcd && (
                  <input type="text" value={formData.pcdQual} onChange={e => handleChange('pcdQual', e.target.value)} className={`${inputClass} mt-3`} placeholder="Qual?" />
                )}
              </div>

              <div>
                <label className={labelClass}>10. Com quem você mora atualmente?</label>
                <select value={formData.moradia} onChange={e => handleChange('moradia', e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="paisFamilia">Pais/Família</option>
                  <option value="conjugeParceiro">Cônjuge/Parceiro(a)</option>
                  <option value="amigosRepublica">Amigos/República</option>
                  <option value="sozinho">Sozinho(a)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>11. Escolaridade dos Pais</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Mãe</p>
                    <select value={formData.escolaridadeMae} onChange={e => handleChange('escolaridadeMae', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="naoAlfabetizado">Não alfabetizado(a)</option>
                      <option value="fundamental">Fundamental Incompleto/Completo</option>
                      <option value="medio">Médio Incompleto/Completo</option>
                      <option value="superior">Superior Completo</option>
                      <option value="posGraduacao">Pós-graduação</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Pai</p>
                    <select value={formData.escolaridadePai} onChange={e => handleChange('escolaridadePai', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="naoAlfabetizado">Não alfabetizado(a)</option>
                      <option value="fundamental">Fundamental Incompleto/Completo</option>
                      <option value="medio">Médio Incompleto/Completo</option>
                      <option value="superior">Superior Completo</option>
                      <option value="posGraduacao">Pós-graduação</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MÓDULO ESPECÍFICO */}
          <div className={sectionClass}>
            {tipo === 'professor' ? (
              <>
                <h3 className={sectionTitleClass}>Módulo Específico: Professor Orientador</h3>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>1. Existem pessoas com ensino superior em sua família? Há quantas gerações? *</label>
                    <div className="flex gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="ensinoSuperiorFamilia" checked={formData.ensinoSuperiorFamilia === 'sim'} onChange={() => handleChange('ensinoSuperiorFamilia', 'sim')} className="accent-[#82181A]" />
                        <span className="text-sm">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="ensinoSuperiorFamilia" checked={formData.ensinoSuperiorFamilia === 'nao'} onChange={() => handleChange('ensinoSuperiorFamilia', 'nao')} className="accent-[#82181A]" />
                        <span className="text-sm">Não</span>
                      </label>
                    </div>
                    {formData.ensinoSuperiorFamilia === 'sim' && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-neutral-500">Quantas gerações?</label>
                        <div className="flex gap-4 mt-1">
                          {['1 geração', '2 gerações', '3 ou mais'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="ensinoSuperiorGeracoes" checked={formData.ensinoSuperiorGeracoes === opt} onChange={() => handleChange('ensinoSuperiorGeracoes', opt)} className="accent-[#82181A]" />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>2. Nível máximo de formação concluído: *</label>
                    <select value={formData.formacaoMaxima} onChange={e => handleChange('formacaoMaxima', e.target.value)} className={inputClass} required>
                      <option value="">Selecione...</option>
                      <option value="graduacao">Graduação</option>
                      <option value="especializacao">Especialização</option>
                      <option value="mestrado">Mestrado</option>
                      <option value="doutorado">Doutorado</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>3. Sua graduação principal é na área de História? *</label>
                    <div className="flex gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="graduacaoHistoria" checked={formData.graduacaoHistoria === true} onChange={() => handleChange('graduacaoHistoria', true)} className="accent-[#82181A]" />
                        <span className="text-sm">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="graduacaoHistoria" checked={formData.graduacaoHistoria === false} onChange={() => handleChange('graduacaoHistoria', false)} className="accent-[#82181A]" />
                        <span className="text-sm">Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>4. Você leciona exclusivamente a disciplina de História? *</label>
                    <div className="flex gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="lecionaExclusivamenteHistoria" checked={formData.lecionaExclusivamenteHistoria === true} onChange={() => handleChange('lecionaExclusivamenteHistoria', true)} className="accent-[#82181A]" />
                        <span className="text-sm">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="lecionaExclusivamenteHistoria" checked={formData.lecionaExclusivamenteHistoria === false} onChange={() => handleChange('lecionaExclusivamenteHistoria', false)} className="accent-[#82181A]" />
                        <span className="text-sm">Não</span>
                      </label>
                    </div>
                    {!formData.lecionaExclusivamenteHistoria && (
                      <input type="text" value={formData.outrasDisciplinas} onChange={e => handleChange('outrasDisciplinas', e.target.value)} className={`${inputClass} mt-3`} placeholder="Quais outras disciplinas?" />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>5. Em quantas escolas você leciona atualmente? *</label>
                    <div className="flex gap-4 mt-2">
                      {['Pública', 'Privadas', 'Ambas'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="escolasTrabalha" checked={formData.escolasTrabalha === opt} onChange={() => handleChange('escolasTrabalha', opt)} className="accent-[#82181A]" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>6. Ensino Fundamental: quantas turmas?</label>
                      <input type="number" min="0" value={formData.turmasFundamental} onChange={e => handleChange('turmasFundamental', e.target.value)} className={inputClass} placeholder="0" />
                    </div>
                    <div>
                      <label className={labelClass}>Ensino Médio: quantas turmas?</label>
                      <input type="number" min="0" value={formData.turmasMedio} onChange={e => handleChange('turmasMedio', e.target.value)} className={inputClass} placeholder="0" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className={sectionTitleClass}>Módulo Específico: Estudante</h3>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>1. Ano / Série atual: *</label>
                    <select value={formData.anoSérie} onChange={e => handleChange('anoSérie', e.target.value)} className={inputClass} required>
                      <option value="">Selecione...</option>
                      <option value="9anoEF">9º ano EF</option>
                      <option value="1anoEM">1º ano EM</option>
                      <option value="2anoEM">2º ano EM</option>
                      <option value="3anoEM">3º ano EM</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>2. Tipo de escola onde cursou a maior parte do Ensino Fundamental: *</label>
                    <select value={formData.tipoEscolaFundamental} onChange={e => handleChange('tipoEscolaFundamental', e.target.value)} className={inputClass} required>
                      <option value="">Selecione...</option>
                      <option value="publica">Pública</option>
                      <option value="privadaBolsa">Privada com bolsa</option>
                      <option value="privadaSemBolsa">Privada sem bolsa</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>3. Sua família participa de programas de transferência de renda/auxílio? *</label>
                    <div className="space-y-2 mt-2">
                      {[
                        { value: 'cadUnico', label: 'CadÚnico' },
                        { value: 'bolsaFamilia', label: 'Bolsa Família' },
                        { value: 'outroAuxilio', label: 'Outro auxílio/bolsa governamental' },
                        { value: 'nenhum', label: 'Nenhum' },
                      ].map(op => (
                        <label key={op.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.programasSociais.includes(op.value)}
                            onChange={() => handleCheckboxGroup('programasSociais', op.value)}
                            className="accent-[#82181A] w-4 h-4"
                          />
                          <span className="text-sm">{op.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ESTRUTURA SOCIOECONÔMICA */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Estrutura Socioeconômica e Hábitos Culturais</h3>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>1. Assinale a quantidade de bens existentes em sua residência atual:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Televisores</p>
                    <select value={formData.televisores} onChange={e => handleChange('televisores', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="0">Nenhum (0)</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3 ou mais</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Geladeiras / Freezers</p>
                    <select value={formData.geladeirasFreezers} onChange={e => handleChange('geladeirasFreezers', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="0">Nenhum (0)</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3 ou mais</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Computadores / Notebooks</p>
                    <select value={formData.computadoresNotebooks} onChange={e => handleChange('computadoresNotebooks', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="0">Nenhum (0)</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3 ou mais</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>2. Possui acesso estável à internet em casa? *</label>
                <select value={formData.acessoInternet} onChange={e => handleChange('acessoInternet', e.target.value)} className={inputClass} required>
                  <option value="">Selecione...</option>
                  <option value="bandaLarga">Sim, banda larga/Wi-Fi</option>
                  <option value="dadosMoveis">Sim, apenas dados móveis</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>3. Por quais meios você costuma se informar? *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'portaisNoticias', label: 'Portais de notícias' },
                    { value: 'redesSociais', label: 'Redes sociais' },
                    { value: 'tvRadio', label: 'Televisão/Rádio' },
                    { value: 'jornaisRevistas', label: 'Jornais/Revistas impressos' },
                    { value: 'conversas', label: 'Conversas com familiares/professores' },
                  ].map(op => (
                    <label key={op.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meiosInformacao.includes(op.value)}
                        onChange={() => handleCheckboxGroup('meiosInformacao', op.value)}
                        className="accent-[#82181A] w-4 h-4"
                      />
                      <span className="text-sm">{op.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>4. Qual sua rede social de preferência? *</label>
                <select value={formData.redeSocialPreferida} onChange={e => handleChange('redeSocialPreferida', e.target.value)} className={inputClass} required>
                  <option value="">Selecione...</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="x">X (Twitter)</option>
                  <option value="youtube">YouTube</option>
                  <option value="outra">Outra</option>
                  <option value="nenhuma">Nenhuma</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>5. Frequência cultural na sua cidade:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Já assistiu a um filme no cinema local?</p>
                    <select value={formData.cinema} onChange={e => handleChange('cinema', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                      <option value="naoHa">Não há cinema na cidade</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Já assistiu a uma peça no teatro local?</p>
                    <select value={formData.teatro} onChange={e => handleChange('teatro', e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                      <option value="naoHa">Não há teatro na cidade</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO NO DESAFIO */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Histórico no Desafio e Olimpíadas</h3>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>1. Como ficou sabendo do Desafio em História da Paraíba (DHPB)? *</label>
                <select value={formData.comoSoube} onChange={e => handleChange('comoSoube', e.target.value)} className={inputClass} required>
                  <option value="">Selecione...</option>
                  <option value="professor">Pelo(a) professor(a)</option>
                  <option value="redesSociais">Pelas redes sociais da organização</option>
                  <option value="amigos">Por amigos/colegas</option>
                  <option value="cartaz">Cartaz/Divulgação na escola</option>
                </select>
              </div>

              {tipo === 'estudante' && (
                <div>
                  <label className={labelClass}>2. Qual o motivo da escolha do nome da equipe? *</label>
                  <textarea
                    value={formData.motivoNome}
                    onChange={e => handleChange('motivoNome', e.target.value)}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Explique por que sua equipe escolheu este nome..."
                    required
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>{tipo === 'estudante' ? '3' : '2'}. Você participou de edições anteriores do DHPB? *</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="participouDHPB" checked={formData.participouDHPB === true} onChange={() => handleChange('participouDHPB', true)} className="accent-[#82181A]" />
                    <span className="text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="participouDHPB" checked={formData.participouDHPB === false} onChange={() => handleChange('participouDHPB', false)} className="accent-[#82181A]" />
                    <span className="text-sm">Não</span>
                  </label>
                </div>
                {formData.participouDHPB && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Quais edições?</p>
                    <div className="space-y-2">
                      {[
                        { value: '2025', label: '2025' },
                        { value: '2024', label: '2024' },
                        { value: '2023', label: '2023' },
                        { value: 'outrasAnteriores', label: 'Outras anteriores' },
                      ].map(op => (
                        <label key={op.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.edicoesDHPB.includes(op.value)}
                            onChange={() => handleCheckboxGroup('edicoesDHPB', op.value)}
                            className="accent-[#82181A] w-4 h-4"
                          />
                          <span className="text-sm">{op.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>{tipo === 'estudante' ? '4' : '3'}. Você participou de edições anteriores da ONHB? *</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="participouONHB" checked={formData.participouONHB === true} onChange={() => handleChange('participouONHB', true)} className="accent-[#82181A]" />
                    <span className="text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="participouONHB" checked={formData.participouONHB === false} onChange={() => handleChange('participouONHB', false)} className="accent-[#82181A]" />
                    <span className="text-sm">Não</span>
                  </label>
                </div>
                {formData.participouONHB && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Quais edições?</p>
                    <div className="space-y-2">
                      {[
                        { value: '18', label: '18º (2026)' },
                        { value: '17', label: '17º (2025)' },
                        { value: '16', label: '16º (2024)' },
                        { value: '15', label: '15º (2023)' },
                        { value: '14', label: '14º (2022)' },
                        { value: 'outrasAnteriores', label: 'Outras anteriores' },
                      ].map(op => (
                        <label key={op.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.edicoesONHB.includes(op.value)}
                            onChange={() => handleCheckboxGroup('edicoesONHB', op.value)}
                            className="accent-[#82181A] w-4 h-4"
                          />
                          <span className="text-sm">{op.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-[#82181A] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer"
            >
              {enviando ? 'Salvando...' : 'Salvar Questionário'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
