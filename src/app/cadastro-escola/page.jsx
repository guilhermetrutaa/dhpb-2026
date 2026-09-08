'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function normalizarNomeBusca(nome) {
  return nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

const TIPO_LABEL = {
  municipal: 'Municipal',
  estadual: 'Estadual',
  federal: 'Federal',
  particular: 'Particular',
  publica: 'Pública',
}

function CadastroEscolaForm() {
  const { authUser, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const edicaoId = searchParams.get('edicaoId')

  const [inep, setInep] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [escola, setEscola] = useState(null)
  const [cadastrando, setCadastrando] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')

  useEffect(() => {
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  const handleBuscar = async (e) => {
    e?.preventDefault()
    setErro('')
    setEscola(null)

    const inepLimpo = inep.replace(/\D/g, '').slice(0, 8)
    if (inepLimpo.length < 8) { setErro('Digite um código INEP válido (8 dígitos).'); return }

    setBuscando(true)
    try {
      // 1. Tenta buscar no arquivo estático local (0 leituras)
      let escolaEncontrada = null
      try {
        const res = await fetch('/escolas-pb.json')
        if (res.ok) {
          const lista = await res.json()
          escolaEncontrada = lista.find(e => e.id === inepLimpo)
        }
      } catch {}

      if (escolaEncontrada) {
        setEscola(escolaEncontrada)
        return
      }

      // 2. Fallback caso não esteja no JSON estático
      const snap = await getDoc(doc(db, 'escolas', inepLimpo))
      if (!snap.exists()) { setErro('Escola não encontrada. Verifique o código INEP.'); return }
      setEscola({ id: snap.id, ...snap.data() })
    } catch {
      setErro('Erro ao buscar escola. Tente novamente.')
    } finally {
      setBuscando(false)
    }
  }

  const handleConfirmar = async () => {
    if (!escola) return
    setCadastrando(true)
    setErroCadastro('')
    try {
      await setDoc(doc(db, 'escolas', escola.id), {
        cadastrada: true,
        cadastradaPor: authUser.uid,
        cadastradaEm: new Date().toISOString(),
        nomeBusca: normalizarNomeBusca(escola.nome),
      }, { merge: true })
      const params = new URLSearchParams()
      params.set('escolaId', escola.id)
      params.set('escolaNome', encodeURIComponent(escola.nome))
      if (edicaoId) params.set('edicaoId', edicaoId)
      router.push(`/criar-equipe?${params.toString()}`)
    } catch (err) {
      setErroCadastro('Erro ao cadastrar escola: ' + (err?.message || 'Erro desconhecido'))
    } finally {
      setCadastrando(false)
    }
  }

  if (loading || !authUser) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
        <main className='flex flex-col lg:flex-row flex-1'>
          <div className='hidden lg:block lg:w-1/2 bg-[#fff] leading-none'>
            <Image
              src="/bg-cadastro-escola.svg"
              width={800}
              height={100}
              alt="Background"
              className="w-full h-screen object-cover align-middle"
              style={{ display: 'block' }}
            />
          </div>

          <div className='w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pl-50 lg:pt-30 flex flex-col justify-start items-center lg:items-start'>
            <div className='w-full max-w-md'>
              <div className='text-center lg:text-left'>
                <h1 className='text-3xl md:text-[2.2rem] text-[#82181A] font-medium'>Buscar Escola</h1>
                <p className='text-[#2e2e2e] pt-5'>Informe o código INEP da escola</p>
              </div>

              <form onSubmit={handleBuscar} className="space-y-6 pt-10">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Código INEP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 25000012"
                    value={inep}
                    onChange={(e) => setInep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                    required
                    className="block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]"
                  />
                </div>

                {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

                {!escola && (
                  <button
                    type="submit"
                    disabled={buscando}
                    className="w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-xl lg:rounded-none disabled:opacity-50"
                  >
                    {buscando ? 'Buscando...' : 'Buscar Escola'}
                  </button>
                )}
              </form>

              {escola && (
                <div className='mt-6 space-y-4'>
                  <div className='p-4 space-y-2 bg-cover bg-center' style={{ backgroundImage: 'url(/bg-escola.svg)' }}>
                    <p className='text-[1.2rem] font-medium text-[#fff]'>Escola encontrada!</p>
                    <div className='text-sm text-[#fff] space-y-1'>
                      <p><span className='font-light'>Nome:</span> {escola.nome}</p>
                      <p><span className='font-light'>Município:</span> {escola.municipio}</p>
                      <p><span className='font-light'>Endereço:</span> {escola.endereco}</p>
                      <p><span className='font-light'>UF:</span> {escola.uf}</p>
                      <p><span className='font-light'>Tipo:</span> {TIPO_LABEL[escola.tipo] || escola.tipo || escola.dependenciaAdm}</p>
                    </div>
                  </div>

                  {erroCadastro && <p className="text-red-600 text-sm text-center">{erroCadastro}</p>}

                  <div className='flex gap-3'>
                    <button onClick={() => { setEscola(null); setInep('') }} disabled={cadastrando}
                      className='flex-1 border border-neutral-300 py-4 font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-50 disabled:opacity-50 transition-colors rounded-xl lg:rounded-none'>
                      Buscar outra
                    </button>
                    <button onClick={handleConfirmar} disabled={cadastrando}
                      className='flex-1 bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] disabled:opacity-50 transition-colors rounded-xl lg:rounded-none'>
                      {cadastrando ? 'Cadastrando...' : 'Confirmar Escola'}
                    </button>
                  </div>
                </div>
              )}

              {!escola && (
                <p className='text-[0.8rem] text-neutral-500 text-center mt-6'>
                  Não sabe o código INEP?{' '}
                  <a href={`https://anonymousdata.inep.gov.br/analytics/saw.dll?Dashboard&PortalPath=%2Fshared%2FCenso%20da%20Educa%C3%A7%C3%A3o%20B%C3%A1sica%2F_portal%2FCat%C3%A1logo%20de%20Escolas&Page=Lista%20das%20Escolas&P1=dashboard&Action=Navigate&ViewState=a7svfjgsic5mtdobnqb9ioblt6&P16=NavRuleDefault&NavFromViewID=d%3Adashboard~p%3Asf156n9k0qs70741`} target="_blank" rel="noopener noreferrer" className='text-[#82181A] font-bold hover:underline'>
                    Consulte no site do INEP
                  </a>
                </p>
              )}
            </div>
          </div>
        </main>

        <footer className="w-full pt-12 pb-10 border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center lg:items-start gap-4">
                <img src="/logo.svg" alt="DHPB" className="h-14 w-auto object-contain" />
                <div className="flex items-center gap-4 text-black">
                  <a href="https://www.instagram.com/oficialdhpb/" target="_blank" rel="noopener noreferrer" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
                    </svg>
                  </a>
                  <a href="https://www.tiktok.com/@oficialdhpb" target="_blank" rel="noopener noreferrer" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16">
                      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
                    </svg>
                  </a>
                  <a href="#" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-youtube" viewBox="0 0 16 16">
                      <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="hidden lg:block w-px h-20 bg-neutral-300" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Realização:</span>
                <img src="/ifpb-logo.svg" alt="IFPB" className="h-10 w-auto object-contain" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Apoio:</span>
                <div className="flex items-center gap-5 flex-wrap justify-center">
                  <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
                  <img src="/logo-nuhcl.svg" alt="NUHCL" className="h-10 w-auto object-contain" />
                  <img src="/logo-ufcg.svg" alt="HISTORIA-UFCG" className="h-12 w-auto object-contain" />
                  <img src="/logo-ndh.svg" alt="NDH" className="h-13 w-auto object-contain" />
                </div>
              </div>
              <div className="hidden lg:block w-px h-20 bg-neutral-300" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Powered by:</span>
                <div className="flex items-center gap-4">
                  <img src="/kodeo-logo.svg" alt="Kodeo" className="h-10 w-auto object-contain" />
                  <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </footer>
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
