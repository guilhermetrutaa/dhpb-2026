'use client'

const CHAVE = 'dhpb_suporte_atendente'

export const obterNomeAtendente = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(CHAVE) || ''
}

export const definirNomeAtendente = (nome) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAVE, nome.trim())
}
