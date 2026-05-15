'use client'

import React, { useState } from 'react'
import { Poppins } from 'next/font/google'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function Page() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleEnviar = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setEnviado(true)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setErro('Nenhuma conta encontrada com este email.')
      } else if (err.code === 'auth/invalid-email') {
        setErro('Email inválido.')
      } else {
        setErro('Erro ao enviar. Tente novamente.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
        <main className='flex-1 flex items-center justify-center px-6 py-12'>
            <div className='w-full max-w-md'>
              <div className='text-center'>
                <h1 className='text-3xl md:text-[2.2rem] text-[#82181A] font-medium'>Recuperar Senha</h1>
                <p className='text-[#2e2e2e] pt-5'>Digite seu email para receber o link de redefinição de senha.</p>
              </div>

              {enviado ? (
                <div className='space-y-6 pt-10'>
                  <div className='bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg'>
                    <p className='text-sm font-semibold text-green-700'>Email enviado!</p>
                    <p className='text-sm text-green-600 mt-1'>Verifique sua caixa de entrada (spam e lixeira) e siga as instruções para redefinir sua senha.</p>
                  </div>
                  <a href="/login"
                    className='block w-full text-center bg-[#82181A] py-4 font-semibold text-white hover:bg-[#631214] transition-colors'>
                    Voltar para o login
                  </a>
                </div>
              ) : (
                <form onSubmit={handleEnviar} className="space-y-6 pt-10">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-900">Email</label>
                    <input
                      type="email"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                    />
                  </div>

                  {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

                  <button
                    type="submit"
                    disabled={carregando}
                    className="w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors disabled:opacity-50"
                  >
                    {carregando ? 'Enviando...' : 'Enviar link'}
                  </button>

                  <div className="text-center text-sm text-neutral-900">
                    <a href="/login" className="font-semibold text-[#82181A] hover:underline">
                      Voltar para o login
                    </a>
                  </div>
                </form>
              )}
            </div>
        </main>
      </div>
    </div>
  )
}
