'use client'

import React, { useState } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const Page = () => {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await signInWithEmailAndPassword(auth, 'admin@dhpb.com', senha)
      localStorage.setItem('admin-authenticated', 'true')
      router.push('/admin/dashboard')
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setErro('Senha inválida.')
      } else {
        setErro('Erro: ' + (err.code || err.message))
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
        <main className='flex flex-col lg:flex-row flex-1'>
          <div className='hidden lg:block lg:w-1/2'>
            <Image
              src="/bg-admin.svg"
              width={800}
              height={100}
              alt="Background"
              className="w-full h-screen object-cover"
            />
          </div>

          <div className='w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pl-50 lg:pt-40 flex flex-col justify-start items-center lg:items-start'>
            <div className='w-full max-w-md'>
              <div className='text-center lg:text-left'>
                <h1 className='text-3xl md:text-[2.2rem] text-[#82181A] font-medium'>Admin</h1>
                <p className='text-[#2e2e2e] pt-5'>Acesso restrito ao painel administrativo</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6 pt-10">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Email</label>
                  <input
                    type="email"
                    value="admin@dhpb.com"
                    disabled
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm bg-neutral-50 text-neutral-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Senha</label>
                  <input
                    type="password"
                    placeholder="Digite a senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  />
                </div>

                {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-xl lg:rounded-none disabled:opacity-50"
                >
                  {carregando ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page
