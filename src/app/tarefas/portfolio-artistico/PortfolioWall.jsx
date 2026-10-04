'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Abril_Fatface,
  Archivo_Narrow,
  Lora,
  Merriweather,
  Montserrat,
  Playfair_Display,
  Source_Sans_3,
} from 'next/font/google'
import { optimizeCloudinaryUrl } from '@/lib/cloudinary'
import { ABAS, embedUrl, linkValido, temaPorId } from './config'

const lora = Lora({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], preload: false })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '900'], style: ['normal', 'italic'], preload: false })
const abril = Abril_Fatface({ subsets: ['latin'], weight: '400', preload: false })
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], preload: false })
const montserrat = Montserrat({ subsets: ['latin'], preload: false })
const sourceSans = Source_Sans_3({ subsets: ['latin'], preload: false })
const archivo = Archivo_Narrow({ subsets: ['latin'], weight: ['400', '700'], preload: false })

const FONTES = { lora, playfair, abril, merriweather, montserrat, sourceSans }
const ff = (key) => ({ fontFamily: FONTES[key].style.fontFamily })
const legendaStyle = { fontFamily: archivo.style.fontFamily }

function Vazio({ children = 'Campo não preenchido' }) {
  return <span className="italic opacity-50">{children}</span>
}

function Texto({ valor, style, className = 'text-justify text-[15px]' }) {
  return (
    <div style={style} className={`whitespace-pre-line leading-relaxed ${className}`}>
      {valor?.trim() ? valor : <Vazio />}
    </div>
  )
}

function Obra({ img, legenda, link, onZoom, reduzir, largura = 820 }) {
  const embed = embedUrl(link)
  return (
    <motion.figure
      initial={reduzir ? false : { opacity: 0, y: -24, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={reduzir ? { duration: 0 } : { type: 'spring', stiffness: 110, damping: 7, delay: 0.15 }}
      style={{ transformOrigin: 'top center' }}
      className="w-full"
    >
      {img?.url ? (
        <button
          type="button"
          onClick={() => onZoom(img.url)}
          className="group block w-full cursor-zoom-in overflow-hidden shadow-[0_18px_30px_-12px_rgba(0,0,0,0.45)]"
          aria-label="Ampliar imagem"
        >
          <img
            src={optimizeCloudinaryUrl(img.url, { width: largura })}
            alt={legenda || 'Obra'}
            className="block w-full transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </button>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center border-2 border-dashed border-black/25 text-sm">
          <Vazio>Imagem não enviada</Vazio>
        </div>
      )}
      {embed && (
        <iframe
          src={embed}
          title="Obra em vídeo ou áudio"
          className={`mt-3 w-full border-0 ${embed.includes('spotify') ? 'h-[152px]' : 'aspect-video'}`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      )}
      {!embed && linkValido(link) && (
        <a
          href={link.trim()}
          target="_blank"
          rel="noopener noreferrer"
          style={legendaStyle}
          className="mt-3 inline-block border-b border-current text-sm font-bold tracking-wide"
        >
          Ver / ouvir a obra ↗
        </a>
      )}
      {legenda !== null && (
        <figcaption style={legendaStyle} className="mt-2 whitespace-pre-line text-[14px] font-bold leading-snug tracking-[0.06em]">
          {legenda?.trim() ? legenda : <Vazio>Legenda</Vazio>}
        </figcaption>
      )}
    </motion.figure>
  )
}

function Heading({ children, tema }) {
  return (
    <h2
      style={ff(tema.fontes.heading)}
      className={`mb-8 text-[2rem] uppercase leading-tight md:text-[2.6rem] ${tema.fontes.heading === 'abril' ? '' : 'font-black'}`}
    >
      {children}
    </h2>
  )
}

function Colunas({ figura, texto, imagemPrimeiro }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className={`min-w-0 ${imagemPrimeiro ? '' : 'md:order-2'}`}>{figura}</div>
      <div className={`min-w-0 ${imagemPrimeiro ? '' : 'md:order-1'}`}>{texto}</div>
    </div>
  )
}

function PaginaObra({ titulo, img, legenda, link, texto, tema, onZoom, reduzir }) {
  const figura = <Obra img={img} legenda={legenda} link={link} onZoom={onZoom} reduzir={reduzir} />
  const corpo = <Texto valor={texto} style={ff(tema.fontes.corpo)} />
  const layout = tema.obras
  return (
    <>
      <Heading tema={tema}>{titulo?.trim() || 'Título da obra'}</Heading>
      {layout === 'imgEsq' || layout === 'imgDir' ? (
        <Colunas figura={figura} texto={corpo} imagemPrimeiro={layout === 'imgEsq'} />
      ) : (
        <div className="flex min-w-0 flex-col gap-8">
          {layout === 'imgAcima' ? <div className="w-full max-w-xl">{figura}</div> : corpo}
          {layout === 'imgAcima' ? corpo : <div className="w-full max-w-xl">{figura}</div>}
        </div>
      )}
    </>
  )
}

export default function PortfolioWall({ portfolio = {}, temaId, nomeEquipe = '', onClose }) {
  const tema = temaPorId(temaId)
  const reduzir = useReducedMotion()
  const [aba, setAba] = useState(0)
  const [direcao, setDirecao] = useState(1)
  const [zoom, setZoom] = useState('')
  const [toque] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const paredeRef = useRef(null)
  const p = portfolio

  const irPara = (i) => {
    if (i < 0 || i >= ABAS.length || i === aba) return
    setDirecao(i > aba ? 1 : -1)
    setAba(i)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (zoom) setZoom('')
        else onClose?.()
        return
      }
      if (zoom || ['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return
      if (e.key === 'ArrowRight') irPara(aba + 1)
      if (e.key === 'ArrowLeft') irPara(aba - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const holofote = (e) => {
    if (reduzir || toque || !paredeRef.current) return
    const r = paredeRef.current.getBoundingClientRect()
    paredeRef.current.style.setProperty('--hx', `${e.clientX - r.left}px`)
    paredeRef.current.style.setProperty('--hy', `${e.clientY - r.top}px`)
  }

  const transicao = reduzir ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }
  const variantes = {
    entra: (d) => ({ x: reduzir ? 0 : d * 90, opacity: 0 }),
    centro: { x: 0, opacity: 1 },
    sai: (d) => ({ x: reduzir ? 0 : d * -90, opacity: 0 }),
  }

  const paginas = [
    <>
      <Heading tema={tema}>{p.nomeArtista?.trim() || 'Nome do(a) artista'}</Heading>
      <Colunas
        imagemPrimeiro={tema.pag1 === 'imgEsq'}
        figura={<Obra img={p.img1} legenda={p.legenda1} onZoom={setZoom} reduzir={reduzir} />}
        texto={<Texto valor={p.trajetoria} style={ff(tema.fontes.corpo)} />}
      />
    </>,
    <PaginaObra
      key="obra2"
      titulo={p.tituloObra2} img={p.img2} legenda={p.legenda2} link={p.link2}
      texto={p.apresentacao} tema={tema} onZoom={setZoom} reduzir={reduzir}
    />,
    <PaginaObra
      key="obra3"
      titulo={p.tituloObra3} img={p.img3} legenda={p.legenda3} link={p.link3}
      texto={p.analise} tema={tema} onZoom={setZoom} reduzir={reduzir}
    />,
    <>
      <Heading tema={tema}>Reflexão histórica</Heading>
      <p style={legendaStyle} className="mb-6 text-lg font-bold uppercase tracking-[0.18em]">
        {p.questaoConceito?.trim() || <Vazio>Questão X: conceito trabalhado</Vazio>}
      </p>
      <Texto valor={p.reflexao} style={ff(tema.fontes.corpo)} />
    </>,
    <>
      <Heading tema={tema}>{nomeEquipe || 'Nome da equipe'}</Heading>
      <Texto valor={p.creditos} style={legendaStyle} className="mb-6 text-[15px] tracking-[0.06em]" />
      <div className="mb-12 max-w-md">
        <Obra img={p.imgEquipe} legenda={null} onZoom={setZoom} reduzir={reduzir} />
      </div>
      <Heading tema={tema}>Referências usadas</Heading>
      <Texto valor={p.referencias} style={legendaStyle} className="text-[14px] font-bold tracking-[0.04em]" />
      <div className="mt-14 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-black/15 pt-8">
        <img src="/logo.svg" alt="DHPB" className="h-16 w-auto" />
        <div style={legendaStyle}>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.15em]">Realização</span>
          <img src="/ifpb-logo.svg" alt="IFPB" className="h-10 w-auto" />
        </div>
        <div style={legendaStyle}>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.15em]">Apoio</span>
          <div className="flex flex-wrap items-center gap-4">
            <img src="/logo-nuhcl.svg" alt="NUHCL" className="h-10 w-auto" />
            <img src="/logo-ndh.svg" alt="NDH" className="h-10 w-auto" />
            <img src="/comite-logo.svg" alt="Comitê Olímpico" className="h-10 w-auto" />
            <img src="/kodeo-logo.svg" alt="Kodeo" className="h-8 w-auto" />
          </div>
        </div>
      </div>
    </>,
  ]

  return (
    <div
      ref={paredeRef}
      onMouseMove={holofote}
      style={{ backgroundColor: tema.bg, ...ff(tema.fontes.corpo) }}
      className="relative mx-auto w-full max-w-[1000px] overflow-hidden text-black [overflow-wrap:anywhere] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
    >
      {!reduzir && !toque && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light"
          style={{ background: 'radial-gradient(520px circle at var(--hx, 50%) var(--hy, 30%), rgba(255,255,255,0.55), transparent 65%)' }}
        />
      )}

      <header>
        <motion.h1
          initial={reduzir ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={ff(tema.fontes.titulo)}
          className={`px-6 py-3 text-center text-[1.8rem] leading-tight md:text-[2.6rem] ${tema.fontes.tituloItalico ? 'italic' : ''} ${tema.fontes.titulo === 'playfair' ? 'font-black' : 'font-bold'}`}
        >
          {p.titulo?.trim() || 'Título do portfólio'}
        </motion.h1>

        <div className="relative h-[320px] w-full overflow-hidden bg-black md:h-[625px]">
          {p.capa?.url ? (
            <motion.img
              src={optimizeCloudinaryUrl(p.capa.url, { width: 1600 })}
              alt="Capa do portfólio"
              className="h-full w-full object-cover"
              initial={{ scale: 1 }}
              animate={reduzir ? { scale: 1 } : { scale: 1.08 }}
              transition={{ duration: 18, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">Capa não enviada</div>
          )}
        </div>

        <nav style={legendaStyle} className="grid grid-cols-5 gap-1 px-3 py-4 md:gap-3 md:px-8" aria-label="Páginas do portfólio">
          {ABAS.map((rotulo, i) => (
            <button
              key={rotulo}
              type="button"
              onClick={() => irPara(i)}
              aria-current={aba === i ? 'page' : undefined}
              className="relative cursor-pointer px-1 py-2 text-left text-[11px] font-bold leading-tight tracking-[0.08em] transition-opacity hover:opacity-70 md:px-3 md:text-[13px]"
            >
              {aba === i && (
                <motion.span
                  layoutId="aba-ativa"
                  transition={transicao}
                  className="absolute inset-0 rounded-lg border-2"
                  style={{ borderColor: tema.accent, backgroundColor: 'rgba(255,255,255,0.25)' }}
                />
              )}
              <span className="relative">{rotulo}</span>
            </button>
          ))}
        </nav>
        <div className="h-[2px] w-full" style={{ backgroundColor: tema.accent }} />
      </header>

      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={direcao} initial={false}>
          <motion.section
            key={aba}
            custom={direcao}
            variants={variantes}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={transicao}
            drag={toque ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) irPara(aba + 1)
              if (info.offset.x > 80) irPara(aba - 1)
            }}
            className="px-6 pb-16 pt-10 md:px-12"
          >
            {paginas[aba]}
          </motion.section>
        </AnimatePresence>
        <img src="/logo.svg" alt="" aria-hidden className="pointer-events-none absolute bottom-4 right-5 h-8 w-auto opacity-80" />
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom('')}
            className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-label="Imagem ampliada"
          >
            <motion.img
              initial={reduzir ? false : { scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={optimizeCloudinaryUrl(zoom, { width: 1600 })}
              alt="Imagem ampliada"
              className="max-h-full max-w-full object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
