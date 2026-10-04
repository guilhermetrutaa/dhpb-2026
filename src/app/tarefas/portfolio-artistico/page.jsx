'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { doc, getDoc, runTransaction } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { optimizeCloudinaryUrl } from '@/lib/cloudinary'
import PortfolioWall from './PortfolioWall'
import {
  IMG_TIPOS,
  MIN_CHARS,
  SECOES,
  TEMAS,
  contarFaltantes,
  linkValido,
  validarImagem,
} from './config'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const STORAGE_PREFIX = 'dhpb-tarefa-portfolio-artistico'

function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

function lerLocal(faseId) {
  try {
    return JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}:${faseId || 'preview'}`) || 'null')
  } catch {
    return null
  }
}

function gravarLocal(faseId, payload) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:${faseId || 'preview'}`, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

function formatAudit(iso, nome, entregue) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const quem = nome || 'um integrante'
  return entregue
    ? `Tarefa entregue por ${quem}, dia ${dia} às ${hora}`
    : `Última alteração por ${quem}, dia ${dia} às ${hora}`
}

async function lerDimensoes(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new window.Image()
    img.src = url
    await img.decode()
    return { width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Correção é feita pela banca: a entrega não credita pontos (peso 0, delta 0), então não há increment.
async function persistirResposta({ equipeId, faseId, status, design, portfolio, atualizadoPor }) {
  const respostaId = `tarefa_${faseId}`
  const respostaRef = doc(db, 'equipes', equipeId, 'respostas', respostaId)
  const equipeRef = doc(db, 'equipes', equipeId)

  const respostaObj = {
    status,
    peso: 0,
    faseId,
    tipo: 'tarefa',
    design,
    portfolio,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor,
  }

  await runTransaction(db, async (transaction) => {
    const rSnap = await transaction.get(respostaRef)
    if (rSnap.exists() && rSnap.data().status === 'entregue') {
      throw new Error('Tarefa já entregue por outro membro.')
    }
    transaction.set(respostaRef, respostaObj)
    transaction.update(equipeRef, {
      [`respostas.${respostaId}`]: respostaObj,
      [`respostas.tarefa`]: respostaObj,
    })
  })

  return respostaObj
}

function Header({ userData, equipeId, logout }) {
  return (
    <header className="flex flex-col items-center justify-around gap-6 px-4 pb-5 pt-5 lg:flex-row">
      <div><Image src="/logo.svg" width={100} height={100} alt="Logo" /></div>
      <nav>
        <ul className="flex flex-wrap justify-center gap-4 text-sm md:gap-6 md:text-base">
          <li className="transition-colors hover:text-[#82181A] hover:underline">
            <a href={userData?.tipo === 'professor' ? '/home-professor' : '/home'}>Home</a>
          </li>
          <li className="transition-colors hover:text-[#82181A] hover:underline">
            <a href={`/sala-de-equipe?equipeId=${equipeId}`}>Sala de Prova</a>
          </li>
          <li className="transition-colors hover:text-[#82181A] hover:underline"><a href="/calendario">Calendário</a></li>
          <li className="transition-colors hover:text-[#82181A] hover:underline"><a href="/contato">Contato</a></li>
          <li className="transition-colors hover:text-[#82181A] hover:underline"><a href="/regulamento">Regulamento</a></li>
        </ul>
      </nav>
      <button
        type="button"
        onClick={logout}
        className="cursor-pointer whitespace-nowrap border-[3px] border-[#82181A] px-6 py-2 font-medium text-[#82181A] transition-colors hover:bg-[#82181A] hover:text-white"
      >
        Sair
      </button>
    </header>
  )
}

const inputBase = 'w-full border bg-[#fdd5d5] px-4 py-3 text-[15px] placeholder:italic placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#82181A]/40 disabled:cursor-not-allowed disabled:opacity-70'

function CampoTexto({ campo, valor = '', onChange, disabled }) {
  const curto = valor.length > 0 && valor.trim().length < MIN_CHARS
  const linkRuim = campo.tipo === 'link' && valor.trim() && !linkValido(valor)
  const borda = curto || linkRuim ? 'border-red-600' : 'border-neutral-500'
  const props = {
    id: campo.id,
    value: valor,
    maxLength: campo.max,
    disabled,
    onChange: (e) => onChange(e.target.value),
  }
  return (
    <>
      {campo.tipo === 'area' ? (
        <textarea {...props} rows={campo.rows || 4} placeholder="Insira o texto" className={`${inputBase} ${borda} resize-y`} />
      ) : campo.tipo === 'link' ? (
        <div className={`flex items-center gap-3 border bg-[#fdd5d5] px-4 ${borda}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
          </svg>
          <input {...props} type="url" placeholder="https://" className="w-full bg-transparent py-3 text-[15px] focus:outline-none disabled:cursor-not-allowed" />
        </div>
      ) : (
        <input {...props} type="text" placeholder="Insira o texto" className={`${inputBase} ${borda}`} />
      )}
      <div className="mt-1 flex justify-between text-[11px] italic text-neutral-600">
        <span className={curto || linkRuim ? 'text-red-600' : ''}>
          {campo.opcional
            ? linkRuim ? 'Informe um link começando com https://' : 'Opcional — use para vídeo ou música.'
            : `Mínimo de ${MIN_CHARS} e máximo de ${campo.max} caracteres.`}
        </span>
        <span className="font-medium not-italic text-neutral-800">({valor.length}/{campo.max})</span>
      </div>
    </>
  )
}

function CampoImagem({ campo, valor, onFile, onRemove, enviando, erro, disabled }) {
  const [arrastando, setArrastando] = useState(false)
  return (
    <>
      <label
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          const file = e.dataTransfer.files?.[0]
          if (file && !disabled) onFile(file)
        }}
        className={`flex items-center gap-4 border border-dashed border-neutral-500 px-4 py-4 transition-colors ${arrastando ? 'bg-[#f9b9b9]' : 'bg-[#fdd5d5]'} ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-[#fbc7c7]'}`}
      >
        <input
          type="file"
          accept={IMG_TIPOS.join(',')}
          disabled={disabled || enviando}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onFile(file)
          }}
        />
        {valor?.url ? (
          <img src={optimizeCloudinaryUrl(valor.url, { width: 200 })} alt="" className="h-14 w-14 shrink-0 border border-[#82181A] object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#82181A] text-[#82181A]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </span>
        )}
        <span className="flex-1">
          <span className="block text-sm font-semibold">
            {enviando ? 'Enviando...' : valor?.url ? 'Trocar imagem' : 'Selecionar imagem'}
          </span>
          <span className="block text-[11px] text-neutral-700">JPG ou PNG · até 3 MB · máximo 3000 × 3000 px</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#82181A" strokeWidth="2" aria-hidden>
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />
        </svg>
      </label>
      <div className="mt-1 flex justify-between text-[11px]">
        <span className="text-red-600">{erro}</span>
        {valor?.url && !disabled && (
          <button type="button" onClick={onRemove} className="cursor-pointer text-neutral-600 underline hover:text-[#82181A]">
            Remover imagem
          </button>
        )}
      </div>
    </>
  )
}

function TarefaContent() {
  const { authUser, userData, loading, logout } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const equipeId = sp.get('equipeId')
  const faseId = sp.get('faseId')
  const edicaoId = sp.get('edicaoId')

  const [fase, setFase] = useState(null)
  const [nomeEquipe, setNomeEquipe] = useState('')
  const [portfolio, setPortfolio] = useState({})
  const [design, setDesign] = useState('')
  const [status, setStatus] = useState('pendente')
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [atualizadoPor, setAtualizadoPor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [localPreview, setLocalPreview] = useState(false)
  const [sujo, setSujo] = useState(false)
  const [previa, setPrevia] = useState(false)
  const [enviando, setEnviando] = useState({})
  const [errosImg, setErrosImg] = useState({})

  const resumoHref = `/resumo-fase?faseId=${faseId || ''}&edicaoId=${edicaoId || ''}&equipeId=${equipeId || ''}`
  const locked = status === 'entregue' || fase?.status === 'correcao'
  const faltantes = contarFaltantes(portfolio)
  const questoes = [...(fase?.questoesIndex || fase?.questoes || [])].filter((q) => q.id).sort((a, b) => (a.numero || 0) - (b.numero || 0))
  const ultima = questoes[questoes.length - 1]
  const setaEsquerdaHref = ultima && faseId && edicaoId
    ? `/questao?questaoId=${ultima.id}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId || ''}&prevId=${questoes[questoes.length - 2]?.id || ''}&nextId=`
    : ''

  const aplicarResposta = (r) => {
    setPortfolio(r.portfolio || {})
    if (r.design) setDesign(r.design)
    setStatus(r.status || 'pendente')
    setAtualizadoEm(r.atualizadoEm || '')
    setAtualizadoPor(r.atualizadoPor || '')
  }

  useEffect(() => {
    if (!isLocalDevHost()) return
    setLocalPreview(true)
    setCarregando(false)
    setNomeEquipe('Equipe (prévia)')
    setFase((atual) => atual || { tarefa: { titulo: 'Portfólio do Artista' }, status: 'aberta' })
    const salvo = lerLocal(faseId)
    if (salvo) aplicarResposta(salvo)
  }, [faseId])

  useEffect(() => {
    if (isLocalDevHost()) return
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  useEffect(() => {
    if (isLocalDevHost()) return
    if (!loading && authUser && (!equipeId || !faseId || !edicaoId)) {
      setErro('Faltam equipeId, faseId ou edicaoId. Volte pelo resumo da fase.')
      setCarregando(false)
    }
  }, [loading, authUser, equipeId, faseId, edicaoId])

  useEffect(() => {
    if (localPreview || !authUser || !equipeId || !faseId || !edicaoId) return
    const home = userData?.tipo === 'professor' ? '/home-professor' : '/home'

    const carregar = async () => {
      try {
        const equipeSnap = await getDoc(doc(db, 'equipes', equipeId))
        if (!equipeSnap.exists()) return router.push(home)
        const equipe = equipeSnap.data()
        if (!(equipe.membros || []).some((m) => m.uid === authUser.uid && m.status === 'ativo')) return router.push(home)
        setNomeEquipe(equipe.nome || '')

        const faseSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
        if (!faseSnap.exists()) {
          setErro('Fase não encontrada.')
          return
        }
        const faseData = { id: faseSnap.id, ...faseSnap.data() }
        if (faseData.status !== 'aberta' && faseData.status !== 'correcao') return router.push(home)
        setFase(faseData)

        const rSnap = await getDoc(doc(db, 'equipes', equipeId, 'respostas', `tarefa_${faseId}`))
        if (rSnap.exists()) aplicarResposta(rSnap.data())
      } catch (err) {
        setErro(err?.message || 'Não foi possível carregar a tarefa.')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [localPreview, authUser, equipeId, faseId, edicaoId, router, userData])

  useEffect(() => {
    if (!sujo) return
    const aviso = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [sujo])

  useEffect(() => {
    if (!previa) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [previa])

  const alterar = (id, valor) => {
    if (locked) return
    setPortfolio((p) => ({ ...p, [id]: valor }))
    setSujo(true)
  }

  const enviarImagem = async (id, file) => {
    if (locked) return
    setErrosImg((e) => ({ ...e, [id]: '' }))
    try {
      const { width, height } = await lerDimensoes(file)
      const msg = validarImagem({ size: file.size, type: file.type, width, height })
      if (msg) {
        setErrosImg((e) => ({ ...e, [id]: msg }))
        return
      }
    } catch {
      setErrosImg((e) => ({ ...e, [id]: 'Não foi possível ler a imagem.' }))
      return
    }

    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (localPreview && (!cloud || !preset)) {
      alterar(id, { url: URL.createObjectURL(file), publicId: '' })
      return
    }

    setEnviando((s) => ({ ...s, [id]: true }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', preset)
      formData.append('folder', `dhpb/portfolios/${equipeId || 'preview'}`)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error?.message || 'Falha no upload.')
      alterar(id, { url: data.secure_url, publicId: data.public_id })
    } catch (err) {
      setErrosImg((e) => ({ ...e, [id]: err?.message || 'Falha no upload.' }))
    } finally {
      setEnviando((s) => ({ ...s, [id]: false }))
    }
  }

  const salvar = async (novoStatus) => {
    if (locked) return
    if (Object.values(enviando).some(Boolean)) {
      setMensagem('Aguarde o envio das imagens terminar.')
      return
    }
    setSalvando(true)
    setMensagem('')

    if (localPreview) {
      const agora = new Date().toISOString()
      const payload = { status: novoStatus, design, portfolio, atualizadoEm: agora, atualizadoPor: 'prévia local' }
      gravarLocal(faseId, payload)
      aplicarResposta(payload)
      setSujo(false)
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue (só nesta prévia).' : 'Rascunho salvo (só nesta prévia).')
      setSalvando(false)
      return
    }

    try {
      const r = await persistirResposta({
        equipeId,
        faseId,
        status: novoStatus,
        design,
        portfolio,
        atualizadoPor: userData?.nome || authUser.email,
      })
      aplicarResposta(r)
      setSujo(false)
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue!' : 'Rascunho salvo.')
    } catch (err) {
      setMensagem(err?.message || 'Não foi possível salvar agora.')
    } finally {
      setSalvando(false)
    }
  }

  const entregar = () => {
    if (locked) return
    const aviso = faltantes.length
      ? `Ainda há ${faltantes.length} campo(s) incompleto(s), por exemplo: "${faltantes[0]}".\n\nDeseja entregar mesmo assim?`
      : 'Tem certeza que deseja entregar o portfólio?'
    if (!window.confirm(`${aviso} Após a entrega nenhuma alteração será permitida.`)) return
    salvar('entregue')
  }

  if (!localPreview && (loading || carregando || !authUser)) {
    return (
      <div className={`${poppins.className} flex min-h-screen w-full items-center justify-center`}>
        <p className="text-lg text-[#82181A]">Carregando...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className={`${poppins.className} flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4`}>
        <p className="mb-4 text-xl font-bold text-red-600">{erro}</p>
        <Link href={equipeId && faseId && edicaoId ? resumoHref : '/home'} className="text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  const botaoSecundario = 'cursor-pointer border-2 border-[#82181A] px-5 py-2.5 text-sm font-semibold text-[#82181A] transition-colors hover:bg-[#82181A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
  const botaoPrimario = 'cursor-pointer bg-[#82181A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#631214] disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className={poppins.className}>
      <div className="min-h-screen w-full bg-white text-black">
        <Header userData={userData} equipeId={equipeId} logout={localPreview ? () => {} : logout} />

        {localPreview && (
          <p className="bg-[#82181A] px-4 py-2 text-center text-sm text-white">
            Prévia local — sem login e sem Firestore. Em produção o acesso continua autenticado.
          </p>
        )}

        <main className="mx-auto max-w-[620px] px-5 pb-24 pt-12">
          <div className="grid grid-cols-[44px_1fr_44px] items-center">
            <div>
              {setaEsquerdaHref && (
                <Link href={setaEsquerdaHref} className="flex h-10 w-10 items-center justify-center" aria-label="Questão anterior">
                  <span className="border-y-[7px] border-y-transparent border-r-[10px] border-r-black" />
                </Link>
              )}
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#82181A]">Produção do portfólio</p>
              <h1 className="mt-1 text-[2rem] font-medium leading-tight text-[#82181A] md:text-[2.4rem]">
                {fase?.tarefa?.titulo || 'Portfólio do Artista'}
              </h1>
            </div>
            <div />
          </div>
          <p className="mt-3 text-center text-sm text-neutral-700">Leia cada orientação e preencha os campos na ordem apresentada.</p>

          {(status !== 'pendente' || locked) && (
            <div className={`mt-8 px-4 py-3 text-center text-sm ${status === 'entregue' ? 'bg-[#CCFFE6]' : locked ? 'bg-[#F7F7F7]' : 'bg-[#F8E3E3]'}`}>
              {status === 'entregue'
                ? formatAudit(atualizadoEm, atualizadoPor, true) || 'Tarefa entregue.'
                : locked
                  ? 'Fase em correção: somente leitura.'
                  : formatAudit(atualizadoEm, atualizadoPor, false)}
            </div>
          )}

          {!locked && (
            <div className="mt-8 border-l-4 border-[#82181A] bg-[#F8E3E3] px-4 py-3 text-sm leading-relaxed text-neutral-800">
              <strong className="text-[#82181A]">Escolha do design:</strong> preencha os textos e as imagens abaixo. Ao clicar em
              {' '}<strong>&quot;Concluir preenchimento&quot;</strong>, ao final da página, a equipe escolherá um dos quatro designs do portfólio
              e verá a prévia de como ele ficará. O design pode ser trocado até a entrega.
            </div>
          )}

          {SECOES.map((secao) => (
            <section key={secao.titulo} className="mt-12 border-t border-neutral-200 pt-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82181A]">{secao.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#82181A]">{secao.titulo}</h2>
              {secao.campos.map((campo) => (
                <div key={campo.id} className="mt-8">
                  <label htmlFor={campo.tipo === 'img' ? undefined : campo.id} className="block text-[15px] font-semibold">
                    {campo.label}
                  </label>
                  {campo.orientacao && <p className="mb-3 mt-1 text-[13px] leading-relaxed text-neutral-700">{campo.orientacao}</p>}
                  {!campo.orientacao && <div className="mb-3" />}
                  {campo.tipo === 'img' ? (
                    <CampoImagem
                      campo={campo}
                      valor={portfolio[campo.id]}
                      onFile={(file) => enviarImagem(campo.id, file)}
                      onRemove={() => alterar(campo.id, null)}
                      enviando={!!enviando[campo.id]}
                      erro={errosImg[campo.id]}
                      disabled={locked}
                    />
                  ) : (
                    <CampoTexto campo={campo} valor={portfolio[campo.id] || ''} onChange={(v) => alterar(campo.id, v)} disabled={locked} />
                  )}
                </div>
              ))}
            </section>
          ))}

          <div className="mt-14 flex flex-col gap-4 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xs text-sm text-neutral-700">
              {faltantes.length
                ? `${faltantes.length} campo(s) ainda incompleto(s). Revise antes de entregar.`
                : 'Todos os campos obrigatórios foram preenchidos.'}
              {!locked && ' Ao concluir, vocês escolherão o design do portfólio.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {!locked && (
                <button type="button" onClick={() => salvar('rascunho')} disabled={salvando} className={botaoSecundario}>
                  {salvando ? 'Salvando...' : 'Salvar rascunho'}
                </button>
              )}
              <button type="button" onClick={() => setPrevia(true)} className={botaoPrimario}>
                {locked ? 'Ver portfólio' : '✓ Concluir preenchimento'}
              </button>
            </div>
          </div>
          {mensagem && <p className="mt-4 text-right text-sm font-medium text-[#82181A]">{mensagem}</p>}

          <div className="mt-10 text-center">
            <Link href={resumoHref} className="text-sm text-neutral-600 underline hover:text-[#82181A]">Voltar para o resumo da fase</Link>
          </div>
        </main>
      </div>

      {previa && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/95 backdrop-blur-sm" role="dialog" aria-label="Prévia do portfólio">
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-neutral-950/90 px-4 py-3 text-white backdrop-blur">
            <button type="button" onClick={() => setPrevia(false)} className="cursor-pointer text-sm font-medium hover:underline">
              ← {locked ? 'Fechar' : 'Voltar e editar'}
            </button>
            {!locked && design && (
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Trocar design">
                {TEMAS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={design === t.id}
                    aria-label={t.nome}
                    title={t.nome}
                    onClick={() => { setDesign(t.id); setSujo(true) }}
                    className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 ${design === t.id ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: t.bg }}
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {mensagem && <span className="text-xs text-white/80">{mensagem}</span>}
              {!locked && design && (
                <>
                  <button type="button" onClick={() => salvar('rascunho')} disabled={salvando} className="cursor-pointer border border-white/70 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white hover:text-black disabled:opacity-50">
                    {salvando ? 'Salvando...' : 'Salvar rascunho'}
                  </button>
                  <button type="button" onClick={entregar} disabled={salvando} className="cursor-pointer bg-[#82181A] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#631214] disabled:opacity-50">
                    Entregar a questão
                  </button>
                </>
              )}
            </div>
          </div>
          {!design && !locked ? (
            <section className="mx-auto max-w-5xl px-5 py-12 text-white">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Etapa final</p>
              <h2 className="mt-2 text-center text-3xl font-semibold">Escolha o design do portfólio</h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/80">
                O conteúdo é o mesmo nos quatro designs; muda a aparência da parede. Depois de escolher, vocês verão a prévia e ainda poderão trocar até a entrega.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Design do portfólio">
                {TEMAS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={false}
                    onClick={() => { setDesign(t.id); setSujo(true) }}
                    className="group cursor-pointer overflow-hidden bg-white text-left text-black shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                  >
                    <img src={t.thumb} alt={`Design ${t.nome}`} className="h-64 w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" style={{ backgroundColor: t.bg }} />
                    <span className="flex items-center gap-2 px-3 py-3 font-medium">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: t.accent }} />
                      {t.nome}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="px-2 py-8 md:px-6">
              <PortfolioWall portfolio={portfolio} temaId={design} nomeEquipe={nomeEquipe} onClose={() => setPrevia(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TarefaContent />
    </Suspense>
  )
}
