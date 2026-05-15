'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function CadastroEscolaForm() {
  const { authUser, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('')
  const [endereco, setEndereco] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login')
    }
  }, [loading, authUser, router])

  const handleCadastrar = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!nome.trim() || !tipo) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    setCarregando(true)

    try {
      const docRef = await addDoc(collection(db, 'escolas'), {
        nome: nome.trim(),
        tipo,
        endereco: endereco.trim(),
        criadoPor: authUser.uid,
        createdAt: new Date().toISOString(),
      })

      const edicaoId = searchParams.get('edicaoId')
      if (edicaoId) {
        router.push(`/criar-equipe?edicaoId=${edicaoId}&escolaId=${docRef.id}&escolaNome=${encodeURIComponent(nome.trim())}`)
      } else {
        setSucesso('Escola cadastrada com sucesso!')
        setNome('')
        setTipo('')
        setEndereco('')
      }
    } catch {
      setErro('Erro ao cadastrar escola.')
    } finally {
      setCarregando(false)
    }
  }

  if (loading || !authUser) {
    return (
      <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}>
        <p className="text-[#82181A] text-lg">Carregando...</p>
      </div>
    )
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
        <main className='flex flex-col lg:flex-row flex-1'>
          <div className='hidden lg:block lg:w-1/2 bg-[#fff] leading-none'>
            <Image
              src="/bg-cadastro.svg"
              width={800}
              height={100}
              alt="Background"
              className="w-full h-full object-cover align-middle"
              style={{ display: 'block' }}
            />
          </div>

          <div className='w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pl-50 lg:pt-30 flex flex-col justify-start items-center lg:items-start'>
            <div className='w-full max-w-md'>
              <div className='text-center lg:text-left'>
                <h1 className='text-3xl md:text-[2.2rem] text-[#82181A] font-medium'>Cadastrar Escola</h1>
                <p className='text-[#2e2e2e] pt-5'>Cadastre a escola para sua equipe</p>
              </div>

              <form onSubmit={handleCadastrar} className="space-y-6 pt-10">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Nome da Escola *</label>
                  <input
                    type="text"
                    placeholder="Digite o nome da escola"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Tipo da Escola *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  >
                    <option value="" disabled>Selecione uma opção</option>
                    <option value="publica">Pública</option>
                    <option value="particular">Particular</option>
                    <option value="federal">Federal</option>
                    <option value="estadual">Estadual</option>
                    <option value="municipal">Municipal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Endereço</label>
                  <input
                    type="text"
                    placeholder="Endereço da escola (opcional)"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  />
                </div>

                {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}
                {sucesso && <p className="text-green-600 text-sm text-center">{sucesso}</p>}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-xl lg:rounded-none disabled:opacity-50"
                >
                  {carregando ? 'Cadastrando...' : 'Cadastrar Escola'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <CadastroEscolaForm />
    </Suspense>
  )
}
