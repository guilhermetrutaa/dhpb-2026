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
  CAMINHOS,
  COLUNAS,
  CORRETORES,
  FASE_ALVO,
  colunaDe,
  escolherTerceiro,
  explicarErro,
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

  // Removido rounded-2xl, adicionado rounded-none para visual mais quadrado e clássico
  const campo =
    'block w-full rounded-none border border-neutral-400 bg-white p-3 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A] transition-none'

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
      <div className="w-full min-h-screen bg-[#f5f5f5] text-[#000] flex flex-col">
        <main className="flex flex-col lg:flex-row flex-1">
          <div className="hidden lg:block lg:w-1/2 bg-white border-r border-neutral-200">
            <Image src="/bg-admin.svg" width={800} height={100} alt="" className="w-full h-screen object-cover" />
          </div>

          <div className="w-full lg:w-1/2 px-6 py-12 md:px-20 lg:pt-28 flex flex-col items-center lg:items-start bg-white lg:bg-transparent">
            <div className="w-full max-w-md bg-white lg:bg-transparent lg:p-0 p-8 border lg:border-none border-neutral-300">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl md:text-[2.2rem] text-[#82181A] font-medium uppercase tracking-wide">Correção</h1>
                <p className="text-[#333] pt-2">Sistema de correção da Fase 4 — Portfólio Artístico</p>
              </div>

              <div className="flex gap-1 mt-8 border-b-2 border-neutral-300">
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
                    className={`px-5 py-3 text-sm font-bold uppercase tracking-wider cursor-pointer border-b-4 -mb-[2px] transition-none ${
                      aba === t.id
                        ? 'border-[#82181A] text-[#82181A]'
                        : 'border-transparent text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {t.texto}
                  </button>
                ))}
              </div>

              <form onSubmit={aba === 'entrar' ? entrar : cadastrar} className="space-y-5 pt-8">
                {aba === 'cadastrar' && (
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-neutral-900 uppercase">Nome completo</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Como consta na lista da comissão"
                      required
                      className={campo}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      É este nome que identifica você na comissão.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-bold text-neutral-900 uppercase">Email</label>
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

                <div className="space-y-1">
                  <label className="block text-sm font-bold text-neutral-900 uppercase">Senha</label>
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

                <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="h-4 w-4 rounded-none border-neutral-400 text-[#82181A] focus:ring-[#82181A]"
                  />
                  <span className="text-sm font-medium text-neutral-800">Manter conectado</span>
                </label>

                {erro && <p className="text-white bg-red-600 p-2 text-sm text-center border border-red-800 font-medium">{erro}</p>}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#82181A] py-3.5 font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#631214] border-2 border-[#540f11] rounded-none disabled:opacity-50 mt-2"
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
      // Interface sólida, plana, bordas retas
      className="w-full text-left rounded-none bg-[#242424] border border-[#333] border-l-[4px] border-l-[#c9555f] hover:bg-[#2a2a2a] hover:border-l-[#e8757e] transition-none px-3 py-3 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-white leading-tight">{item.nome}</span>
        {item.notaFinal != null && (
          <span className="shrink-0 text-[11px] font-bold bg-[#82181A] text-white px-2 py-0.5 rounded-none tabular-nums border border-[#540f11]">
            {item.notaFinal}
          </span>
        )}
      </div>
      <div className="text-xs text-neutral-400 mt-1.5 truncate">{item.escola}</div>
      {item.cidade && <div className="text-xs text-neutral-500 truncate">{item.cidade}</div>}
      {item.minhaNota != null && (
        <div className="inline-block text-[11px] font-bold text-neutral-300 bg-[#333] border border-[#444] px-2 py-0.5 rounded-none mt-2">
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
    <li className="bg-white rounded-none px-4 py-3 border border-neutral-300">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-900 leading-snug">{criterio.texto}</p>
        <span className="shrink-0 text-xs font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 uppercase tabular-nums">Peso {criterio.peso}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {NIVEIS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => aoMarcar(n.id)}
              title={n.nome}
              aria-pressed={valor === n.id}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-none border cursor-pointer transition-none ${
                valor === n.id
                  ? 'border-[#82181A] bg-[#82181A] text-white'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100'
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
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-none border cursor-pointer transition-none ml-2 ${
              zerado
                ? 'border-amber-700 bg-amber-600 text-white'
                : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:border-amber-600 hover:text-amber-700'
            }`}
          >
            IA = 0
          </button>
        </div>
        <span className="shrink-0 text-sm font-black text-neutral-900 tabular-nums bg-neutral-100 px-2 py-1 border border-neutral-300">
          {notaDe(criterio.id, valor, zerado)} pts
        </span>
      </div>
    </li>
  )
}

function Painel({ equipe, correcao, aoSalvar, aoFechar }) {
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
    <div className="flex flex-col h-full bg-neutral-100">
      <header className="px-5 py-4 border-b-2 border-neutral-300 flex items-start justify-between gap-4 shrink-0 bg-white">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-neutral-900 uppercase truncate">{equipe.nome}</h2>
          <p className="text-sm font-medium text-neutral-600 truncate mt-1">
            {equipe.escola}
            {equipe.cidade ? ` · ${equipe.cidade}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="shrink-0 bg-neutral-200 border border-neutral-300 text-neutral-700 hover:bg-neutral-800 hover:text-white cursor-pointer text-xl font-bold leading-none px-3 py-1 rounded-none transition-none"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
        <div className="text-xs bg-[#fff3cd] border-l-4 border-[#ffc107] text-[#856404] px-4 py-3 rounded-none font-medium">
          Se a equipe usou imagens criadas por IA, os itens sobre essas imagens valem 0 — marque “IA = 0” no critério.
        </div>

        {BLOCOS.map((bloco) => {
          const itens = CRITERIOS_DO_BLOCO(bloco.id)
          const faltamNoBloco = itens.filter((c) => faltando.includes(c.id)).length
          return (
            <section key={bloco.id}>
              <div className="flex items-end justify-between gap-2 border-b-2 border-neutral-300 pb-2 mb-4">
                <h3 className="text-base font-bold text-[#82181A] uppercase tracking-wide">{bloco.rotulo}</h3>
                <span className="text-xs font-bold text-neutral-600 uppercase tabular-nums">
                  {pontosDoBloco(bloco.id)} pts{faltamNoBloco > 0 && ` · ${faltamNoBloco} restam`}
                </span>
              </div>
              <ul className="space-y-4">
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

      <footer className="px-5 py-4 border-t-2 border-neutral-300 shrink-0 flex items-center justify-between gap-4 bg-white">
        <div>
          <div className="text-2xl font-black text-[#82181A] tabular-nums">
            {nota} <span className="text-sm font-bold text-neutral-400">/ {PESO_TOTAL}</span>
          </div>
          <div className="text-xs font-medium text-neutral-500 uppercase mt-1">
            {faltando.length > 0 ? `${faltando.length} critérios pendentes` : 'Todos respondidos'}
            {situacao && ` · ${situacao}`}
          </div>
        </div>
        <button
          type="button"
          disabled={faltando.length > 0}
          onClick={() => aoSalvar({ criterios, zerados: [...zerados], nota, enviar: true })}
          className="shrink-0 px-6 py-3 bg-[#82181A] text-white font-bold uppercase tracking-wider rounded-none hover:bg-[#631214] border-2 border-[#540f11] transition-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar Correção
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
      } catch (err) {
        if (!vivo) return
        console.error('[correcao] falha ao carregar a fila:', err)
        setErro(explicarErro(err))
        setCarregando(false)
      }
    }
    carregar()
    return () => {
      vivo = false
    }
  }, [aba])

useEffect(() => {
    if (isLocalDevHost()) return
    if (!equipes.length) return
    let vivo = true

    getDocs(
      query(
        collection(db, ...CAMINHOS.colecaoCorrecoes()),
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
      .catch((err) => {
        console.error('[correcao] falha ao carregar as correções desta aba:', err)
      })
    return () => {
      vivo = false
    }
  }, [aba, equipes])

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

  const fecharVeredito = useCallback(
    async (equipe, notasAposEnvio) => {
      const sim = isLocalDevHost()
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

  const salvar = useCallback(
    async (equipe, dados) => {
      const atual = notas[equipe.id] || {}
      const enviados = dados.enviar
        ? Array.from(new Set([...(atual.enviados || []), aba]))
        : atual.enviados || []

      const registro = {
        equipeId: equipe.id,
        enviados,
        notas: { ...(atual.notas || {}), [aba]: dados.nota },
        criterios: dados.criterios,
        zerados: dados.zerados,
        atualizadoEm: new Date().toISOString(),
      }
      if (!isLocalDevHost()) {
        await setDoc(doc(db, ...CAMINHOS.correcoes(equipe.id)), registro, { merge: true })
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
      className={`${poppins.className} min-h-screen bg-cover bg-center bg-fixed text-white`}
      style={{ backgroundImage: `url(${FUNDO_SRC})` }}
    >
      {/* Camada escurecedora sólida, sem blur */}
      <div className="min-h-screen flex flex-col bg-neutral-900/90">
        <div className="flex-1 flex flex-col max-w-[1680px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
          {/* ---- Painel principal Clássico/Quadrado ---- */}
          <div className="flex-1 min-h-0 flex flex-col rounded-none bg-[#111] border border-[#333] shadow-none overflow-hidden">
            {/* Logo + conta */}
            <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 bg-[#1a1a1a] border-b border-[#333]">
              <Image
                src="/logo-page-correcao.svg"
                alt="Correção — Fase 4"
                width={300}
                height={94}
                priority
                className="h-auto w-[180px] sm:w-[260px] shrink-0"
              />
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0 text-right">
                  <p className="text-sm font-bold uppercase tracking-wide truncate text-white">{sessao?.nome}</p>
                  <p className="text-xs text-neutral-400 truncate">{sessao?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (sim) return
                    localStorage.removeItem(CHAVE_SESSAO)
                    await signOut(auth)
                  }}
                  className="shrink-0 px-4 py-2 text-xs font-bold uppercase rounded-none bg-[#242424] hover:bg-[#333] border border-[#444] text-white transition-none cursor-pointer"
                >
                  {sim ? 'Simulação' : 'Sair'}
                </button>
              </div>
            </div>

            {sim && (
              <div className="mx-5 sm:mx-7 mt-5 bg-[#332a00] border-l-4 border-[#ffc107] text-[#ffc107] text-sm px-4 py-3 rounded-none flex items-center justify-between gap-4">
                <span>
                  <strong>SIMULAÇÃO LOCAL.</strong> Dados fictícios, sem Firebase. Nada disso vai para o banco.
                </span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold uppercase rounded-none bg-[#ffc107] text-black hover:bg-[#e0a800] transition-none cursor-pointer"
                >
                  Recarregar
                </button>
              </div>
            )}

            {semNome && (
              <div className="mx-5 sm:mx-7 mt-5 bg-[#401313] border-l-4 border-red-500 text-red-200 text-sm px-4 py-3 rounded-none">
                <strong>Não encontramos seu nome na comissão.</strong> Este acesso foi criado com “{sessao?.nome}”, que
                não corresponde a nenhum dos 7 corretores. Fale com o admin para ajustar o cadastro.
              </div>
            )}

            {!semNome && (
              <>
                {/* Abas dos professores */}
                <nav className="px-5 sm:px-7 pt-5 flex overflow-x-auto border-b border-[#333] bg-[#141414]">
                  {CORRETORES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setAbaAtiva(c.id)
                        setAberta(null)
                        setAviso('')
                      }}
                      className={`px-5 py-3 text-xs font-bold uppercase whitespace-nowrap cursor-pointer rounded-none border-t-2 border-l border-r transition-none -mb-[1px] ${
                        aba === c.id
                          ? 'bg-[#111] border-t-[#82181A] border-l-[#333] border-r-[#333] border-b-transparent text-white'
                          : 'bg-[#1a1a1a] border-transparent border-b-[#333] text-neutral-500 hover:text-neutral-300 hover:bg-[#222]'
                      }`}
                    >
                      {c.nome}
                      {corretor?.id === c.id && (
                        <span className="ml-2 text-[9px] bg-[#333] text-neutral-300 px-1.5 py-0.5 rounded-none border border-[#444]">VOCÊ</span>
                      )}
                    </button>
                  ))}
                  {/* Preenchimento do resto da borda */}
                  <div className="flex-1 border-b border-[#333]"></div>
                </nav>

                {erro && (
                  <div className="mx-5 sm:mx-7 mt-5 bg-[#401313] border-l-4 border-red-500 text-red-200 text-sm px-4 py-3 rounded-none">
                    {erro}
                  </div>
                )}
                {aviso && (
                  <div className="mx-5 sm:mx-7 mt-5 bg-[#00273f] border-l-4 border-[#007bff] text-sky-200 text-sm px-4 py-3 rounded-none">
                    {aviso}
                  </div>
                )}

                {!distribuicao && !carregando ? (
                  <p className="m-5 sm:m-7 bg-[#242424] border border-[#333] text-neutral-400 text-sm px-4 py-3 rounded-none font-medium">
                    A distribuição ainda não foi gerada. Peça ao admin.
                  </p>
                ) : carregando ? (
                  <p className="m-5 sm:m-7 bg-[#242424] border border-[#333] text-neutral-400 text-sm px-4 py-3 rounded-none font-medium">
                    Carregando a fila…
                  </p>
                ) : (
                  <div className="flex-1 min-h-0 flex gap-4 p-5 sm:p-7 overflow-x-auto bg-[#111]">
                    {COLUNAS.map((col) => {
                      const lista = porColuna(col.id)
                      return (
                        <section
                          key={col.id}
                          className="shrink-0 w-[270px] flex flex-col rounded-none bg-[#1a1a1a] border border-[#333] overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between gap-2 bg-[#141414]">
                            <h2 className="text-[13px] font-bold uppercase text-neutral-200 tracking-wide">{col.titulo}</h2>
                            <span className="text-[11px] font-bold text-white bg-[#333] border border-[#444] px-2 py-0.5 rounded-none tabular-nums">
                              {lista.length}
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                            {lista.map((e) => (
                              <Card
                                key={e.id}
                                item={{ ...e, minhaNota: notas[e.id]?.notas?.[aba] }}
                                aoAbrir={setAberta}
                              />
                            ))}
                            {!lista.length && (
                              <p className="text-xs font-bold uppercase text-neutral-600 text-center py-8">
                                {col.id === 'corrigidas' ? 'Nenhuma corrigida' : 'Fila Vazia'}
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
          </div>
        </div>
      </div>

      {aberta && (
        <div className="fixed inset-0 z-50 bg-[#000000cc] flex">
          <div className="w-1/2 min-w-0 border-r border-neutral-300 bg-white">
            <div className="h-full overflow-y-auto">
              <PortfolioWall
                portfolio={aberta.portfolio}
                temaId={aberta.design}
                nomeEquipe={aberta.nome}
                onClose={() => setAberta(null)}
              />
            </div>
          </div>
          <div className="w-1/2 min-w-0 bg-neutral-100">
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
      <div className={`${poppins.className} min-h-screen flex items-center justify-center bg-[#f5f5f5]`}>
        <p className="text-[#82181A] font-bold text-lg uppercase tracking-wide">Carregando…</p>
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
        <div className={`${poppins.className} min-h-screen flex items-center justify-center bg-[#f5f5f5]`}>
          <p className="text-[#82181A] font-bold text-lg uppercase tracking-wide">Carregando...</p>
        </div>
      }
    >
      <AreaCorrecao />
    </Suspense>
  )
}