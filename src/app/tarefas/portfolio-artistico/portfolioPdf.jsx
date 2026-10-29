'use client'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { temaPorId } from './config'

function urlParaPdf(url) {
  if (!url || !url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto,c_limit,w_1000/')
}

function Texto({ valor }) {
  const t = (valor || '').trim()
  return <p className="whitespace-pre-line text-[15px] leading-relaxed">{t || 'Campo não preenchido'}</p>
}

function Foto({ img, alt }) {
  if (!img?.url) return <p className="text-[15px] italic text-neutral-600">Imagem não enviada</p>
  return (
    <img
      src={urlParaPdf(img.url)}
      alt={alt}
      crossOrigin="anonymous"
      className="max-h-[420px] w-full object-contain"
    />
  )
}

export function FolhaPdf({ portfolio = {}, temaId, nomeEquipe, folhaRef }) {
  const tema = temaPorId(temaId)
  const p = portfolio
  return (
    <div
      ref={folhaRef}
      style={{ backgroundColor: tema.bg }}
      className="w-[800px] px-10 py-10 text-black"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em]">DHPB · Portfólio artístico</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight">{p.titulo?.trim() || 'Título do portfólio'}</h1>
      <p className="mt-2 text-sm">{nomeEquipe || 'Equipe'} · Design {tema.nome}</p>
      <div className="mt-6">
        <Foto img={p.capa} alt="Capa" />
      </div>

      <section className="mt-8">
        <h2 className="border-b border-black/20 pb-1 text-2xl font-bold">{p.nomeArtista?.trim() || 'O artista'}</h2>
        <div className="mt-4"><Foto img={p.img1} alt="Imagem do artista" /></div>
        <Texto valor={p.legenda1} />
        <div className="mt-4"><Texto valor={p.trajetoria} /></div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-black/20 pb-1 text-2xl font-bold">{p.tituloObra2?.trim() || 'O artista através da obra'}</h2>
        <div className="mt-4"><Foto img={p.img2} alt="Obra representativa" /></div>
        <Texto valor={p.legenda2} />
        {p.link2?.trim() && <p className="mt-2 break-all text-sm">{p.link2.trim()}</p>}
        <div className="mt-4"><Texto valor={p.apresentacao} /></div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-black/20 pb-1 text-2xl font-bold">{p.tituloObra3?.trim() || 'Obra sob análise'}</h2>
        <div className="mt-4"><Foto img={p.img3} alt="Obra sob análise" /></div>
        <Texto valor={p.legenda3} />
        {p.link3?.trim() && <p className="mt-2 break-all text-sm">{p.link3.trim()}</p>}
        <div className="mt-4"><Texto valor={p.analise} /></div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-black/20 pb-1 text-2xl font-bold">Reflexão histórica</h2>
        <div className="mt-4"><Texto valor={p.reflexao} /></div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-black/20 pb-1 text-2xl font-bold">{nomeEquipe || 'A equipe'}</h2>
        <div className="mt-4"><Foto img={p.imgEquipe} alt="Foto da equipe" /></div>
        <div className="mt-4"><Texto valor={p.creditos} /></div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-black/20 pb-1 text-2xl font-bold">Referências</h2>
        <div className="mt-4"><Texto valor={p.referencias} /></div>
      </section>
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

export async function baixarPortfolioPdf(elemento, nomeArquivo) {
  const canvas = await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: 800,
    onclone: coresCompativeis,
  })
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const img = canvas.toDataURL('image/jpeg', 0.92)
  let alturaRestante = imgHeight
  let y = 0
  pdf.addImage(img, 'JPEG', 0, y, imgWidth, imgHeight)
  alturaRestante -= pageHeight
  while (alturaRestante > 0) {
    y = alturaRestante - imgHeight
    pdf.addPage()
    pdf.addImage(img, 'JPEG', 0, y, imgWidth, imgHeight)
    alturaRestante -= pageHeight
  }
  pdf.save(nomeArquivo)
}
