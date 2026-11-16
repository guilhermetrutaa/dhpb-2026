'use client'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { temaPorId } from './config'

function urlParaPdf(url) {
  if (!url || !url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto,c_limit,w_1000/')
}

// A4 a 96 dpi. A proporção bate com a página do jsPDF, então cada folha vira uma página inteira.
const A4_W = 794
const A4_H = 1123

function Texto({ valor, className = 'text-justify' }) {
  const t = (valor || '').trim()
  return (
    <p className={`whitespace-pre-line leading-[1.35] ${className}`}>
      {t || <span className="italic opacity-60">Campo não preenchido</span>}
    </p>
  )
}

// Sem object-fit: o html2canvas 1.4 estica a imagem. max-width/max-height mantêm a proporção.
function Foto({ img, alt, alturaEm }) {
  if (!img?.url) return <p className="my-[0.4em] italic opacity-60">Imagem não enviada</p>
  return (
    <img
      src={urlParaPdf(img.url)}
      alt={alt}
      crossOrigin="anonymous"
      style={{ maxHeight: `${alturaEm}em` }}
      className="mx-auto my-[0.4em] block h-auto w-auto max-w-full"
    />
  )
}

function Legenda({ valor }) {
  if (!valor?.trim()) return null
  return <p className="mb-[0.4em] whitespace-pre-line text-[0.85em] font-bold leading-snug">{valor.trim()}</p>
}

function LinkObra({ valor }) {
  if (!valor?.trim()) return null
  return <p className="mb-[0.4em] break-all text-[0.8em] underline">{valor.trim()}</p>
}

function Titulo({ children }) {
  return <h2 className="mb-[0.3em] mt-[0.6em] text-[1.3em] font-black uppercase leading-tight first:mt-0">{children}</h2>
}

function Subtitulo({ valor }) {
  if (!valor?.trim()) return null
  return <p className="mb-[0.3em] text-[1.05em] font-bold italic leading-tight">{valor.trim()}</p>
}

function Folha({ tema, children }) {
  return (
    <div
      data-pdf-pagina
      style={{ width: A4_W, height: A4_H, backgroundColor: tema.bg }}
      className="flex flex-col overflow-hidden px-8 py-7 font-sans text-black"
    >
      {children}
    </div>
  )
}

// Os dois blocos com data-pdf-corpo são os únicos que encolhem a fonte no encaixe.
function Corpo({ esquerda, direita }) {
  return (
    <div data-pdf-corpo className="flex min-h-0 flex-1 gap-6 text-[13px]">
      <div className="min-w-0 flex-[1.1] overflow-hidden">{esquerda}</div>
      <div className="min-w-0 flex-1 overflow-hidden">{direita}</div>
    </div>
  )
}

export function FolhaPdf({ portfolio = {}, temaId, nomeEquipe, folhaRef }) {
  const tema = temaPorId(temaId)
  const p = portfolio
  const titulo = p.titulo?.trim() || 'Título do portfólio'
  const linha = <div className="my-3 h-[2px] w-full shrink-0" style={{ backgroundColor: tema.accent }} />

  return (
    <div ref={folhaRef}>
      <Folha tema={tema}>
        <header className="flex shrink-0 items-center gap-5">
          <img src="/logo.svg" alt="DHPB" className="h-16 w-auto shrink-0" />
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-[26px] font-black uppercase leading-tight">{titulo}</h1>
            <p className="mt-1 text-[17px] font-bold">{p.nomeArtista?.trim() || 'Nome do(a) artista'}</p>
          </div>
        </header>
        {linha}
        <Corpo
          esquerda={
            <>
              <Titulo>O artista e sua trajetória</Titulo>
              <Texto valor={p.trajetoria} />
              <Foto img={p.img1} alt="Imagem do artista" alturaEm={24} />
              <Legenda valor={p.legenda1} />
            </>
          }
          direita={
            <>
              <Foto img={p.capa} alt="Capa" alturaEm={14} />
              <Titulo>O artista através da obra</Titulo>
              <Subtitulo valor={p.tituloObra2} />
              <Texto valor={p.apresentacao} />
              <Foto img={p.img2} alt="Obra representativa" alturaEm={18} />
              <Legenda valor={p.legenda2} />
              <LinkObra valor={p.link2} />
            </>
          }
        />
      </Folha>

      <Folha tema={tema}>
        <header className="flex shrink-0 items-center gap-4">
          <img src="/logo.svg" alt="DHPB" className="h-9 w-auto shrink-0" />
          <p className="min-w-0 flex-1 text-center text-[16px] font-black uppercase leading-tight">{titulo}</p>
        </header>
        {linha}
        <Corpo
          esquerda={
            <>
              <Titulo>Obra sob análise</Titulo>
              <Subtitulo valor={p.tituloObra3} />
              <Texto valor={p.analise} />
              <Foto img={p.img3} alt="Obra sob análise" alturaEm={22} />
              <Legenda valor={p.legenda3} />
              <LinkObra valor={p.link3} />
            </>
          }
          direita={
            <>
              <Titulo>Reflexão histórica</Titulo>
              <Texto valor={p.reflexao} />
              <Titulo>Referências</Titulo>
              <Texto valor={p.referencias} className="text-left text-[0.9em] font-bold" />
              <Foto img={p.imgEquipe} alt="Foto da equipe" alturaEm={14} />
              <p className="text-center font-bold">{nomeEquipe || 'Equipe'}</p>
              <Texto valor={p.creditos} className="text-center text-[0.9em]" />
            </>
          }
        />
        <footer className="mt-3 flex w-full shrink-0 items-end justify-between gap-2 border-t border-black/15 pt-3">
          <img src="/logo.svg" alt="DHPB" className="h-12 w-auto shrink-0" />
          <div className="shrink-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em]">Realização</span>
            <img src="/ifpb-logo-semfundo.png" alt="IFPB" className="h-9 w-auto" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em]">Apoio</span>
            <div className="flex w-full items-center justify-between gap-2">
              <img src="/logo-nuhcl.svg" alt="NUHCL" className="h-9 w-auto" />
              <img src="/logo-ndh.svg" alt="NDH" className="h-9 w-auto" />
              <img src="/comite-logo.svg" alt="Comitê Olímpico" className="h-9 w-auto" />
              <img src="/kodeo-logo.svg" alt="Kodeo" className="h-7 w-auto" />
            </div>
          </div>
        </footer>
      </Folha>
    </div>
  )
}

function semCorModerna(css, nome) {
  const token = `${nome}(`
  let out = ''
  let i = 0
  while (i < css.length) {
    const j = css.indexOf(token, i)
    if (j < 0) {
      out += css.slice(i)
      break
    }
    out += css.slice(i, j) + '#222222'
    let k = j + token.length
    let depth = 1
    while (k < css.length && depth > 0) {
      if (css[k] === '(') depth += 1
      else if (css[k] === ')') depth -= 1
      k += 1
    }
    i = k
  }
  return out
}

function cssLegivel(css) {
  let texto = css || ''
  for (const nome of ['oklch', 'oklab', 'lch', 'lab', 'color-mix']) texto = semCorModerna(texto, nome)
  return texto
}

// html2canvas 1.4 não lê lab()/oklch() do Tailwind 4. A troca fica na cópia.
async function coresCompativeis(doc) {
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')]
  await Promise.all(links.map(async (link) => {
    try {
      const css = await fetch(link.href).then((r) => r.text())
      const style = doc.createElement('style')
      style.textContent = cssLegivel(css)
      link.replaceWith(style)
    } catch {
      link.remove()
    }
  }))
  doc.querySelectorAll('style').forEach((el) => {
    el.textContent = cssLegivel(el.textContent)
  })
}

const transborda = (corpo) => [...corpo.children].some((col) => col.scrollHeight > col.clientHeight + 1)

// ponytail: encolhe a fonte (e as fotos, que medem em em) de 0,5 em 0,5 px até as colunas caberem.
// Com todos os campos no limite cai perto de 8 px; abaixo de FONTE_MIN aplica zoom no miolo.
// Upgrade: quebrar o texto mais longo em colunas ou mover a foto da equipe para a frente.
export const FONTE_MAX = 13
export const FONTE_MIN = 6
export const ZOOM_MIN = 0.7

export function resolverEncaixe(aindaTransborda, { fonteMax = FONTE_MAX, fonteMin = FONTE_MIN, zoomMin = ZOOM_MIN } = {}) {
  let fonte = fonteMax
  let zoom = 1
  while (fonte > fonteMin && aindaTransborda({ fonte, zoom })) fonte -= 0.5
  while (zoom > zoomMin && aindaTransborda({ fonte, zoom })) {
    zoom = Math.round((zoom - 0.05) * 100) / 100
  }
  return { fonte, zoom }
}

function encaixarCorpo(corpo) {
  // Mesma escada do resolverEncaixe, mas cada passo precisa pintar o DOM antes de medir.
  let fonte = FONTE_MAX
  let zoom = 1
  corpo.style.fontSize = `${fonte}px`
  corpo.style.zoom = '1'
  while (fonte > FONTE_MIN && transborda(corpo)) {
    fonte -= 0.5
    corpo.style.fontSize = `${fonte}px`
  }
  while (zoom > ZOOM_MIN && transborda(corpo)) {
    zoom = Math.round((zoom - 0.05) * 100) / 100
    corpo.style.zoom = String(zoom)
  }
  return { fonte, zoom }
}

export async function gerarPortfolioPdfBlob(elemento) {
  elemento.querySelectorAll('[data-pdf-corpo]').forEach(encaixarCorpo)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [A4_W, A4_H] })
  const largura = pdf.internal.pageSize.getWidth()
  const altura = pdf.internal.pageSize.getHeight()
  const folhas = [...elemento.querySelectorAll('[data-pdf-pagina]')]
  for (const [i, folha] of folhas.entries()) {
    const canvas = await html2canvas(folha, {
      scale: 2,
      useCORS: true,
      width: A4_W,
      height: A4_H,
      windowWidth: A4_W,
      windowHeight: A4_H,
      onclone: coresCompativeis,
    })
    if (i > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, largura, altura)
  }
  return pdf.output('blob')
}

export async function baixarPortfolioPdf(elemento, nomeArquivo) {
  const blob = await gerarPortfolioPdfBlob(elemento)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

if (process.env.NODE_ENV !== 'production') {
  const cheio = resolverEncaixe(() => true)
  if (cheio.fonte !== FONTE_MIN || cheio.zoom !== ZOOM_MIN) {
    throw new Error(`encaixe cheio: esperado ${FONTE_MIN}/${ZOOM_MIN}, veio ${cheio.fonte}/${cheio.zoom}`)
  }
  const vazio = resolverEncaixe(() => false)
  if (vazio.fonte !== FONTE_MAX || vazio.zoom !== 1) {
    throw new Error(`encaixe vazio: esperado ${FONTE_MAX}/1, veio ${vazio.fonte}/${vazio.zoom}`)
  }
  const meio = resolverEncaixe(({ fonte }) => fonte > 9)
  if (meio.fonte !== 9 || meio.zoom !== 1) {
    throw new Error(`encaixe meio: esperado 9/1, veio ${meio.fonte}/${meio.zoom}`)
  }
  if (Math.abs(A4_W / A4_H - 210 / 297) > 0.01) {
    throw new Error('A4_W/A4_H tem de bater com a proporção 210/297.')
  }
}
