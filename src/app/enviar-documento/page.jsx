'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function EnviarDocumentoContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const [arquivo, setArquivo] = useState(null)
  const [tipo, setTipo] = useState('')
  const [base64, setBase64] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (!loading && authUser && userData?.tipo !== 'professor') router.push('/')
  }, [loading, authUser, userData, router])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      setErro('Arquivo muito grande. Máximo de 500KB.')
      setArquivo(null)
      setBase64('')
      return
    }

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setErro('Apenas PDF ou imagens (JPG, PNG).')
      setArquivo(null)
      setBase64('')
      return
    }

    setErro('')
    setArquivo(file)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const handleEnviar = async () => {
    setErro('')
    setSucesso('')

    if (!base64) { setErro('Selecione um arquivo.'); return }
    if (!tipo) { setErro('Selecione o tipo de documento.'); return }

    setSalvando(true)
    try {
      await updateDoc(doc(db, 'users', authUser.uid), {
        documento: base64,
        documentoMime: arquivo?.type || '',
        documentoNome: arquivo?.name || '',
        documentoTipo: tipo,
        documentoStatus: 'pendente',
      })
      setSucesso('Documento enviado com sucesso! Aguarde a análise da administração.')
      setArquivo(null)
      setBase64('')
      setTipo('')
    } catch {
      setErro('Erro ao enviar documento.')
    } finally {
      setSalvando(false)
    }
  }

  const statusAtual = userData?.documentoStatus

  if (loading || !authUser) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }
  if (userData?.tipo !== 'professor') return null

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-4xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <h1 className='text-lg font-bold text-[#82181A]'>Enviar Documento</h1>
            </div>
            <button onClick={logout} className='border border-neutral-300 text-neutral-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer'>Sair</button>
          </div>
        </header>

        <main className='max-w-4xl mx-auto px-6 py-10'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 space-y-6'>
            <div>
              <h2 className='text-xl font-bold text-[#82181A] mb-2'>Comprovação de Vínculo</h2>
              <p className='text-sm text-neutral-500'>
                Para acessar as edições do DHPB como professor, você precisa enviar um documento oficial que comprove seu vínculo como professor de História.
              </p>
              <p className='text-sm text-neutral-500 mt-1'>
                Documentos aceitos: <strong>contracheque, termo de posse, carteira de trabalho</strong> ou outro documento oficial. <em>Diplomas não serão aceitos.</em>
              </p>
            </div>

            {statusAtual === 'aprovado' && (
              <div className='bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg'>
                <p className='text-sm font-semibold text-green-700'>Seu documento foi aprovado! Você já pode acessar as edições.</p>
              </div>
            )}

            {statusAtual === 'recusado' && (
              <div className='bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg'>
                <p className='text-sm font-semibold text-red-700'>Seu documento foi recusado.</p>
                {userData?.documentoRecusadoMotivo && (
                  <p className='text-sm text-red-600 mt-1'>Motivo: {userData.documentoRecusadoMotivo}</p>
                )}
                <p className='text-sm text-red-600 mt-1'>Envie um novo documento abaixo.</p>
              </div>
            )}

            {(!statusAtual || statusAtual === 'pendente' || statusAtual === 'recusado') && (
              <>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Tipo de Documento</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                    className='w-full md:w-96 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A]'>
                    <option value="">Selecione</option>
                    <option value="contracheque">Contracheque</option>
                    <option value="termo_posse">Termo de Posse</option>
                    <option value="carteira_trabalho">Carteira de Trabalho</option>
                    <option value="outro">Outro documento oficial</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Documento (PDF ou imagem, max 500KB)</label>
                  <input type="file" accept=".pdf,image/*" onChange={handleFile}
                    className='block w-full text-sm text-neutral-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#82181A]/10 file:text-[#82181A] hover:file:bg-[#82181A]/20 cursor-pointer' />
                  {arquivo && (
                    <p className='text-xs text-neutral-400 mt-1'>{arquivo.name} ({(arquivo.size / 1024).toFixed(1)}KB)</p>
                  )}
                </div>

                {erro && <p className='text-sm text-red-600'>{erro}</p>}
                {sucesso && <p className='text-sm text-green-600'>{sucesso}</p>}

                <button onClick={handleEnviar} disabled={salvando || !base64}
                  className='bg-[#82181A] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer'>
                  {salvando ? 'Enviando...' : 'Enviar Documento'}
                </button>

                {statusAtual === 'pendente' && (
                  <div className='bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg'>
                    <p className='text-sm font-semibold text-amber-700'>Você já enviou um documento. Aguarde a análise da administração.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <EnviarDocumentoContent />
    </Suspense>
  )
}
