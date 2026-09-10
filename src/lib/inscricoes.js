import { doc, getDoc, getDocFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const CONFIG_PLATAFORMA_PATH = ['config', 'plataforma']

export const MSG_INSCRICOES_ENCERRADAS =
  'As inscrições do 4º DHPB foram encerradas em 10/09/2026. Quem já tem conta continua podendo entrar. Equipes com os quatro integrantes seguem na sala e nas provas.'

export function refConfigPlataforma() {
  return doc(db, ...CONFIG_PLATAFORMA_PATH)
}

export function inscricoesEstaoAbertas(snap) {
  if (!snap || !snap.exists()) return true
  return snap.data()?.inscricoesAbertas !== false
}

export async function lerInscricoesAbertas({ fromServer = false } = {}) {
  const ref = refConfigPlataforma()
  const snap = fromServer ? await getDocFromServer(ref) : await getDoc(ref)
  return inscricoesEstaoAbertas(snap)
}

export function equipeTemQuatroMembros(equipe) {
  const membros = equipe?.membros || []
  return Boolean(membros[0] && membros[1] && membros[2] && membros[3])
}
