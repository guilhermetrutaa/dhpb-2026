'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function DocumentoContent() {
  const { authUser, loading } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const docIndex = parseInt(sp.get('docIndex') || '0')
  const questaoId = sp.get('questaoId')
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')
  const equipeId = sp.get('equipeId')

  const [docData, setDocData] = useState(null)
  const [questaoNum, setQuestaoNum] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!authUser || !questaoId) return
    const carregar = async () => {
      try {
        const qSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', questaoId))
        if (!qSnap.exists()) { setErro('Questão não encontrada.'); return }
        const qData = qSnap.data()
        setQuestaoNum(qData.numero || '')
        const docs = qData.documentos || []
        if (!docs[docIndex]) { setErro('Documento não encontrado.'); return }
        setDocData(docs[docIndex])
      } catch (e) { setErro('Erro: ' + (e.code || e.message)) }
      finally { setCarregando(false) }
    }
    carregar()
  }, [authUser, questaoId, faseId, edicaoId, docIndex])

  if (carregando || loading || !authUser) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }
  if (erro || !docData) {
    return <div className={`${poppins.className} min-h-screen flex items-center justify-center`}><p className="text-red-600">{erro || 'Documento não encontrado'}</p></div>
  }

  const blocosRender = (docData.blocos || []).length > 0 ? docData.blocos
    : (docData.tipo ? [{ tipo: docData.tipo, conteudo: docData.conteudo }] : [])

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-red-100 text-[#000]'>
        <div className='px-4 sm:px-6 md:px-10 pt-4 sm:pt-5'>
          <Link href={`/questao?questaoId=${questaoId}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId}`}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 shadow-sm text-neutral-500 text-sm font-semibold hover:text-[#82181A] transition-colors'>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/></svg>
            Voltar para questão
          </Link>
        </div>

        <div className='pt-10 sm:pt-15 md:pt-16'>
          <div className='px-4 sm:px-10 md:px-20 lg:px-40'>
            {docData.titulo && <h1 className='text-xl sm:text-2xl text-neutral-500 font-mono'>{docData.titulo}</h1>}
            {docData.subtitulo && (
              <p className='text-sm sm:text-base text-neutral-600 font-semibold italic pt-1'>{docData.subtitulo}</p>
            )}
          </div>
        </div>

        <div className='pt-8 px-4 sm:px-10 md:px-20 lg:px-40 space-y-4'>
          {blocosRender.length > 0 ? (
            blocosRender.map((bloco, j) => (
              <div key={bloco.id || j}>
                {bloco.tipo === 'texto' && (
                  <div className='bg-red-300/20 shadow-lg p-6 sm:p-10 rounded-[20px]'>
                    <div className='text-justify tracking-wider leading-relaxed' dangerouslySetInnerHTML={{ __html: bloco.conteudo }} />
                  </div>
                )}
                {bloco.tipo === 'imagem' && bloco.conteudo && (
                  <div className='flex justify-center'>
                    <img src={bloco.conteudo} alt={docData.titulo} className='max-w-full rounded-lg shadow-lg' />
                  </div>
                )}
                {bloco.tipo === 'video' && bloco.conteudo && (
                  <div className='bg-red-300/20 shadow-lg p-6 sm:p-10 rounded-[20px]'>
                    <div className='relative w-full pt-[56.25%]'>
                      <iframe src={bloco.conteudo.replace('watch?v=', 'embed/')} className='absolute top-0 left-0 w-full h-full rounded-lg' allowFullScreen />
                    </div>
                  </div>
                )}
                {bloco.tipo === 'pdf' && bloco.conteudo && (
                  <div className='flex justify-center'>
                    <embed src={bloco.conteudo} type="application/pdf" className='w-full h-[80vh] rounded-lg shadow-lg' />
                  </div>
                )}
                {bloco.tipo === 'musica' && bloco.conteudo && (
                  <div className='bg-red-300/20 shadow-lg p-6 sm:p-10 rounded-[20px]'>
                    <div className='relative w-full pt-[56.25%]'>
                      <iframe src={bloco.conteudo.replace('watch?v=', 'embed/')} className='absolute top-0 left-0 w-full h-full rounded-lg' allowFullScreen />
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className='text-neutral-400 text-center py-10'>Este documento não possui blocos de conteúdo.</p>
          )}
        </div>

        <div className='px-4 sm:px-10 md:px-20 lg:px-40 py-8'>
          <div className='bg-red-100 p-5 sm:p-6 rounded-xl max-w-2xl'>
            <h2 className='text-lg font-semibold mb-4'>Sobre este documento</h2>
            <div className='space-y-3 text-sm'>
              {docData.titulo && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Título</p>
                  <p className='flex-1'>{docData.titulo}</p>
                </div>
              )}
              {docData.subtitulo && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Tipo</p>
                  <p className='flex-1'>{docData.subtitulo}</p>
                </div>
              )}
              {(docData.glossario || []).length > 0 && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Glossário</p>
                  <div className='flex-1 space-y-1'>
                    {docData.glossario.map((g, j) => (
                      <p key={j}><strong>{g.termo}:</strong> {g.definicao}</p>
                    ))}
                  </div>
                </div>
              )}
              {docData.origem && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Origem</p>
                  <p className='flex-1'>{docData.origem}</p>
                </div>
              )}
              {docData.creditos && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Créditos</p>
                  <p className='flex-1'>{docData.creditos}</p>
                </div>
              )}
              {docData.disponivelEm && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Disponível em</p>
                  <p className='flex-1 break-all'>{docData.disponivelEm}</p>
                </div>
              )}
              {(docData.palavrasChave || []).length > 0 && (
                <div className='flex flex-col sm:flex-row'>
                  <p className='sm:w-32 text-neutral-500 font-medium shrink-0'>Palavras-chave</p>
                  <div className='flex flex-wrap gap-1.5'>
                    {docData.palavrasChave.map((kw, j) => (
                      <span key={j} className='bg-[#82181A] text-white px-2.5 py-0.5 rounded-full text-xs'>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <DocumentoContent />
    </Suspense>
  )
}
