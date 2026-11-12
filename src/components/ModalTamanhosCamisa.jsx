'use client'

import React, { useEffect, useState } from 'react'
import { Poppins } from 'next/font/google'
import { collection, doc, getDocs, query, runTransaction, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { TAMANHOS, motivoBloqueioTamanhos } from '@/lib/tamanhosCamisa'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const ALERTA = {
  ja: 'Esta equipe já enviou os tamanhos.',
  presenca: 'Confirme a presença na final antes de enviar os tamanhos.',
}

export default function ModalTamanhosCamisa({ authUser, userData, equipe, onComplete, onClose }) {
  const membros = (equipe.membros || []).filter((m) => m.status === 'ativo')
  const [jaInformados, setJaInformados] = useState({})
  const [buscando, setBuscando] = useState(true)
  const [escolhas, setEscolhas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const pendentes = membros.filter((m) => !(m.papel === 'professor_orientador' && jaInformados[m.uid]))

  useEffect(() => {
    const profs = membros.filter((m) => m.papel === 'professor_orientador' && m.uid)
    if (!profs.length) {
      setBuscando(false)
      return
    }
    let ativo = true
    ;(async () => {
      const ja = {}
      try {
        for (const p of profs) {
          const snap = await getDocs(query(collection(db, 'equipes'), where('orientadorUids', 'array-contains', p.uid)))
          for (const d of snap.docs) {
            if (d.id === equipe.id) continue
            const data = d.data()
            if (data.edicaoId !== equipe.edicaoId) continue
            const item = (data.tamanhosCamisa?.membros || []).find((m) => m.uid === p.uid && TAMANHOS.includes(m.tamanho))
            if (item) ja[p.uid] = item.tamanho
          }
        }
      } catch {
        // sem a consulta, o orientador aparece e pode responder
      }
      if (!ativo) return
      setJaInformados(ja)
      setBuscando(false)
    })()
    return () => { ativo = false }
  }, [equipe.id, equipe.edicaoId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (enviando || buscando || !pendentes.length) return
    if (pendentes.some((m) => !TAMANHOS.includes(escolhas[m.uid]))) return
    setEnviando(true)
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'equipes', equipe.id)
        const snap = await tx.get(ref)
        const bloqueio = motivoBloqueioTamanhos(snap.data())
        if (bloqueio) {
          const err = new Error(bloqueio)
          err.code = bloqueio
          throw err
        }
        tx.update(ref, {
          tamanhosCamisa: {
            membros: pendentes.map((m) => ({
              uid: m.uid || '',
              nome: m.nome || '',
              papel: m.papel || '',
              tamanho: escolhas[m.uid],
            })),
            respondidoPor: authUser.uid,
            respondidoPorNome: `${userData?.nome || ''} ${userData?.sobrenome || ''}`.trim(),
            respondidoEm: new Date().toISOString(),
          },
        })
      })
      onComplete()
      return
    } catch (err) {
      const code = err?.code || err?.message
      alert(ALERTA[code] || 'Erro ao salvar os tamanhos. Tente novamente.')
      if (code === 'ja') {
        onComplete()
        return
      }
    }
    setEnviando(false)
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-black/60 ${poppins.className}`}>
      <div className="flex items-start justify-center min-h-full px-4 py-8">
        <div className="relative w-full max-w-3xl bg-white">
          <div className="bg-[#82181A] text-white px-8 py-6 relative">
            <h2 className="text-2xl font-bold">Tamanhos das camisas</h2>
            <p className="text-white/80 text-sm mt-1">Um membro responde pela equipe. O envio é único.</p>
            <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 text-[#000]">
            <div>
              <p className="text-sm font-semibold text-[#82181A]">Equipe</p>
              <p className="mt-1 text-lg font-bold">{equipe.nome}</p>
            </div>

            {Object.keys(jaInformados).length > 0 && (
              <p className="text-sm text-neutral-600">O professor orientador já informou o tamanho em outra equipe. Não é preciso repetir.</p>
            )}

            <div className="space-y-3">
              {pendentes.map((m) => (
                <div key={m.uid} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">{m.nome}</p>
                  <div className="flex gap-4">
                    {TAMANHOS.map((t) => (
                      <label key={t} className="flex cursor-pointer items-center gap-1">
                        <input
                          type="radio"
                          name={`tam-${m.uid}`}
                          required
                          checked={escolhas[m.uid] === t}
                          onChange={() => setEscolhas((s) => ({ ...s, [m.uid]: t }))}
                          className="accent-[#82181A]"
                        />
                        <span className="text-sm font-semibold">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={enviando || buscando || !pendentes.length}
              className="w-full cursor-pointer rounded-2xl bg-[#82181A] py-4 text-lg font-semibold text-white transition-all hover:bg-[#631214] disabled:opacity-50"
            >
              {enviando ? 'Salvando...' : buscando ? 'Carregando...' : 'Enviar tamanhos'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
