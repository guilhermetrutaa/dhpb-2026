'use client'

import React, { useState } from 'react'
import { Poppins } from 'next/font/google'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function ModalQuestionarioEquipe({ authUser, userData, equipe, equipeId, onComplete, onClose }) {
  const [formData, setFormData] = useState({
    comoSoube: '',
    motivoNome: '',
    participouDHPB: false,
    edicoesDHPB: [],
    participouONHB: false,
    edicoesONHB: [],
  })
  const [enviando, setEnviando] = useState(false)

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
        questionarioEquipe: {
          ...formData,
          respondidoPor: authUser.uid,
          respondidoPorNome: `${userData?.nome || ''} ${userData?.sobrenome || ''}`.trim(),
          respondidoPorTipo: userData?.tipo || '',
          respondidoEm: serverTimestamp(),
        },
      })
      onComplete()
    } catch {
      alert('Erro ao salvar questionário da equipe. Tente novamente.')
    }
    setEnviando(false)
  }

  const inputClass = 'w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]'
  const labelClass = 'text-sm font-semibold text-[#82181A]'
  const sectionTitleClass = 'text-xl font-bold text-[#82181A] mb-6'

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-black/60 ${poppins.className}`}>
      <div className="flex items-start justify-center min-h-full px-4 py-8">
        <div className="relative w-full max-w-3xl bg-white">
          <div className="bg-[#82181A] text-white px-8 py-6 relative">
            <h2 className="text-2xl font-bold">Questionário da Equipe</h2>
            <p className="text-white/80 text-sm mt-1">Apenas um membro da equipe precisa responder</p>
            {onClose && (
              <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 text-[#000]">
            <div>
              <h3 className={sectionTitleClass}>Sobre a Equipe</h3>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>1. Como ficou sabendo do Desafio em História da Paraíba (DHPB)?</label>
                  <select value={formData.comoSoube} onChange={e => handleChange('comoSoube', e.target.value)} className={inputClass} required>
                    <option value="">Selecione...</option>
                    <option value="professor">Pelo(a) professor(a)</option>
                    <option value="redesSociais">Pelas redes sociais da organização</option>
                    <option value="amigos">Por amigos/colegas</option>
                    <option value="cartaz">Cartaz/Divulgação na escola</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>2. Qual o motivo da escolha do nome da equipe?</label>
                  <textarea
                    value={formData.motivoNome}
                    onChange={e => handleChange('motivoNome', e.target.value)}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Explique por que sua equipe escolheu este nome..."
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>3. Algum membro da equipe participou de edições anteriores do DHPB?</label>
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
                  <label className={labelClass}>4. Algum membro da equipe participou de edições anteriores da ONHB?</label>
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
                {enviando ? 'Salvando...' : 'Salvar Questionário da Equipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
