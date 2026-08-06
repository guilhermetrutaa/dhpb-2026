'use client'

import { signInWithCustomToken } from 'firebase/auth'
import { supportAuth } from '@/lib/support/firebase'
import { auth } from '@/lib/firebase'

let promessa = null

export const autenticarAdminSuporte = async () => {
  if (!supportAuth) throw new Error('Suporte não configurado')

  if (supportAuth.currentUser?.uid) {
    const token = await supportAuth.currentUser.getIdToken()
    if (token) return supportAuth.currentUser
  }

  if (promessa) return promessa

  promessa = (async () => {
    if (!auth.currentUser) throw new Error('Admin não autenticado no DHPB')
    const tokenId = await auth.currentUser.getIdToken(true)
    const res = await fetch('/api/support/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    })
    if (!res.ok) throw new Error('Falha ao autenticar no suporte')
    const { customToken, role } = await res.json()
    if (role !== 'admin') throw new Error('Acesso restrito à equipe do DHPB')
    await signInWithCustomToken(supportAuth, customToken)
    return supportAuth.currentUser
  })().finally(() => {
    setTimeout(() => {
      promessa = null
    }, 1500)
  })

  return promessa
}
