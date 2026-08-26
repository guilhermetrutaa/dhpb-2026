'use client'

import React, { useState } from 'react'
import { Poppins } from 'next/font/google'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const Page = () => {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [link, setLink] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const enviarNotificacao = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !corpo.trim()) return

    if (!window.confirm('Tem certeza que deseja enviar esta notificação para TODOS os usuários inscritos?')) {
      return
    }

    setEnviando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/support/send-mass-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, corpo, link }),
      })
      const data = await res.json()

      if (data.ok) {
        setResultado({
          type: data.semDestinatarios ? 'info' : 'success',
          msg: data.semDestinatarios ? data.msg : `Sucesso! Enviado para ${data.enviados} pessoas.`
        })
        setTitulo('')
        setCorpo('')
        setLink('')
      } else {
        setResultado({ type: 'error', msg: `Erro: ${data.erro || data.aviso}` })
      }
    } catch (err) {
      setResultado({ type: 'error', msg: 'Falha na requisição. Verifique o console.' })
    }
    setEnviando(false)
  }

  return (
    <div className={poppins.className}>
      <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-[#000]'>
        <header className='bg-white shadow-sm border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Image src="/logo.svg" width={44} height={44} alt="Logo" />
              <div>
                <h1 className='text-lg font-bold text-[#82181A]'>Notificações em Massa</h1>
                <p className='text-xs text-neutral-400'>Disparo via Web Push (FCM)</p>
              </div>
            </div>
            <button onClick={() => router.push('/admin')} className='border border-[#82181A] text-[#82181A] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-all cursor-pointer'>
              Voltar ao Admin
            </button>
          </div>
        </header>

        <main className='max-w-3xl mx-auto px-6 py-10'>
          <div className='bg-white rounded-2xl shadow-sm border border-neutral-200 p-8'>
            <h2 className='text-xl font-bold text-[#82181A] mb-2'>Nova Notificação</h2>
            <p className='text-sm text-neutral-500 mb-8'>
              Preencha os dados abaixo. A mensagem aparecerá nos computadores e celulares de todos que permitiram as notificações do site, mesmo que não estejam com ele aberto.
            </p>

            <form onSubmit={enviarNotificacao} className='space-y-5'>
              <div>
                <label className='block text-sm font-semibold text-neutral-700 mb-1'>Título <span className='text-red-500'>*</span></label>
                <input
                  type='text'
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder='Ex: As inscrições estão abertas!'
                  required
                  className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-neutral-700 mb-1'>Mensagem <span className='text-red-500'>*</span></label>
                <textarea
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                  placeholder='Ex: Corra e garanta a vaga da sua equipe no 4º DHPB.'
                  required
                  rows={4}
                  className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A] resize-none'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-neutral-700 mb-1'>Link ao clicar (Opcional)</label>
                <input
                  type='text'
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder='Ex: /regulamento ou https://google.com'
                  className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]'
                />
                <p className='text-[11px] text-neutral-400 mt-1'>Se deixado em branco, abrirá a página inicial do site.</p>
              </div>

              {resultado && (
                <div className={`p-4 rounded-xl text-sm font-medium ${resultado.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : resultado.type === 'info' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {resultado.msg}
                </div>
              )}

              <div className='pt-4'>
                <button
                  type='submit'
                  disabled={enviando || !titulo.trim() || !corpo.trim()}
                  className='w-full bg-[#82181A] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-[#631214] transition-all disabled:opacity-50 cursor-pointer shadow-md'
                >
                  {enviando ? 'Disparando...' : '🚀 Enviar Notificação'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page
