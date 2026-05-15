'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, addDoc, deleteDoc, doc, updateDoc, getDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function RichTextEditor({ value, onChange, placeholder, minH = '120px' }) {
  const txtRef = useRef(null)

  const wrap = (antes, depois = '') => {
    const el = txtRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.substring(start, end) || 'texto'
    const novo = value.substring(0, start) + antes + selected + depois + value.substring(end)
    onChange?.(novo)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + antes.length, start + antes.length + selected.length)
    }, 0)
  }

  return (
    <div className='border border-neutral-300 rounded-lg overflow-hidden'>
      <div className='flex flex-wrap gap-1 p-2 bg-neutral-50 border-b border-neutral-200'>
        <button type="button" onClick={() => wrap('<b>', '</b>')} className='px-2 py-1 text-sm font-bold rounded hover:bg-neutral-200 cursor-pointer'>B</button>
        <button type="button" onClick={() => wrap('<i>', '</i>')} className='px-2 py-1 text-sm italic rounded hover:bg-neutral-200 cursor-pointer'>I</button>
        <button type="button" onClick={() => wrap('<u>', '</u>')} className='px-2 py-1 text-sm underline rounded hover:bg-neutral-200 cursor-pointer'>U</button>
        <span className='w-px bg-neutral-300 mx-1' />
        <button type="button" onClick={() => wrap('<h2>', '</h2>')} className='px-2 py-1 text-sm font-bold rounded hover:bg-neutral-200 cursor-pointer'>H2</button>
        <button type="button" onClick={() => wrap('<h3>', '</h3>')} className='px-2 py-1 text-sm font-bold rounded hover:bg-neutral-200 cursor-pointer'>H3</button>
        <span className='w-px bg-neutral-300 mx-1' />
        <button type="button" onClick={() => wrap('<p>', '</p>')} className='px-2 py-1 text-sm rounded hover:bg-neutral-200 cursor-pointer'>¶</button>
        <button type="button" onClick={() => { const url = prompt('URL:'); if (url) wrap(`<a href="${url}" target="_blank">`, '</a>') }} className='px-2 py-1 text-sm rounded hover:bg-neutral-200 cursor-pointer'>🔗</button>
      </div>
      <textarea
        ref={txtRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || 'Digite aqui...'}
        className='w-full p-4 text-sm outline-none resize-y font-sans'
        style={{ minHeight: minH }}
      />
    </div>
  )
}

function BlocoEditor({ blocos, setBlocos }) {
  const addBloco = () => {
    const novo = {
      id: Date.now(),
      titulo: '', subtitulo: '', blocos: [],
      origem: '', creditos: '', disponivelEm: '',
      glossario: [], palavrasChave: [],
    }
    setBlocos([...blocos, novo])
  }

  const upd = (i, campo, val) => {
    const b = [...blocos]; b[i][campo] = val; setBlocos(b)
  }

  const rem = (i) => setBlocos(blocos.filter((_, idx) => idx !== i))
  const mover = (i, dir) => {
    const nova = [...blocos]; const dest = i + dir
    if (dest < 0 || dest >= nova.length) return
    ;[nova[i], nova[dest]] = [nova[dest], nova[i]]
    setBlocos(nova)
  }

  const addGlossario = (i) => {
    const b = [...blocos]; b[i].glossario = [...(b[i].glossario || []), { termo: '', definicao: '' }]; setBlocos(b)
  }
  const updGlossario = (i, j, campo, val) => {
    const b = [...blocos]; b[i].glossario[j][campo] = val; setBlocos(b)
  }
  const remGlossario = (i, j) => {
    const b = [...blocos]; b[i].glossario = b[i].glossario.filter((_, idx) => idx !== j); setBlocos(b)
  }

  const addKW = (i) => {
    const b = [...blocos]; b[i].palavrasChave = [...(b[i].palavrasChave || []), '']; setBlocos(b)
  }
  const updKW = (i, j, val) => {
    const b = [...blocos]; b[i].palavrasChave[j] = val; setBlocos(b)
  }
  const remKW = (i, j) => {
    const b = [...blocos]; b[i].palavrasChave = b[i].palavrasChave.filter((_, idx) => idx !== j); setBlocos(b)
  }

  const addBlocoInterno = (i, tipo) => {
    const b = [...blocos]; b[i].blocos = [...(b[i].blocos || []), { tipo, conteudo: '', id: Date.now() }]; setBlocos(b)
  }
  const updBlocoInterno = (i, j, val) => {
    const b = [...blocos]; b[i].blocos[j].conteudo = val; setBlocos(b)
  }
  const remBlocoInterno = (i, j) => {
    const b = [...blocos]; b[i].blocos = b[i].blocos.filter((_, idx) => idx !== j); setBlocos(b)
  }
  const moverBlocoInterno = (i, j, dir) => {
    const b = [...blocos]; const dest = j + dir
    if (dest < 0 || dest >= (b[i].blocos || []).length) return
    ;[b[i].blocos[j], b[i].blocos[dest]] = [b[i].blocos[dest], b[i].blocos[j]]
    setBlocos(b)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-neutral-700'>Documentos da Questão</p>
        <div className='flex flex-wrap gap-1'>
          <button type="button" onClick={() => addBloco()}
            className='text-xs bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded font-medium cursor-pointer transition-colors'>
            + Documento
          </button>
        </div>
      </div>

      {blocos.length === 0 && (
        <p className='text-xs text-neutral-400 italic'>Nenhum documento. Clique em + para adicionar.</p>
      )}

      <div className='space-y-3'>
        {blocos.map((b, i) => (
          <div key={b.id || i} className='border border-neutral-200 rounded-xl bg-white overflow-hidden'>
            <div className='flex items-center justify-between bg-neutral-50 px-4 py-2 border-b border-neutral-200'>
              <span className='text-xs font-semibold uppercase text-neutral-500'>Documento {i + 1} — {b.tipo}</span>
              <div className='flex gap-1'>
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className='text-xs px-2 py-1 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↑</button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === blocos.length - 1} className='text-xs px-2 py-1 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↓</button>
                <button type="button" onClick={() => rem(i)} className='text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 cursor-pointer'>×</button>
              </div>
            </div>
            <div className='p-4 space-y-3'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <input type="text" placeholder="Título do documento" value={b.titulo} onChange={(e) => upd(i, 'titulo', e.target.value)}
                  className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
                <input type="text" placeholder="Subtítulo / Tipo (ex: Fotografia, Romance)" value={b.subtitulo} onChange={(e) => upd(i, 'subtitulo', e.target.value)}
                  className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
              </div>

              <div className='border border-dashed border-neutral-300 rounded-xl p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-semibold text-neutral-500 uppercase'>Conteúdo do Documento</p>
                  <div className='flex gap-1'>
                    {[['texto', 'Texto'], ['imagem', 'Imagem'], ['video', 'Vídeo'], ['pdf', 'PDF'], ['musica', 'Música']].map(([t, n]) => (
                      <button key={t} type="button" onClick={() => addBlocoInterno(i, t)}
                        className='text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded cursor-pointer transition-colors'>
                        + {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  {(b.blocos || []).length === 0 && (
                    <p className='text-xs text-neutral-400 italic'>Nenhum bloco. Clique em + para adicionar conteúdo.</p>
                  )}
                  {(b.blocos || []).map((bloco, j) => (
                    <div key={bloco.id || j} className='border border-neutral-200 rounded-lg p-3 bg-neutral-50'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-[10px] font-semibold uppercase text-neutral-400'>{bloco.tipo}</span>
                        <div className='flex gap-1'>
                          <button type="button" onClick={() => moverBlocoInterno(i, j, -1)} disabled={j === 0} className='text-xs px-1.5 py-0.5 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↑</button>
                          <button type="button" onClick={() => moverBlocoInterno(i, j, 1)} disabled={j === (b.blocos || []).length - 1} className='text-xs px-1.5 py-0.5 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↓</button>
                          <button type="button" onClick={() => remBlocoInterno(i, j)} className='text-xs px-1.5 py-0.5 rounded text-red-600 hover:bg-red-50 cursor-pointer'>×</button>
                        </div>
                      </div>
                      {bloco.tipo === 'texto' && (
                        <RichTextEditor value={bloco.conteudo} onChange={(v) => updBlocoInterno(i, j, v)} placeholder="Digite o texto..." minH="100px" />
                      )}
                      {['imagem', 'video', 'pdf', 'musica'].includes(bloco.tipo) && (
                        <div className='space-y-2'>
                          <input type="text" placeholder={
                            bloco.tipo === 'imagem' ? 'URL da imagem' :
                            bloco.tipo === 'video' ? 'URL do YouTube' :
                            bloco.tipo === 'pdf' ? 'URL do PDF' : 'URL da música'
                          } value={bloco.conteudo} onChange={(e) => updBlocoInterno(i, j, e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]" />
                          {bloco.conteudo && bloco.tipo === 'imagem' && (
                            <img src={bloco.conteudo} alt="" className='max-h-32 rounded object-contain bg-white' onError={(e) => e.target.style.display = 'none'} />
                          )}
                          {bloco.conteudo && bloco.tipo === 'video' && (
                            <div className='aspect-video rounded overflow-hidden bg-black max-h-32'>
                              <iframe src={bloco.conteudo.replace('watch?v=', 'embed/')} className='w-full h-full' allowFullScreen />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className='border-t border-neutral-200 pt-3 space-y-3'>
                <p className='text-xs font-semibold text-neutral-500 uppercase'>Metadados do Documento</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <input type="text" placeholder="Origem" value={b.origem} onChange={(e) => upd(i, 'origem', e.target.value)}
                    className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
                  <input type="text" placeholder="Créditos" value={b.creditos} onChange={(e) => upd(i, 'creditos', e.target.value)}
                    className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
                </div>
                <input type="text" placeholder="Disponível em (URL)" value={b.disponivelEm} onChange={(e) => upd(i, 'disponivelEm', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />

                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs text-neutral-500'>Glossário</p>
                    <button type="button" onClick={() => addGlossario(i)} className='text-xs text-[#82181A] font-semibold hover:underline cursor-pointer'>+ termo</button>
                  </div>
                  {(b.glossario || []).map((g, j) => (
                    <div key={j} className='flex items-center gap-2 mb-1'>
                      <input type="text" placeholder="Termo" value={g.termo} onChange={(e) => updGlossario(i, j, 'termo', e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]" />
                      <input type="text" placeholder="Definição" value={g.definicao} onChange={(e) => updGlossario(i, j, 'definicao', e.target.value)}
                        className="flex-[2] rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]" />
                      <button type="button" onClick={() => remGlossario(i, j)} className='text-xs text-red-600 cursor-pointer'>×</button>
                    </div>
                  ))}
                </div>

                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs text-neutral-500'>Palavras-chave</p>
                    <button type="button" onClick={() => addKW(i)} className='text-xs text-[#82181A] font-semibold hover:underline cursor-pointer'>+ palavra</button>
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {(b.palavrasChave || []).map((kw, j) => (
                      <div key={j} className='flex items-center gap-1 bg-[#82181A]/10 rounded-full px-3 py-1'>
                        <input type="text" value={kw} onChange={(e) => updKW(i, j, e.target.value)}
                          className='w-20 bg-transparent text-xs outline-none text-[#82181A]' />
                        <button type="button" onClick={() => remKW(i, j)} className='text-xs text-red-600 cursor-pointer'>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestoesForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const faseId = searchParams.get('faseId')
  const edicaoId = searchParams.get('edicaoId')

  const [fase, setFase] = useState(null)
  const [questoes, setQuestoes] = useState([])
  const [edicaoNome, setEdicaoNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)

  const [numero, setNumero] = useState('')
  const [instrucao, setInstrucao] = useState('')
  const [comentario, setComentario] = useState('')
  const [alternativas, setAlternativas] = useState([
    { letra: 'A', texto: '', peso: 0 },
    { letra: 'B', texto: '', peso: 0 },
    { letra: 'C', texto: '', peso: 0 },
    { letra: 'D', texto: '', peso: 0 },
  ])
  const [documentos, setDocumentos] = useState([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [tarefaTitulo, setTarefaTitulo] = useState('')
  const [tarefaUrl, setTarefaUrl] = useState('')

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else setAutenticado(true)
  }, [router])

  useEffect(() => {
    if (!autenticado || !faseId) return
    const carregar = async () => {
      const fSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
      if (fSnap.exists()) {
        setFase({ id: fSnap.id, ...fSnap.data() })
        setTarefaTitulo(fSnap.data().tarefa?.titulo || '')
        setTarefaUrl(fSnap.data().tarefaUrl || '')
      }
      if (edicaoId) {
        const eSnap = await getDoc(doc(db, 'edicoes', edicaoId))
        if (eSnap.exists()) setEdicaoNome(eSnap.data().nome || '')
      }
      setCarregando(false)
    }
    carregar()
  }, [autenticado, faseId, edicaoId])

  useEffect(() => {
    if (!faseId) return
    const q = query(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), orderBy('numero', 'asc'))
    const unsub = onSnapshot(q, (snap) => setQuestoes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [faseId, edicaoId])

  const handleSalvarTarefa = async () => {
    try {
      await updateDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId), {
        tarefa: { titulo: tarefaTitulo },
        tarefaUrl,
      })
    } catch {}
  }

  const handleCriarQuestao = async (e) => {
    e.preventDefault()
    setErro('')
    if (!numero || !instrucao.trim()) { setErro('Número e instrução são obrigatórios.'); return }
    if (alternativas.some((a) => !a.texto.trim())) { setErro('Todas as alternativas devem ter texto.'); return }
    setSalvando(true)
    try {
      await addDoc(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), {
        numero: parseInt(numero),
        instrucao: instrucao.trim(),
        comentario: comentario.trim(),
        alternativas,
        documentos,
        createdAt: new Date().toISOString(),
      })
      setNumero(''); setInstrucao(''); setComentario('')
      setAlternativas([{ letra: 'A', texto: '', peso: 0 }, { letra: 'B', texto: '', peso: 0 }, { letra: 'C', texto: '', peso: 0 }, { letra: 'D', texto: '', peso: 0 }])
      setDocumentos([])
    } catch { setErro('Erro ao salvar questão.') }
    finally { setSalvando(false) }
  }

  const handleDeletarQuestao = async (qId) => {
    try { await deleteDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', qId)) } catch {}
  }

  if (!autenticado || carregando) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#f5f5f5] text-[#000]'>
        <header className='flex items-center justify-between px-6 py-4 bg-white shadow-sm'>
          <div className='flex items-center gap-4'>
            <Image src="/logo.svg" width={60} height={60} alt="Logo" />
            <div>
              <p className='text-sm text-neutral-500'>{edicaoNome}</p>
              <h1 className='text-lg font-bold text-[#82181A]'>Questões — {fase?.nome || ''}</h1>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className='border border-[#82181A] text-[#82181A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-colors cursor-pointer'>Voltar</button>
        </header>

        <main className='max-w-5xl mx-auto px-4 py-8 space-y-8'>
          <div className='bg-white rounded-xl shadow-md p-6'>
            <h2 className='text-lg font-bold text-[#82181A] mb-4'>Tarefa da Fase</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <input type="text" placeholder="Título da tarefa (ex: Questionário)" value={tarefaTitulo} onChange={(e) => setTarefaTitulo(e.target.value)}
                className="rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
              <input type="text" placeholder="URL da página da tarefa (ex: /tarefa/fase1)" value={tarefaUrl} onChange={(e) => setTarefaUrl(e.target.value)}
                className="md:col-span-2 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
            </div>
            <button onClick={handleSalvarTarefa} className="bg-[#82181A] text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-[#631214] transition-colors cursor-pointer">Salvar Tarefa</button>
          </div>

          <div className='bg-white rounded-xl shadow-md p-6'>
            <h2 className='text-lg font-bold text-[#82181A] mb-4'>Nova Questão</h2>
            <form onSubmit={handleCriarQuestao} className='space-y-4'>
              <input type="number" min="1" max="10" placeholder="Número (1-10)" value={numero} onChange={(e) => setNumero(e.target.value)} required
                className="w-full md:w-48 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />

              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>Instrução da Questão</p>
                <RichTextEditor value={instrucao} onChange={setInstrucao} placeholder="Digite a instrução da questão..." />
              </div>

              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>Comentário (liberado após finalizar)</p>
                <RichTextEditor value={comentario} onChange={setComentario} placeholder="Comentário sobre a questão..." />
              </div>

              <div>
                <p className='text-sm font-medium text-neutral-700 mb-2'>Alternativas</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {alternativas.map((alt, i) => (
                    <div key={alt.letra} className='flex items-center gap-2'>
                      <span className='font-bold text-sm w-5 text-[#82181A]'>{alt.letra}</span>
                      <input type="text" placeholder={`Texto ${alt.letra}`} value={alt.texto} onChange={(e) => {
                        const a = [...alternativas]; a[i].texto = e.target.value; setAlternativas(a)
                      }} required className="flex-1 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
                      <input type="number" step="0.1" placeholder="Peso" value={alt.peso} onChange={(e) => {
                        const a = [...alternativas]; a[i].peso = parseFloat(e.target.value) || 0; setAlternativas(a)
                      }} required className="w-20 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
                    </div>
                  ))}
                </div>
              </div>

              <BlocoEditor blocos={documentos} setBlocos={setDocumentos} />

              {erro && <p className="text-red-600 text-sm">{erro}</p>}
              <button type="submit" disabled={salvando} className="bg-[#82181A] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#631214] disabled:opacity-50 cursor-pointer">
                {salvando ? 'Salvando...' : 'Criar Questão'}
              </button>
            </form>
          </div>

          <div className='bg-white rounded-xl shadow-md p-6'>
            <h2 className='text-lg font-bold text-[#82181A] mb-4'>Questões ({questoes.length}/10)</h2>
            {questoes.length === 0 ? (
              <p className='text-neutral-500 text-sm'>Nenhuma questão cadastrada.</p>
            ) : (
              <div className='space-y-2'>
                {questoes.map((q) => (
                  <div key={q.id} className='border border-neutral-200 rounded-lg p-4 flex items-center justify-between'>
                    <div>
                      <p className='font-semibold text-sm'>Questão {q.numero}</p>
                      <p className='text-xs text-neutral-500 line-clamp-1'>{q.instrucao?.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
                    </div>
                    <button onClick={() => handleDeletarQuestao(q.id)} className='text-red-600 text-xs font-semibold hover:underline cursor-pointer'>Excluir</button>
                  </div>
                ))}
              </div>
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
      <QuestoesForm />
    </Suspense>
  )
}
