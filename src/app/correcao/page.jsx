'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Poppins } from 'next/font/google'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'
import {
  COLUNAS,
  CORRETORES,
  FASE_ALVO,
  colunaDe,
  escolherTerceiro,
  identificarCorretor,
  normalizar,
  notaFinal,
  precisaTerceira,
} from '@/lib/correcao'
import { acrescentarTerceiro, carregarDistribuicao, carregarVeredito, gravarNota, salvarVeredito } from '@/lib/correcao-firestore'
import { BLOCOS, CRITERIOS_DO_BLOCO, NIVEIS, PESO_TOTAL, notaDe, pendentes, somar } from '@/lib/criterios'
import { respostaTarefaDaFase } from '@/lib/bonificarRecorte13'
import PortfolioWall from '@/app/tarefas/portfolio-artistico/PortfolioWall'
import { FUNDO_SRC } from '@/app/tarefas/viagem-no-tempo/config'
import {
  MOCK_CORRECOES,
  MOCK_DISTRIBUICAO,
  MOCK_EQUIPES,
  MOCK_USUARIO,
  MOCK_VEREDITOS,
  mockRespostaTarefa,
} from './mock'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const CHAVE_SESSAO = 'correcao-authenticated'

// Mesmo padrão de bypass das páginas de tarefa (spec 042): sem Firebase em dev local.
// A produção nunca entra neste caminho — `localhost` não existe no domínio do Vercel.
function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

// ---------------------------------------------------------------------------
// Login / cadastro
// ---------------------------------------------------------------------------

function TelaAcesso({ aoEntrar }) {
  const [aba, setAba] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const campo =
    'block w-full rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]'

  const mensagens = {
    'auth/invalid-credential': 'Email ou senha inválidos.',
    'auth/user-not-found': 'Email ou senha inválidos.',
    'auth/wrong-password': 'Email ou senha inválidos.',
    'auth/email-already-in-use': 'Já existe uma conta com esse email.',
    'auth/invalid-email': 'Email inválido.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/weak-password': 'A senha precisa ter no mínimo 6 caracteres.',
  }

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter no mínimo 6 caracteres.')
    setCarregando(true)
    try {
      await setPersistence(auth, browserLocalPersistence)
      const cred = await signInWithEmailAndPassword(auth, email.trim(), senha)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      const dados = snap.exists() ? snap.data() : {}
      if (dados.tipo && dados.tipo !== 'corretor') {
        await signOut(auth)
        setErro('Esta conta não é da comissão corretora.')
        return
      }
      localStorage.setItem(CHAVE_SESSAO, 'true')
      aoEntrar({ uid: cred.user.uid, email: cred.user.email, nome: dados.nomeCompleto || dados.nome || cred.user.email })
    } catch (err) {
      setErro(mensagens[err.code] || 'Erro ao entrar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function cadastrar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter no mínimo 6 caracteres.')
    setCarregando(true)
    try {
      await setPersistence(auth, browserLocalPersistence)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha)
      const nomeCompleto = nome.trim()
      const partes = nomeCompleto.split(' ')
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          nome: partes[0] || nomeCompleto,
          sobrenome: partes.slice(1).join(' '),
          nomeCompleto,
          email: cred.user.email,
          tipo: 'corretor',
          avatar: '/avatar.svg',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      )
      localStorage.setItem(CHAVE_SESSAO, 'true')
      aoEntrar({ uid: cred.user.uid, email: cred.user.email, nome: nomeCompleto })
    } catch (err) {
      setErro(mensagens[err.code] || 'Erro ao criar a conta. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={poppins.className}>
      <div className="w-full min-h-screen bg-[#fff] text-[#000] flex flex-col">
        <main className="flex flex-col lg:flex-row flex-1">
          <div className="hidden lg:block lg:w-1/2">
            <Image src="/bg-admin.svg" width={800} height={100} alt="" className="w-full h-screen object-cover" />
          </div>

          <div className="w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pt-28 flex flex-col items-center lg:items-start">
            <div className="w-full max-w-md">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl md:text-[2.2rem] text-[#82181A] font-medium">Correção</h1>
                <p className="text-[#2e2e2e] pt-3">Sistema de correção da Fase 4 — Portfólio Artístico</p>
              </div>

              <div className="flex gap-1 mt-8 border-b border-neutral-200">
                {[
                  { id: 'entrar', texto: 'Entrar' },
                  { id: 'cadastrar', texto: 'Criar conta' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setAba(t.id)
                      setErro('')
                    }}
                    className={`px-5 py-3 text-sm font-medium cursor-pointer border-b-2 -mb-px transition-colors ${
                      aba === t.id
                        ? 'border-[#82181A] text-[#82181A]'
                        : 'border-transparent text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {t.texto}
                  </button>
                ))}
              </div>

              <form onSubmit={aba === 'entrar' ? entrar : cadastrar} className="space-y-6 pt-8">
                {aba === 'cadastrar' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-900">Nome completo</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Como consta na lista da comissão"
                      required
                      className={campo}
                    />
                    <p className="text-xs text-neutral-500">
                      É este nome que identifica você na comissão. Sem ele a fila fica vazia.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className={campo}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder={aba === 'cadastrar' ? 'Mínimo de 6 caracteres' : 'Digite a senha'}
                    required
                    autoComplete={aba === 'entrar' ? 'current-password' : 'new-password'}
                    className={campo}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-[#82181A] focus:ring-[#82181A]"
                  />
                  <span className="text-sm text-neutral-900">Manter conectado</span>
                </label>

                {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#82181A] py-4 font-semibold text-white cursor-pointer hover:bg-[#631214] transition-colors rounded-xl disabled:opacity-50"
                >
                  {carregando ? 'Aguarde...' : aba === 'entrar' ? 'Entrar' : 'Criar conta e entrar'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function Card({ item, aoAbrir }) {
  return (
    <button
      type="button"
      onClick={() => aoAbrir(item)}
      className="w-full text-left bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(130,24,26,0.35)] hover:-translate-y-0.5 transition-all px-3 py-2.5 cursor-pointer border-l-[3px] border-l-[#82181A]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-[#1a1a1a] leading-tight">{item.nome}</span>
        {item.notaFinal != null && (
          <span className="shrink-0 text-xs font-bold text-white bg-[#82181A] px-1.5 py-0.5 rounded-full tabular-nums">
            {item.notaFinal}
          </span>
        )}
      </div>
      <div className="text-xs text-neutral-600 mt-1 truncate">{item.escola}</div>
      {item.cidade && <div className="text-xs text-neutral-400 truncate">{item.cidade}</div>}
      {item.minhaNota != null && (
        <div className="inline-block text-xs font-medium text-neutral-700 bg-neutral-100 rounded px-1.5 py-0.5 mt-2">
          Minha nota: {item.minhaNota}
        </div>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Painel de correção
// ---------------------------------------------------------------------------

function LinhaCriterio({ criterio, valor, zerado, aoMarcar, aoAlternarZero }) {
  return (
    <li className="bg-neutral-50 rounded-lg px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-neutral-800 leading-snug">{criterio.texto}</p>
        <span className="shrink-0 text-xs font-semibold text-neutral-500 tabular-nums">peso {criterio.peso}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {NIVEIS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => aoMarcar(n.id)}
              title={n.nome}
              aria-pressed={valor === n.id}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                valor === n.id
                  ? 'border-[#82181A] bg-[#82181A] text-white'
                  : 'border-neutral-300 bg-white text-neutral-600 hover:border-[#82181A]'
              }`}
            >
              {n.nome}
            </button>
          ))}
          <button
            type="button"
            onClick={aoAlternarZero}
            aria-pressed={zerado}
            title="Imagem produzida por IA: este item vale 0"
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
              zerado
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-neutral-300 bg-white text-neutral-500 hover:border-amber-600'
            }`}
          >
            IA = 0
          </button>
        </div>
        <span className="shrink-0 text-xs font-bold text-neutral-900 tabular-nums">
          {notaDe(criterio.id, valor, zerado)}
        </span>
      </div>
    </li>
  )
}

function Painel({ equipe, correcao, aoSalvar, aoFechar }) {
  // O pai remonta com `key={equipe.id}`, então o estado inicial já é o da equipe certa
  // e não precisa de efeito para sincronizar.
  const [criterios, setCriterios] = useState(() => correcao?.criterios || {})
  const [zerados, setZerados] = useState(() => new Set(correcao?.zerados || []))
  const [situacao, setSituacao] = useState('')
  const timer = useRef(null)

  const nota = useMemo(() => somar(criterios, zerados), [criterios, zerados])
  const faltando = useMemo(() => pendentes(criterios), [criterios])

  const agendar = useCallback(
    (proximos, proximosZerados) => {
      if (timer.current) clearTimeout(timer.current)
      setSituacao('salvando…')
      timer.current = setTimeout(async () => {
        try {
          await aoSalvar({ criterios: proximos, zerados: [...proximosZerados], nota: somar(proximos, proximosZerados) })
          setSituacao('salvo')
        } catch {
          setSituacao('falha ao salvar')
        }
      }, 800)
    },
    [aoSalvar]
  )

  useEffect(() => () => timer.current && clearTimeout(timer.current), [])

  function marcar(id, nivel) {
    const proximos = { ...criterios, [id]: nivel }
    setCriterios(proximos)
    agendar(proximos, zerados)
  }

  function alternarZero(id) {
    const proximos = new Set(zerados)
    if (proximos.has(id)) proximos.delete(id)
    else proximos.add(id)
    setZerados(proximos)
    agendar(criterios, proximos)
  }

  const pontosDoBloco = (bloco) => {
    const ids = new Set(CRITERIOS_DO_BLOCO(bloco).map((c) => c.id))
    return somar(criterios, [...zerados].filter((id) => ids.has(id)))
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-5 py-4 border-b border-neutral-200 flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900 truncate">{equipe.nome}</h2>
          <p className="text-sm text-neutral-600 truncate">
            {equipe.escola}
            {equipe.cidade ? ` · ${equipe.cidade}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="shrink-0 text-neutral-400 hover:text-neutral-900 cursor-pointer text-2xl leading-none px-2"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <p className="text-xs bg-[#F8E9B0] text-neutral-800 px-3 py-2 rounded-md">
          Se a equipe usou imagens criadas por IA, os itens sobre essas imagens valem 0 — marque “IA = 0” no critério.
        </p>

        {BLOCOS.map((bloco) => {
          const itens = CRITERIOS_DO_BLOCO(bloco.id)
          const faltamNoBloco = itens.filter((c) => faltando.includes(c.id)).length
          return (
            <section key={bloco.id}>
              <div className="flex items-baseline justify-between gap-2 border-b border-neutral-200 pb-1 mb-3">
                <h3 className="text-sm font-semibold text-[#82181A]">{bloco.rotulo}</h3>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {pontosDoBloco(bloco.id)} pts{faltamNoBloco > 0 && ` · ${faltamNoBloco} a responder`}
                </span>
              </div>
              <ul className="space-y-3">
                {itens.map((c) => (
                  <LinhaCriterio
                    key={c.id}
                    criterio={c}
                    valor={criterios[c.id]}
                    zerado={zerados.has(c.id)}
                    aoMarcar={(n) => marcar(c.id, n)}
                    aoAlternarZero={() => alternarZero(c.id)}
                  />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <footer className="px-5 py-4 border-t border-neutral-200 shrink-0 flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-[#82181A] tabular-nums">
            {nota} <span className="text-sm font-medium text-neutral-500">/ {PESO_TOTAL}</span>
          </div>
          <div className="text-xs text-neutral-500">
            {faltando.length > 0 ? `${faltando.length} critérios sem responder` : 'Todos os critérios respondidos'}
            {situacao && ` · ${situacao}`}
          </div>
        </div>
        <button
          type="button"
          disabled={faltando.length > 0}
          onClick={() => aoSalvar({ criterios, zerados: [...zerados], nota, enviar: true })}
          className="shrink-0 px-5 py-3 bg-[#82181A] text-white font-semibold rounded-lg hover:bg-[#631214] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enviar correção
        </button>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

function Board({ sessao, corretor, sim }) {
  const [abaAtiva, setAbaAtiva] = useState(null)
  const [equipes, setEquipes] = useState([])
  const [notasFs, setNotasFs] = useState({})
  const [distribuicao, setDistribuicao] = useState(null)
  const [aberta, setAberta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const aba = abaAtiva || CORRETORES[0].id

// Distribuição (doc único) + as equipes do corretor. Nada de varredura:
  // `distribuicao.atribuido` já diz quais equipes são de quem.
  useEffect(() => {
    let vivo = true
    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        if (isLocalDevHost()) {
          setDistribuicao(MOCK_DISTRIBUICAO)
          const lista = MOCK_EQUIPES.map((e) => ({
            id: e.id,
            nome: e.nome,
            escola: e.escola,
            cidade: e.cidade,
            coluna: e.coluna,
            campus: e.campus,
            notaFinal: mockRespostaTarefa(e.id)?.peso || null,
            portfolio: mockRespostaTarefa(e.id)?.portfolio || {},
            design: mockRespostaTarefa(e.id)?.design || 'rosa',
          })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
          setEquipes(lista)
          setCarregando(false)
          return
        }

        const dist = await carregarDistribuicao()
        if (!vivo) return
        setDistribuicao(dist)

        const atrib = dist?.atribuido || {}
        const ids = Object.entries(atrib)
          .filter(([, corretores]) => Array.isArray(corretores) && corretores.includes(aba))
          .map(([equipeId]) => equipeId)

        if (!ids.length) {
          setEquipes([])
          setCarregando(false)
          return
        }

        const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'equipes', id)).then((s) => [id, s])))
        if (!vivo) return

        const lista = []
        for (const [id, snap] of snaps) {
          if (!snap.exists()) continue
          const dados = snap.data()
          const resposta = respostaTarefaDaFase(dados, FASE_ALVO)
          lista.push({
            id,
            nome: dados.nome || id,
            escola: dados.escola || '—',
            cidade: dados.cidade || '',
            coluna: colunaDe(dados),
            campus: normalizar(dados.cidade || ''),
            notaFinal: resposta?.peso || null,
            portfolio: resposta?.portfolio || {},
            design: resposta?.design || 'rosa',
          })
        }
        lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        setEquipes(lista)
        setCarregando(false)
      } catch {
        if (!vivo) return
        setErro('Não foi possível carregar a fila. Recarregue a página.')
        setCarregando(false)
      }
    }
    carregar()
    return () => {
      vivo = false
    }
  }, [aba])

/** Uma query traz todas as correções desta aba — inclui o mapa `notas` dos pares. */
useEffect(() => {
    if (isLocalDevHost()) return
    if (!equipes.length) return
    let vivo = true

    getDocs(
      query(
        collection(db, 'correcoes', FASE_ALVO, 'correcoes'),
        where('enviados', 'array-contains', aba),
        limit(500)
      )
    )
      .then((snap) => {
        if (!vivo) return
        const mapa = {}
        for (const d of snap.docs) {
          const dados = d.data()
          if (dados.equipeId) mapa[dados.equipeId] = dados
        }
        setNotasFs(mapa)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [aba, equipes])

  // Na simulação as correções vêm do mock (derivado, sem efeito); no resto, do Firestore.
  const notas = useMemo(() => {
    if (!isLocalDevHost()) return notasFs
    const mapa = {}
    for (const e of equipes) {
      const c = MOCK_CORRECOES[e.id]
      if (c && (c.enviados || []).includes(aba)) mapa[e.id] = c
    }
    return mapa
  }, [notasFs, equipes, aba])

  const semNome = !!sessao && !corretor

  function porColuna(id) {
    return equipes.filter((e) => {
      const terminei = (notas[e.id]?.enviados || []).includes(aba)
      return id === 'corrigidas' ? terminei : e.coluna === id && !terminei
    })
  }

  /** 2 notas fecham o veredito; divergência ≥ 20 pede a 3ª; 3 notas fecham sozinhas. */
  const fecharVeredito = useCallback(
    async (equipe, notasAposEnvio) => {
      const sim = isLocalDevHost()

      // Quem pode corrigir: os 2 da distribuição + o 3º já designado. O doc de
      // veredito é a fonte da verdade do 3º; sem somá-lo a nota dele fica fora.
      const veredito = sim ? MOCK_VEREDITOS[equipe.id] : await carregarVeredito(equipe.id)
      const distribuidos = distribuicao?.atribuido?.[equipe.id] || []
      const atrib = Array.from(new Set([...distribuidos, ...(veredito?.atribuido || [])]))
      const registrados = atrib.filter((cid) => typeof notasAposEnvio[cid] === 'number')
      const valores = registrados.map((cid) => notasAposEnvio[cid])
      const pares = registrados.map((cid, i) => ({ corretorId: cid, nota: valores[i] }))

      const gravar = async (equipeId, dados) => {
        if (sim) {
          MOCK_VEREDITOS[equipeId] = { ...dados, equipeId }
          return null
        }
        return salvarVeredito(equipeId, dados)
      }

      if (registrados.length < 2) {
        await gravar(equipe.id, { status: 'aguardando-par', atribuido: atrib, notas: pares })
        return
      }

      if (precisaTerceira(valores) && registrados.length === 2) {
        const terceiro = escolherTerceiro({
          campus: equipe.campus,
          jaAtribuidos: registrados,
          carga: distribuicao?.carga || {},
        })
        if (terceiro) {
          // Sem isto a aba do 3º não listaria o portfólio e o veredito nunca fecharia.
          if (!sim) await acrescentarTerceiro(equipe.id, terceiro.id)
          await gravar(equipe.id, {
            status: 'aguardando-terceira',
            atribuido: [...registrados, terceiro.id],
            terceira: terceiro.id,
            notas: pares,
          })
          setAviso(
            `Divergência de ${Math.abs(valores[0] - valores[1])} pontos em ${equipe.nome}: ${terceiro.nome} fará a 3ª correção.`
          )
          return
        }
      }

      const final = notaFinal(valores)
      const r = sim ? { delta: final } : await gravarNota(equipe.id, FASE_ALVO, final, aba)
      await gravar(equipe.id, {
        status: 'fechado',
        atribuido: registrados,
        notas: pares,
        notaFinal: final,
        delta: r?.delta ?? 0,
      })
      setEquipes((lista) => lista.map((e) => (e.id === equipe.id ? { ...e, notaFinal: final } : e)))
      setAviso(`Nota final de ${equipe.nome}: ${final}.`)
    },
    [aba, distribuicao]
  )

  /**
   * Persiste a correção do corretor e, quando é o envio, tenta fechar o veredito.
   * `notas` é o doc do par: por isso uma query só traz o estado dos dois.
   */
  const salvar = useCallback(
    async (equipe, dados) => {
      const atual = notas[equipe.id] || {}
      const enviados = dados.enviar
        ? Array.from(new Set([...(atual.enviados || []), aba]))
        : atual.enviados || []

      // Um doc por equipe. `enviados` diz quem já fechou a correção dela;
      // a query da aba usa `array-contains` em `enviados`, então um doc traz
      // também as notas do par — é o que permite fechar o veredito com 1 leitura.
      const registro = {
        equipeId: equipe.id,
        enviados,
        notas: { ...(atual.notas || {}), [aba]: dados.nota },
        criterios: dados.criterios,
        zerados: dados.zerados,
        atualizadoEm: new Date().toISOString(),
      }
      if (!isLocalDevHost()) {
        await setDoc(doc(db, 'correcoes', FASE_ALVO, 'correcoes', equipe.id), registro, { merge: true })
      }
      setNotasFs((n) => ({ ...n, [equipe.id]: registro }))

      if (dados.enviar) await fecharVeredito(equipe, registro.notas)
    },
    [aba, notas, fecharVeredito]
  )

  const corrigir = useCallback(
    (dados) => (aberta ? salvar(aberta, dados) : Promise.resolve()),
    [aberta, salvar]
  )

  return (
    <div
      className={`${poppins.className} min-h-screen flex flex-col bg-cover bg-center`}
      style={{ backgroundImage: `url(${FUNDO_SRC})`, backgroundAttachment: 'fixed' }}
    >
      <header className="bg-[#82181A] text-white px-5 py-3 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight">Correção — Fase 4 · Portfólio Artístico</h1>
          <p className="text-xs text-white/80 truncate">
            {sessao?.nome}
            {corretor ? ` · ${corretor.nome}` : ''}
            {sessao?.email ? ` · ${sessao.email}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (sim) return
            localStorage.removeItem(CHAVE_SESSAO)
            await signOut(auth)
          }}
          className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
        >
          {sim ? 'Simulação' : 'Sair'}
        </button>
      </header>

      {sim && (
        <div className="mx-5 mt-4 bg-white/85 backdrop-blur-sm border border-amber-500 text-amber-950 text-sm px-4 py-2.5 rounded-lg flex items-center justify-between gap-4 shadow-sm">
          <span>
            <strong>Simulação local.</strong> Dados fictícios, sem Firebase. Nada disso vai para o banco e nada afeta a
            pontuação real.
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
          >
            Recarregar simulação
          </button>
        </div>
      )}

      {semNome && (
        <div className="mx-5 mt-5 bg-white/90 border border-amber-500 text-amber-950 text-sm px-4 py-3 rounded-lg shadow-sm">
          <strong>Não encontramos seu nome na comissão.</strong> Este acesso foi criado com “{sessao?.nome}”, que não
          corresponde a nenhum dos 7 corretores. Fale com o admin para ajustar o cadastro.
        </div>
      )}

      {!semNome && (
        <>
          <nav className="mx-5 mt-4 bg-white/85 backdrop-blur-sm border border-white/60 rounded-full px-2 flex gap-1 overflow-x-auto shadow-sm">
            {CORRETORES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setAbaAtiva(c.id)
                  setAberta(null)
                  setAviso('')
                }}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer rounded-full transition-colors ${
                  aba === c.id
                    ? 'bg-[#82181A] text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-white/70'
                }`}
              >
                {c.nome}
                {corretor?.id === c.id && (
                  <span className="ml-1.5 text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded">você</span>
                )}
              </button>
            ))}
          </nav>

          {erro && <div className="mx-5 mt-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-lg">{erro}</div>}
          {aviso && <div className="mx-5 mt-4 bg-white/90 border border-sky-300 text-sky-900 text-sm px-4 py-3 rounded-lg shadow-sm">{aviso}</div>}

          {!distribuicao && !carregando ? (
            <p className="m-5 bg-white/85 border border-white/60 text-neutral-700 text-sm px-4 py-3 rounded-lg">
              A distribuição ainda não foi gerada. Peça ao admin.
            </p>
          ) : carregando ? (
            <p className="m-5 bg-white/85 border border-white/60 text-neutral-700 text-sm px-4 py-3 rounded-lg">
              Carregando a fila…
            </p>
          ) : (
            <div className="flex-1 flex gap-4 px-5 py-5 overflow-x-auto items-stretch min-h-0">
              {COLUNAS.map((col) => {
                const lista = porColuna(col.id)
                return (
                  <section
                    key={col.id}
                    className="shrink-0 w-72 flex flex-col rounded-2xl bg-white/80 backdrop-blur-sm border border-white/70 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] overflow-hidden"
                  >
                    <div className="px-3.5 py-3 border-b border-neutral-200/80 flex items-center justify-between gap-2">
                      <h2 className="text-sm font-bold text-neutral-800">{col.titulo}</h2>
                      <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-200/70 px-2 py-0.5 rounded-full tabular-nums">
                        {lista.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
                      {lista.map((e) => (
                        <Card
                          key={e.id}
                          item={{ ...e, minhaNota: notas[e.id]?.notas?.[aba] }}
                          aoAbrir={setAberta}
                        />
                      ))}
                      {!lista.length && (
                        <p className="text-xs text-neutral-400 text-center py-8">
                          {col.id === 'corrigidas' ? 'Nada corrigido ainda' : 'Vazio'}
                        </p>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      {aberta && (
        <div className="fixed inset-0 z-50 bg-white flex">
          <div className="w-1/2 min-w-0 border-r border-neutral-200 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <PortfolioWall
                portfolio={aberta.portfolio}
                temaId={aberta.design}
                nomeEquipe={aberta.nome}
                onClose={() => setAberta(null)}
              />
            </div>
          </div>
          <div className="w-1/2 min-w-0">
            <Painel
              key={aberta.id}
              equipe={aberta}
              correcao={notas[aberta.id]}
              aoSalvar={corrigir}
              aoFechar={() => setAberta(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const semInscricao = () => () => {}

/** `true` no cliente, `false` no servidor: o `sim` só liga depois da hidratação. */
function useEstaNoCliente() {
  return useSyncExternalStore(
    semInscricao,
    () => true,
    () => false
  )
}

function AreaCorrecao() {
  const montado = useEstaNoCliente()
  const [sessaoReal, setSessaoReal] = useState(null)
  const [verificando, setVerificando] = useState(true)

  const sim = montado && isLocalDevHost()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        localStorage.removeItem(CHAVE_SESSAO)
        setSessaoReal(null)
        setVerificando(false)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const dados = snap.exists() ? snap.data() : {}
        setSessaoReal({ uid: user.uid, email: user.email, nome: dados.nomeCompleto || dados.nome || user.email })
      } catch {
        setSessaoReal({ uid: user.uid, email: user.email, nome: user.email })
      }
      setVerificando(false)
    })
    return unsub
  }, [])

  const sessao = sim ? MOCK_USUARIO : sessaoReal
  const aguardando = sim ? false : verificando
  const corretor = useMemo(() => identificarCorretor(sessao?.nome, sessao?.email), [sessao])

  if (aguardando) {
    return (
      <div className={`${poppins.className} min-h-screen flex items-center justify-center`}>
        <p className="text-[#82181A]">Carregando…</p>
      </div>
    )
  }

  if (!sessao) return <TelaAcesso aoEntrar={setSessaoReal} />
  return <Board sessao={sessao} corretor={corretor} sim={sim} />
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className={`${poppins.className} min-h-screen flex items-center justify-center`}>
          <p className="text-[#82181A]">Carregando...</p>
        </div>
      }
    >
      <AreaCorrecao />
    </Suspense>
  )
}