'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import localFont from 'next/font/local'
import { doc, getDoc, increment, runTransaction } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import {
  CAPACIDADES,
  CAPA_SRC,
  DVD_COM_CD,
  DVD_ABERTO_SRC,
  DVD_ANIM,
  DVD_FECHADO_SRC,
  DVD_GEO,
  DVD_SAIDA_MS,
  ENIGMAS,
  ENIGMAS_ABERTOS,
  FLIP_ANIM,
  ICONE_SRC,
  INSTRUCAO,
  PDF_DRIVE_URL,
   PRATELEIRA_SRC,
   FUNDO_ESTANTE_SRC,
  RESPONDIDO_SRC,
  alocacaoCompleta,
  alternativasDe,
     calcularPontosTarefa,
     capacidadeMovel,
     CAPA_NO_TILE,
     DISCO_ANIM,
     filaVisual,
     FIXO_IDS,
     fixosAntes,
     idsAlocados,
     ordemGrade,
     prateleirasVazias,
     textoEscolhido,
     VALOR_CORRETO,
   } from './config'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

/** Letra de mão das alternativas, no papel colado dentro do DVD. */
const bryndan = localFont({
  src: '../../../../public/BryndanWriteBook.ttf',
  display: 'swap',
  variable: '--font-bryndan',
})

function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

const STORAGE_PREFIX = 'dhpb-tarefa-galeria-de-enigmas'

function storageKey(faseId) {
  return `${STORAGE_PREFIX}:${faseId || 'preview'}`
}

function lerProgressoLocal(faseId) {
  try {
    const raw = window.localStorage.getItem(storageKey(faseId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function gravarProgressoLocal(faseId, payload) {
  try {
    window.localStorage.setItem(storageKey(faseId), JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

/**
 * Semente do sorteio das alternativas. Vem do rascunho salvo; sem ele, deriva do
 * id da equipe. Não usa `Math.random`: o valor precisa ser o mesmo no servidor e
 * no cliente (hydration) e não pode mudar entre recargas, senão o par de 1 e 2
 * pontos mudaria de lado sozinho. `ordemAlternativas` é que espalha o hash.
 */
function sementeDaEquipe(equipeId, faseId) {
  return equipeId || faseId || 'preview'
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

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
    </svg>
  )
}

function TiktokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="w-full pb-10 pt-12 md:pt-10">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <img src="/logo.svg" alt="DHPB" className="h-14 w-auto object-contain" />
            <div className="flex items-center gap-4 text-black">
              <a href="https://www.instagram.com/oficialdhpb/" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:text-[#82181A]">
                <InstagramIcon />
              </a>
              <a href="https://www.tiktok.com/@oficialdhpb" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:text-[#82181A]">
                <TiktokIcon />
              </a>
              <a href="#" className="transition-transform duration-300 hover:text-[#82181A]">
                <YoutubeIcon />
              </a>
            </div>
          </div>
          <div className="hidden h-20 w-px bg-black lg:block" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-black">Realização:</span>
            <img src="/ifpb-logo.svg" alt="IFPB" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-black">Apoio:</span>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
              <img src="/logo-nuhcl.svg" alt="NUHCL" className="h-10 w-auto object-contain" />
              <img src="/logo-ufcg.svg" alt="HISTORIA-UFCG" className="h-12 w-auto object-contain" />
              <img src="/logo-ndh.svg" alt="NDH" className="h-13 w-auto object-contain" />
            </div>
          </div>
          <div className="hidden h-20 w-px bg-black lg:block" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-black">Powered by:</span>
            <div className="flex items-center gap-4">
              <img src="/kodeo-logo.svg" alt="Kodeo" className="h-10 w-auto object-contain" />
              <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
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

/** Os fixos nunca entram no estado; um rascunho antigo que os tenha perde eles aqui. */
function normalizarPrateleiras(raw) {
  const base = prateleirasVazias()
  if (!raw) return base
  const moveis = (fila) => (fila || []).filter((id) => !FIXO_IDS.has(id))
  return {
    1: moveis(raw[1] || raw['1']),
    2: moveis(raw[2] || raw['2']),
    3: moveis(raw[3] || raw['3']),
  }
}

function retirar(prateleiras, id) {
  const next = normalizarPrateleiras(prateleiras)
  next[1] = next[1].filter((item) => item !== id)
  next[2] = next[2].filter((item) => item !== id)
  next[3] = next[3].filter((item) => item !== id)
  return next
}

/** Faixa útil de cada nível do SVG da estante (% do frame 1122x1402 do Figma). */
const NIVEIS = {
  1: 'top-[8.5%] h-[13%]',
  2: 'top-[32%] h-[17%]',
  3: 'top-[54%] h-[20%]',
}

function mensagemCapacidade(bloco) {
  const teto = CAPACIDADES[bloco]
  return `Não pode haver mais de ${teto} enigmas nesta prateleira (contando o fixo).`
}

async function persistirResposta({
  equipeId,
  faseId,
  status,
  prateleiras,
  enigmas,
  sorteio,
  pontos,
  respostaPesoAnterior,
  atualizadoPor,
  pesoFase,
}) {
  const respostaId = `tarefa_${faseId}`
  const respostaRef = doc(db, 'equipes', equipeId, 'respostas', respostaId)
  const equipeRef = doc(db, 'equipes', equipeId)
  const pontuacaoRef = doc(db, 'equipes', equipeId, 'pontuacoes', faseId)

  const pontosTarefa = pontos.nota
  const novoPeso = status === 'entregue' ? pontosTarefa : 0
  const delta = novoPeso - respostaPesoAnterior
  const deltaDi = Math.round(delta * pesoFase * 100) / 100

  const respostaObj = {
    status,
    peso: pontosTarefa,
    faseId,
    tipo: 'tarefa',
    prateleiras,
    enigmas,
    sorteio,
    /** As duas etapas, para conferência no admin. A nota é a média delas. */
    pontosResolucao: pontos.resolucao,
    pontosEstante: pontos.estante,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor,
  }

  await runTransaction(db, async (transaction) => {
    const rSnap = await transaction.get(respostaRef)
    if (rSnap.exists() && rSnap.data().status === 'entregue') {
      throw new Error('Tarefa já entregue por outro membro.')
    }

    transaction.set(respostaRef, respostaObj, { merge: true })

    if (delta !== 0) {
      transaction.set(pontuacaoRef, {
        ni: increment(delta),
        di: increment(deltaDi),
      }, { merge: true })

      transaction.update(equipeRef, {
        df: increment(deltaDi),
        [`respostas.${respostaId}`]: respostaObj,
        [`respostas.tarefa`]: respostaObj,
        [`pontuacoes.${faseId}.ni`]: increment(delta),
        [`pontuacoes.${faseId}.di`]: increment(deltaDi),
      })
    } else {
      transaction.update(equipeRef, {
        [`respostas.${respostaId}`]: respostaObj,
        [`respostas.tarefa`]: respostaObj,
      })
    }
  })

  return { novoPeso, respostaObj }
}

/**
 * Faixa da pergunta, acima do DVD.
 *
 * A fonte desce por tamanho de texto em vez de cortar: o enunciado mais longo
 * do PDF tem 287 caracteres. Medido: 1024px de faixa aceita 4 linhas a 1,6rem;
 * 328px (celular) precisa de 1rem ou menos.
 *
 * Sem `max-h` e sem `line-clamp` de propósito. `line-clamp` não prendia nesta
 * caixa (mostrava a 5ª linha pela metade, sem elipse) e um `max-h` fixo era
 * espremido pelo flex da coluna, cortando por baixo. A altura é a que der: quem
 * encolhe o DVD é o palco, que se dimensiona a partir dela (ver `alturaFaixa`).
 *
 * A largura vem de `larguraFaixa`, independente da largura do palco, para a
 * medição da altura não alimentar a largura do palco e vice-versa.
 */
function FaixaPergunta({ texto, ref }) {
  const degrau =
    texto.length > 400
      ? 'text-[0.8rem] sm:text-[0.95rem]'
      : texto.length > 230
        ? 'text-[0.95rem] sm:text-[1.15rem]'
        : texto.length > 160
          ? 'text-[1.05rem] sm:text-[1.35rem]'
          : 'text-[1.25rem] sm:text-[1.6rem]'
  return (
    <p ref={ref} className={`charada-faixa w-full px-4 py-3 leading-[1.35] sm:px-8 sm:py-4 ${degrau}`}>
      {texto}
    </p>
  )
}

/**
 * Tile da grade. Estático por contrato — nenhuma animação, nenhum
 * `animation-delay`, nenhum DVD. A tampa do DVD só existe dentro do modal
 * (componente `DvdCaixa`), que é o gatilho da abertura.
 *
 * `virado` (botão Mostrar Filmes) gira o quadrado no próprio eixo e mostra a capa
 * do filme. No sentido inverso, `dvd-voltando` anima a volta para o quadrado
 * vermelho. Alocado, o lugar fica vazio: só o vão tracejado, sem o "?" translúcido.
 *
 * `marcado` é o quadrado vermelho: enigma já respondido no PDF **ou** com
 * caminho escolhido pela equipe.
 *
 * Arrastar move o quadrado para a estante; soltar sem mover é o clique que
 * abre o DVD. O clique de teclado vem pelo `onClick` (`detail === 0`), já que
 * Enter/Espaço num button não geram `pointerup`.
 */
function TileEnigma({ id, index, comando, ativo, alocado, virado, marcado, capa, onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture }) {
  // Na estante, o quadrado da grade é só a marca do lugar vazio: abre-se pela caixa na prateleira.
  const gestos = alocado ? {} : { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture }
  return (
    <button
      type="button"
      disabled={alocado}
      onClick={(event) => {
        if (!alocado && event.detail === 0) onClick()
      }}
      {...gestos}
      aria-label={`Enigma ${id}${marcado ? ' (respondido)' : ''}${alocado ? ' (na estante)' : ''}: ${comando}`}
      className={`relative block aspect-[240/312] w-full border-2 border-[#3B2A1E] touch-none transition-colors ${
        alocado ? 'cursor-default' : virado ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${alocado ? 'border-dashed border-[#3B2A1E]/35 bg-[#E9E1D3]/45' : ''}`}
    >
      {!alocado && (
        <span
          className="dvd-vira"
          style={{
            '--dvd-vira-dur': `${FLIP_ANIM.duracaoMs}ms`,
            '--dvd-vira-delay': `${index * FLIP_ANIM.staggerMs}ms`,
          }}
        >
          <span className="dvd-vira-face">
            <img src={marcado ? RESPONDIDO_SRC : ICONE_SRC} alt="" className="block h-full w-full object-cover" draggable={false} />
          </span>
          <span className="dvd-vira-face dvd-vira-costas">
            {/* Ampliada para a caixa de DVD preencher o quadrado, como a face
                fechada preenche no modal. Medido em `CAPA_NO_TILE`. */}
            <img src={capa} alt="" className="block h-full w-full object-cover" style={{ transform: CAPA_NO_TILE }} draggable={false} />
          </span>
        </span>
      )}
      {ativo && (
        <span className="pointer-events-none absolute inset-0 ring-[3px] ring-inset ring-[#82181A]" />
      )}
    </button>
  )
}

/**
 * Caixa de DVD que abre dentro do modal: a base mostra a bandeja com o CD e a
 * tampa gira 180° em torno da lombada real (DVD_GEO.eixoX). Frente = capa
 * fechada, verso = painel interno com o papel pautado.
 *
 * O palco é montado junto com o modal, então a animação CSS roda uma vez por
 * abertura e só nele. `var(--dvd-delay)` segura o keyframe `from` (tampa
 * fechada) durante a pausa inicial. Nada de estado: fechar o modal desmonta
 * esta subárvore e a próxima abertura recomeça em `rotateY(0deg)`.
 *
 * A pergunta fica na faixa acima do palco, não aqui.
 *
 * `fechado` é a arte da tampa fechada. Por padrão é a caixa genérica da
 * locadora; no modo "Mostrar Filmes" entra a capa do filme daquele enigma, para
 * que a tampa que gira seja a do próprio filme. O recorte de `faceFrente` foi
 * medido em `dvd-fechado.png`, e as 20 capas têm a mesma moldura (medido: mesma
 * faixa de pixels), então o mesmo recorte serve para as duas.
 *
 * `girarDisco` só faz sentido com a arte de disco (`DVD_COM_CD`): ela é quem tem
 * um CD. A arte de dois Papers não tem, e a janela circular mostraria um pedaço
 * do papel girando.
 *
 * Os dois papéis são zonas diferentes: o da esquerda é o verso da tampa (viaja
 * com a rotação) e o da direita é a bandeja (fica parado). Por isso o texto da
 * esquerda entra dentro de `.dvd-capa` e o da direita em `.dvd-base`.
 * `aberto` permite que cada enigma respondido use o seu próprio desenho.
 *
 * `escolha` (opcional) é o que faz cada papel ser clicável e acender. Ele mora
 * **dentro** de cada papel, e não numa camada por cima do palco, porque os dois
 * papéis estão em sistemas de coordenadas diferentes: para desenhar a marca da
 * esquerda em % do palco seria preciso compor a rotação da tampa na mão. Cada
 * botão usa `DVD_GEO.papel` no espaço do seu próprio pai, e o navegador aplica
 * a transformação. `escolha` nulo (ou sem valor) some com os botões.
 */
/**
 * Letra do papel por tamanho do texto. O `.dvd-texto` (2,1cqw) foi calibrado
 * para 257 caracteres; a altura cresce com o quadrado da fonte, então textos
 * maiores descem de degrau em vez de cortar no `overflow: hidden`.
 */
function fonteDoPapel(texto) {
  const n = texto?.length || 0
  if (n > 340) return { fontSize: '1.6cqw' }
  if (n > 257) return { fontSize: '1.8cqw' }
  return undefined
}

function DvdCaixa({ textoEsquerda, textoDireita, aberto = DVD_ABERTO_SRC, fechado = DVD_FECHADO_SRC, escolha, girarDisco = false }) {
  const { eixoX, folha, faceFrente, faceVerso, texto, papel, disco } = DVD_GEO
  const esperar = `${DVD_ANIM.delayMs + DVD_ANIM.duracaoMs}ms`
  const botao = (lado, rect) => {
    if (!escolha) return null
    const marcado = escolha.valor === lado.valor
    return (
      <button
        key={lado.nome}
        type="button"
        disabled={escolha.travado}
        onClick={() => escolha.onPick(lado.indice)}
        aria-pressed={marcado}
        aria-label={`Caminho do papel da ${lado.nome}`}
        className={`dvd-escolha absolute ${marcado ? 'bg-[#82181A]/20' : ''}`}
        style={{ ...rect, '--dvd-espera': esperar }}
      />
    )
  }
  return (
    <div
      className="dvd-cena"
      style={{
        '--dvd-eixo': eixoX,
        '--dvd-dur': `${DVD_ANIM.duracaoMs}ms`,
        '--dvd-delay': `${DVD_ANIM.delayMs}ms`,
      }}
    >
      <span className="dvd-palco block">
        <span className="dvd-base">
          <img src={aberto} alt="" className="h-full w-full object-cover" draggable={false} />
          {girarDisco && (
            /*
             * Janela parada sobre o disco, com duas faixas de brilho girando
             * dentro. Não é a arte do disco girando — ela está embutida no PNG
             * da caixa e é elíptica, e girar os pixels traz a moldura junto. Ver
             * o longo motivo em `DVD_GEO.disco`.
             */
            <span className="dvd-disco" style={disco.janela}>
              <span
                className="dvd-disco-brilho dvd-disco-brilho-largo"
                style={{ '--dvd-disco-volta': `${DISCO_ANIM.voltaMs}ms` }}
              />
              <span
                className="dvd-disco-brilho dvd-disco-brilho-estreito"
                style={{ '--dvd-disco-volta': `${DISCO_ANIM.voltaMs}ms` }}
              />
            </span>
          )}
          {textoDireita && (
            <span className={`dvd-texto ${bryndan.variable} absolute`} style={{ ...texto.direita, ...fonteDoPapel(textoDireita) }}>
              {textoDireita}
            </span>
          )}
          {botao({ nome: 'direita', indice: 1, valor: escolha?.direita }, papel.direita)}
        </span>
        <span
          className="dvd-capa"
          style={{ left: eixoX, top: folha.topo, width: folha.largura, height: folha.altura }}
        >
          <span
            className="dvd-face"
            style={{
              backgroundImage: `url(${fechado})`,
              backgroundSize: faceFrente.size,
              backgroundPosition: faceFrente.position,
            }}
          />
          <span
            className="dvd-face dvd-face-verso"
            style={{
              backgroundImage: `url(${aberto})`,
              backgroundSize: faceVerso.size,
              backgroundPosition: faceVerso.position,
            }}
          >
            {textoEsquerda && (
              <span className={`dvd-texto ${bryndan.variable} absolute`} style={{ ...texto.esquerda, ...fonteDoPapel(textoEsquerda) }}>
                {textoEsquerda}
              </span>
            )}
            {botao({ nome: 'esquerda', indice: 0, valor: escolha?.esquerda }, papel.esquerda)}
          </span>
        </span>
      </span>
    </div>
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
  const [prateleiras, setPrateleiras] = useState(prateleirasVazias)
  const [enigmas, setEnigmas] = useState({})
  const [status, setStatus] = useState('pendente')
  const [respostaPesoAnterior, setRespostaPesoAnterior] = useState(0)
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [atualizadoPor, setAtualizadoPor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [alertaCapacidade, setAlertaCapacidade] = useState('')
  const [blocoAlerta, setBlocoAlerta] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [localPreview, setLocalPreview] = useState(false)
  const [questoes, setQuestoes] = useState([])
  const [selecionadoId, setSelecionadoId] = useState(null)
  const [detalheId, setDetalheId] = useState(null)
  const [alvoBloco, setAlvoBloco] = useState(null)
  const [alvoSlot, setAlvoSlot] = useState(null)
  const [mostrarFilmes, setMostrarFilmes] = useState(false)
  /**
   * A volta dos quadrados para o desenho vermelho é animada, e por isso precisa
   * de um estado próprio: sem ele, tirar `.dvd-virado` só removeria a animação e
   * os 20 quadrados saltariam de uma vez. Vive ligado pelo tempo da animação
   * (virada + o maior stagger) e some sozinho.
   */
  const [voltando, setVoltando] = useState(false)
  const [viradas, setViradas] = useState(0)
  const [fechando, setFechando] = useState(false)
  /** DVD aberto a partir da estante: abre para ler, sem escolher. */
  const [leitura, setLeitura] = useState(false)
  const [sorteioSalvo, setSorteioSalvo] = useState('')
  /* Posição do quadrado arrastado. Só muda no início e no fim do gesto — no
     meio o ghost é movido por `style.transform` direto no DOM, senão a página
     inteira re-renderiza a 60fps. O ponteiro cru vive em `gestoRef`. */
  const [fantasma, setFantasma] = useState(null)
  const gestoRef = useRef(null)
  const fantasmaRef = useRef(null)
  /** Altura real da faixa da pergunta, para o palco não encostar na viewport. */
  const faixaRef = useRef(null)
  const [alturaFaixa, setAlturaFaixa] = useState(0)

  const resumoHref = `/resumo-fase?faseId=${faseId || ''}&edicaoId=${edicaoId || ''}&equipeId=${equipeId || ''}`
  const locked = status === 'entregue' || fase?.status === 'correcao'
  const titulo = fase?.tarefa?.titulo || 'Tarefa'
  const alocados = idsAlocados(prateleiras)
  const completa = alocacaoCompleta(prateleiras)
  const detalhe = ENIGMAS.find((item) => item.id === detalheId)
  /**
   * Ordem das duas alternativas no DVD. Cada equipe vê uma ordem diferente,
   * então o par de 1 e 2 pontos não fica sempre do mesmo lado.
   */
  const sorteio = sorteioSalvo || sementeDaEquipe(equipeId, faseId)
  const alternativas = detalhe ? alternativasDe(detalhe, sorteio) : []
  const valorEscolhido = detalhe ? enigmas[detalhe.id]?.valor : null
  const respondendo = detalhe ? Boolean(detalhe.respondido) : false
  /** Respondido no PDF ou guardado na estante: os dois casos abrem só para ler. */
  const somenteLeitura = respondendo || leitura
  const marcas = ENIGMAS_ABERTOS.filter((item) => enigmas[item.id]?.valor).length
  /**
   * Quadrado vermelho, na grade e na estante: enigma respondido no PDF **ou**
   * com caminho escolhido pela equipe. Um único conjunto para os dois lugares,
   * senão a estante mostra a arte de "trancado" num enigma que a equipe já
   * respondeu e parece bug.
   */
  const marcados = new Set(ENIGMAS.filter((e) => e.respondido || enigmas[e.id]?.valor).map((e) => e.id))
  /** Mostrar Filmes só abre com alternativa escolhida nos 10 enigmas abertos. O
   *  mesmo `todosMarcados` é o portão da estante: não há botão para destravar. */
  const todosMarcados = marcas === ENIGMAS_ABERTOS.length
  /**
   * A arte do DVD aberto no modal. A de disco (que já traz a capa do filme no
   * próprio CD) é exclusiva do modo "Mostrar Filmes": no dia a dia vale a arte
   * de dois papéis, senão a equipe não veria a alternativa que ainda pode
   * trocar. E o `texto.esquerda` serve para as duas — o papel está no mesmo
   * lugar nos dois conjuntos de arte.
   */
  const dvdAbertoDoDetalhe = (mostrarFilmes && DVD_COM_CD[detalheId]) || DVD_ABERTO_SRC
  /**
   * O que acende no papel. Em Mostrar Filmes e na estante (leitura) é a
   * alternativa escolhida; num enigma respondido do PDF, que a equipe não
   * escolheu, é a correta — a que vale 2. O mesmo que a equipe marcar, para não
   * inventar um segundo visual de "respondido".
   */
  const valorMarcado = respondendo ? VALOR_CORRETO : valorEscolhido
  /**
   * Em Mostrar Filmes o papel traz **só** a alternativa escolhida, não as duas.
   * Nas artes de disco o lado direito é o CD, então não existe segundo papel:
   * o texto vai no da esquerda e o outro some. Num enigma respondido, o que
   * aparece é a correta, já que a equipe nunca escolheu ali.
   */
  const textoMostrado = mostrarFilmes
    ? {
        esquerda: textoEscolhido(alternativas, valorMarcado),
        direita: null,
      }
    : { esquerda: alternativas[0]?.texto, direita: alternativas[1]?.texto }
  /**
   * O palco é 4:3 e encolhe conforme a pergunta. A faixa tem a largura da
   * viewport (nada a ver com o palco) e a altura que o texto precisar; o
   * palco desconta essa altura da viewport, então pergunta grande encolhe o DVD
   * em vez de empurrá-lo para fora da tela. `MOLDURA_MODAL` cobre o padding do
   * overlay, o vão e a folga de segurança (20+20+16+32 no desktop).
   */
  const MOLDURA_MODAL = 88
  const larguraFaixa = 'min(96vw, 1100px)'
  const larguraPalco = `min(96vw, 1100px, calc((100vh - ${alturaFaixa + MOLDURA_MODAL}px) * 4 / 3), calc((100dvh - ${alturaFaixa + MOLDURA_MODAL}px) * 4 / 3))`
  /**
   * Centro da caixa fechada, em % da largura do palco: `eixoX + folha/2`. A
   * tampa fechada pousa na direita do palco, então a saída precisa andar
   * exatamente essa distância para a esquerda para chegar ao meio da tela.
   */
  const desvioFechado = `calc(${parseFloat(DVD_GEO.eixoX) + parseFloat(DVD_GEO.folha.largura) / 2 - 50}%)`

  const hrefQuestao = (q, idx) => {
    if (!q?.id || !faseId || !edicaoId) return ''
    const prevId = idx > 0 ? questoes[idx - 1]?.id || '' : ''
    const nextId = idx < questoes.length - 1 ? questoes[idx + 1]?.id || '' : ''
    return `/questao?questaoId=${q.id}&faseId=${faseId}&edicaoId=${edicaoId}&equipeId=${equipeId || ''}&prevId=${prevId}&nextId=${nextId}`
  }

  const setaEsquerdaHref = questoes.length > 0 ? hrefQuestao(questoes[questoes.length - 1], questoes.length - 1) : ''
  const setaDireitaHref = questoes.length > 0 ? hrefQuestao(questoes[0], 0) : ''

  const aplicarSalvo = (salvo) => {
    setPrateleiras(normalizarPrateleiras(salvo.prateleiras))
    setEnigmas(salvo.enigmas || {})
    if (salvo.sorteio) setSorteioSalvo(salvo.sorteio)
    setStatus(salvo.status || 'pendente')
    setRespostaPesoAnterior(salvo.status === 'entregue' ? (salvo.peso || 0) : 0)
    setAtualizadoEm(salvo.atualizadoEm || '')
    setAtualizadoPor(salvo.atualizadoPor || '')
  }

  useEffect(() => {
    if (!isLocalDevHost()) return
    setLocalPreview(true)
    setCarregando(false)
    setFase((atual) => atual || { tarefa: { titulo: 'Galeria de Enigmas', pontuacao: 20 }, peso: 0, status: 'aberta' })
    const salvo = lerProgressoLocal(faseId)
    if (salvo) aplicarSalvo(salvo)
  }, [faseId])

  useEffect(() => {
    if (!edicaoId || !faseId) return
    const carregarQuestoes = async () => {
      try {
        const faseSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
        if (!faseSnap.exists()) return
        const data = faseSnap.data()
        setFase((atual) => ({
          ...(atual || {}),
          ...data,
          id: faseSnap.id,
          tarefa: data.tarefa || atual?.tarefa || { titulo: 'Tarefa', pontuacao: 20 },
        }))
        const lista = [...(data.questoesIndex || data.questoes || [])].sort((a, b) => (a.numero || 0) - (b.numero || 0))
        setQuestoes(lista.filter((q) => q.id))
      } catch {
        /* prévia sem login */
      }
    }
    carregarQuestoes()
  }, [edicaoId, faseId])

  useEffect(() => {
    if (isLocalDevHost()) return
    if (!loading && !authUser) router.push('/login')
  }, [loading, authUser, router])

  /**
   * Mede a faixa da pergunta. Só o `ResizeObserver` escreve o estado: ele dispara
   * antes do paint, então o palco já entra no tamanho certo no primeiro quadro,
   * sem `setState` síncrono no corpo do efeito.
   */
  useEffect(() => {
    const el = faixaRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAlturaFaixa(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [detalheId])

  useEffect(() => {
    if (isLocalDevHost()) return
    if (!loading && authUser && (!equipeId || !faseId || !edicaoId)) {
      setErro('Faltam equipeId, faseId ou edicaoId. Volte pelo resumo da fase.')
      setCarregando(false)
    }
  }, [localPreview, loading, authUser, equipeId, faseId, edicaoId])

  useEffect(() => {
    if (localPreview || !authUser || !equipeId || !faseId || !edicaoId) return

    const carregar = async () => {
      try {
        const equipeSnap = await getDoc(doc(db, 'equipes', equipeId))
        if (!equipeSnap.exists()) {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
          return
        }
        const equipe = equipeSnap.data()
        const membroAtivo = (equipe.membros || []).some((m) => m.uid === authUser.uid && m.status === 'ativo')
        if (!membroAtivo) {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
          return
        }

        const faseSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
        if (!faseSnap.exists()) {
          setErro('Fase não encontrada.')
          setCarregando(false)
          return
        }
        const faseData = { id: faseSnap.id, ...faseSnap.data() }
        if (faseData.status !== 'aberta' && faseData.status !== 'correcao') {
          router.push(userData?.tipo === 'professor' ? '/home-professor' : '/home')
          return
        }
        setFase(faseData)

        const respostaId = `tarefa_${faseId}`
        const rSnap = await getDoc(doc(db, 'equipes', equipeId, 'respostas', respostaId))
        if (rSnap.exists()) aplicarSalvo(rSnap.data())
      } catch (err) {
        setErro(err?.message || 'Não foi possível carregar a tarefa.')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [localPreview, authUser, equipeId, faseId, edicaoId, router, userData])

  /**
   * `leitura` marca o DVD aberto a partir da estante: dá para ler, não para
   * escolher. Na grade o enigma sempre dá para responder; na estante ele já
   * está guardado, e quem quiser trocar a resposta tira com o × e responde lá.
   */
  const abrirEnigma = (id, leitura = false) => {
    setSelecionadoId(id)
    setDetalheId(id)
    setLeitura(leitura)
    setFechando(false)
    setAlertaCapacidade('')
    setBlocoAlerta(null)
  }

  /** Fecha a tampa, leva a caixa ao meio da tela e só então a faz sair. */
  const fecharEnigma = () => {
    if (fechando) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDetalheId(null)
      setLeitura(false)
      return
    }
    setFechando(true)
    window.setTimeout(() => {
      setDetalheId(null)
      setLeitura(false)
      setFechando(false)
    }, DVD_SAIDA_MS)
  }

  useEffect(() => {
    if (!detalheId) return
    const onKey = (event) => {
      if (event.key === 'Escape') fecharEnigma()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detalheId, fechando])

  /** Slot da estante sob o ponto, com bloco e índice, ou null. */
  function slotEm(x, y) {
    for (const slot of document.querySelectorAll('[data-slot]')) {
      const r = slot.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const [bloco, indice] = slot.dataset.slot.split(':').map(Number)
        return { bloco, indice }
      }
    }
    return null
  }

  function moverFantasma(x, y) {
    const el = fantasmaRef.current
    if (el) {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(-6deg)`
    }
  }

  const iniciarArrasto = (event, id) => {
    if (event.button != null && event.button !== 0) return
    // O gesto é sempre registrado: soltar sem arrastar é o clique que abre o
    // DVD. `permitido` é o que trava o arrasto antes dos 10 enigmas respondidos.
    gestoRef.current = {
      id,
      x0: event.clientX,
      y0: event.clientY,
      x: event.clientX,
      y: event.clientY,
      ativo: false,
      permitido: todosMarcados,
    }
    // pointer capture: a estante fica longe do tile, sem ele o pointerup
    // chegaria no elemento sob o cursor, não no tile.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* pointer já liberado */
    }
  }

  const moverArrasto = (event, id) => {
    const gesto = gestoRef.current
    if (!gesto || gesto.id !== id) return
    gesto.x = event.clientX
    gesto.y = event.clientY
    if (!gesto.ativo) {
      if (Math.hypot(gesto.x - gesto.x0, gesto.y - gesto.y0) < 5) return
      // A estante fechada não impede o gesto de virar arrasto: precisa virar,
      // senão o `soltar` cairia no "não arrastou" e abriria o modal no meio de
      // uma tentativa de arrastar. Quem barra é `soltarArrasto`, que ainda
      // explica o motivo.
      gesto.ativo = true
      if (!gesto.permitido) return
      setFantasma({ id, x: gesto.x, y: gesto.y })
    }
    if (!gesto.permitido) return
    event.preventDefault()
    moverFantasma(gesto.x, gesto.y)
    const slot = slotEm(gesto.x, gesto.y)
    setAlvoBloco(slot?.bloco ?? null)
    setAlvoSlot(slot ? `${slot.bloco}:${slot.indice}` : null)
  }

  const soltarArrasto = (event, id) => {
    const gesto = gestoRef.current
    if (!gesto || gesto.id !== id) return
    gestoRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* capture já perdido */
    }
    if (!gesto.ativo) {
      // não arrastou: é o clique que abre o DVD
      abrirEnigma(id)
      return
    }
    const slot = slotEm(gesto.x, gesto.y)
    setFantasma(null)
    setAlvoBloco(null)
    setAlvoSlot(null)
    if (!slot) return
    // Arrasto de verdade sobre um slot, com a estante ainda fechada: explica o
    // motivo em vez de não fazer nada. `moverParaPrateleira` repete a guarda
    // para o caminho do clique, então os dois casos dão o mesmo aviso.
    moverParaPrateleira(slot.bloco, slot.indice, gesto.id)
  }

  const cancelarArrasto = () => {
    gestoRef.current = null
    setFantasma(null)
    setAlvoBloco(null)
    setAlvoSlot(null)
  }

  /* Rolagem automática: no celular a grade e a estante não cabem juntas na
     tela, e o `touch-action: none` do tile impede o browser de rolar.
     A velocidade cresce com a proximidade da borda, senão passa do ponto. */
  useEffect(() => {
    if (!fantasma) return
    let raf
    const passo = () => {
      const gesto = gestoRef.current
      if (gesto?.ativo) {
        const margem = 110
        const folga = Math.max(0, Math.min(margem, Math.min(gesto.y, window.innerHeight - gesto.y)))
        const resto = margem - folga
        if (resto > 0) {
          window.scrollBy(0, gesto.y < window.innerHeight / 2 ? -resto / 10 : resto / 10)
        }
      }
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [fantasma])

  /**
   * Escolhe o caminho pelo índice da metade (0 = papel da esquerda, 1 = da
   * direita). Grava o VALOR (1 ou 2), não a letra: qual texto cai em cada lado é
   * sorteado por equipe, então "A"/"B" não significam nada entre equipes.
   */
  const escolherAlternativa = (indice) => {
      if (locked || !detalheId || somenteLeitura) return
    const alvo = alternativas[indice]
    if (!alvo) return
    setEnigmas((atual) => ({ ...atual, [detalheId]: { valor: alvo.valor } }))
  }

  /**
   * `id` vem do arrasto; sem ele usa a seleção por clique (caminho reserva).
   * `indice` é a posição visual do slot solto, então soltar sobre um slot já
   * ocupado reordena em vez de duplicar. Depois de `retirar` o item da fila,
   * `splice(indice, 0, id)` devolve exatamente a posição visual solta — tanto
   * para mover para a frente quanto para trás.
   */
  const moverParaPrateleira = (bloco, indice = Infinity, id = selecionadoId) => {
    if (locked) return
    // A estante só abre depois dos 10 enigmas abertos respondidos. Não há botão
    // para destravar: o portão é o próprio `todosMarcados`, o mesmo que libera
    // o "Mostrar Filmes".
    if (!todosMarcados) {
      setMensagem(`Responda os ${ENIGMAS_ABERTOS.length} enigmas abertos para liberar a estante.`)
      return
    }
    if (!id) {
      setMensagem('Clique primeiro em um enigma.')
      return
    }
    if (FIXO_IDS.has(id)) {
      setMensagem('Este enigma é fixo na estante e não pode ser movido.')
      return
    }
    const limpo = retirar(prateleiras, id)
    const fila = limpo[bloco]
    if (fila.length >= capacidadeMovel(bloco)) {
      setAlertaCapacidade(mensagemCapacidade(bloco))
      setBlocoAlerta(bloco)
      return
    }
    // `indice` é o slot visual; no estado só estão os móveis, então desconta os fixos antes dele.
    const indiceMovel = indice - fixosAntes(bloco, indice)
    fila.splice(Math.max(0, Math.min(indiceMovel, fila.length)), 0, id)
    setPrateleiras({ ...limpo, [bloco]: fila })
    setAlertaCapacidade('')
    setBlocoAlerta(null)
    setSelecionadoId(null)
    setMensagem('')
  }

  const removerDaPrateleira = (id) => {
    if (locked) return
    setPrateleiras(retirar(prateleiras, id))
    setAlertaCapacidade('')
    setBlocoAlerta(null)
  }

  const salvar = async (novoStatus) => {
    if (locked && novoStatus === 'rascunho') return
    if (status === 'entregue') {
      setMensagem('Tarefa já entregue.')
      return
    }
    if (novoStatus === 'entregue' && !alocacaoCompleta(prateleiras)) {
      setMensagem('Coloque os 20 enigmas nas prateleiras (7, 7 e 6) antes de entregar.')
      return
    }

    const pontos = calcularPontosTarefa({ enigmas, prateleiras }, fase?.tarefa?.pontuacao || 20)
    setSalvando(true)
    setMensagem('')

    if (localPreview) {
      const agora = new Date().toISOString()
      const payload = {
        prateleiras,
        enigmas,
        sorteio,
        status: novoStatus,
        peso: pontos.nota,
        pontosResolucao: pontos.resolucao,
        pontosEstante: pontos.estante,
        atualizadoEm: agora,
        atualizadoPor: 'prévia local',
      }
      gravarProgressoLocal(faseId, payload)
      setStatus(novoStatus)
      setRespostaPesoAnterior(novoStatus === 'entregue' ? pontos.nota : 0)
      setAtualizadoEm(agora)
      setAtualizadoPor('prévia local')
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue (só nesta prévia).' : 'Rascunho salvo (só nesta prévia).')
      setSalvando(false)
      return
    }

    try {
      const { novoPeso, respostaObj } = await persistirResposta({
        equipeId,
        faseId,
        status: novoStatus,
        prateleiras,
        enigmas,
        sorteio,
        pontos,
        respostaPesoAnterior,
        atualizadoPor: userData?.nome || authUser.email,
        pesoFase: fase?.peso || 0,
      })
      setStatus(novoStatus)
      setRespostaPesoAnterior(novoPeso)
      setAtualizadoEm(respostaObj.atualizadoEm)
      setAtualizadoPor(respostaObj.atualizadoPor)
      setMensagem(novoStatus === 'entregue' ? 'Tarefa entregue!' : 'Rascunho salvo.')
    } catch (err) {
      setMensagem(err?.message || 'Não foi possível salvar agora.')
    } finally {
      setSalvando(false)
    }
  }

  const entregarTarefa = () => {
    if (locked) return
    if (!alocacaoCompleta(prateleiras)) {
      setMensagem('Coloque os 20 enigmas nas prateleiras (7, 7 e 6) antes de entregar.')
      return
    }
    if (!window.confirm('Tem certeza? Não será possível alterar depois.')) return
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

  return (
    <div className={poppins.className}>
      <div className="min-h-screen w-full bg-white text-black">
        <Header userData={userData} equipeId={equipeId} logout={localPreview ? () => {} : logout} />

        {localPreview && (
          <p className="bg-[#82181A] px-4 py-2 text-center text-sm text-white">
            Prévia local — sem login e sem Firestore. Em produção o acesso continua autenticado.
          </p>
        )}

        <section className="pb-20">
          <div className="mx-auto grid max-w-[720px] grid-cols-[44px_1fr_44px] items-center px-4 pt-12 md:pt-[4.5rem]">
            <div className="justify-self-start">
              {setaEsquerdaHref ? (
                <Link href={setaEsquerdaHref} className="flex h-10 w-10 items-center justify-center" aria-label="Questão anterior">
                  <span className="border-y-[7px] border-y-transparent border-r-[10px] border-r-black" />
                </Link>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center opacity-25" aria-hidden>
                  <span className="border-y-[7px] border-y-transparent border-r-[10px] border-r-black" />
                </span>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-[1.85rem] font-light leading-none text-[#82181A] md:text-[2.25rem]">
                {titulo}
              </h1>
            </div>
            <div className="justify-self-end">
              {setaDireitaHref ? (
                <Link href={setaDireitaHref} className="flex h-10 w-10 items-center justify-center" aria-label="Primeira questão">
                  <span className="border-y-[7px] border-y-transparent border-l-[10px] border-l-black" />
                </Link>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center opacity-25" aria-hidden>
                  <span className="border-y-[7px] border-y-transparent border-l-[10px] border-l-black" />
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center px-4">
            {PDF_DRIVE_URL ? (
              <a
                href={PDF_DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer rounded-full border-[3px] border-[#82181A] px-6 py-2 text-sm font-medium text-[#82181A] transition-colors hover:bg-[#82181A] hover:text-white"
              >
                Baixar PDF da tarefa
              </a>
            ) : (
              <span className="rounded-full border-[3px] border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-400">
                Baixar PDF da tarefa
              </span>
            )}
          </div>

          <div className="mx-auto max-w-3xl whitespace-pre-line px-5 pt-10 text-justify text-[1rem] font-medium leading-relaxed text-[#2F2F2F] md:pt-14">
            {INSTRUCAO}
          </div>

          <div className="mx-auto mt-10 max-w-5xl px-4">
            {/* `key` = contador de viradas: remontar a grade reinicia a animação
                do flip, que uma segunda ida no botão não faria sozinha. Vale
                para os dois sentidos — `dvd-virado` para virar, `dvd-voltando`
                para a volta animada. */}
            <div
              key={viradas}
              className={`mx-auto grid max-w-5xl grid-cols-5 gap-1.5 border-2 border-[#3B2A1E] bg-[#E9E1D3] p-2 sm:grid-cols-10 sm:gap-3 sm:p-4 ${mostrarFilmes ? 'dvd-virado' : ''} ${voltando ? 'dvd-voltando' : ''}`}
            >
              {ordemGrade(sorteio).map((enigma, index) => (
                <TileEnigma
                  key={enigma.id}
                  id={enigma.id}
                  index={index}
                  comando={enigma.comando}
                  ativo={selecionadoId === enigma.id}
                  alocado={alocados.has(enigma.id)}
                  virado={mostrarFilmes}
                  marcado={marcados.has(enigma.id)}
                  capa={CAPA_SRC[enigma.id]}
                  onClick={() => abrirEnigma(enigma.id)}
                  onPointerDown={(event) => iniciarArrasto(event, enigma.id)}
                  onPointerMove={(event) => moverArrasto(event, enigma.id)}
                  onPointerUp={(event) => soltarArrasto(event, enigma.id)}
                  onPointerCancel={cancelarArrasto}
                  onLostPointerCapture={() => {
                    if (gestoRef.current?.ativo) cancelarArrasto()
                  }}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={!todosMarcados}
                aria-pressed={mostrarFilmes}
                onClick={() => {
                  setViradas((n) => n + 1)
                  if (mostrarFilmes) {
                    setMostrarFilmes(false)
                    // A volta é animada, então o estado fica ligado durante a
                    // virada + o maior stagger; depois some e o quadrado fica
                    // no desenho vermelho, sem transform.
                    setVoltando(true)
                    window.setTimeout(
                      () => setVoltando(false),
                      FLIP_ANIM.duracaoMs + (ENIGMAS.length - 1) * FLIP_ANIM.staggerMs,
                    )
                  } else {
                    setMostrarFilmes(true)
                  }
                }}
                className="min-w-[240px] cursor-pointer border-[3px] border-[#3B2A1E] bg-[#E9E1D3] px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#3B2A1E] transition-colors hover:bg-[#DDD2BF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mostrarFilmes ? 'Fechar Filmes' : 'Mostrar Filmes'}
              </button>
              <p className="text-center text-xs font-medium text-neutral-500">
                {!todosMarcados
                  ? `Primeiro escolha um caminho nos ${ENIGMAS_ABERTOS.length} enigmas abertos (${marcas}/${ENIGMAS_ABERTOS.length}). O quadrado fica vermelho assim que você escolhe, e a estante só abre com os ${ENIGMAS_ABERTOS.length} respondidos.`
                  : mostrarFilmes
                    ? 'Abrindo um quadrado, o DVD aparece com o disco e o papel traz só a alternativa escolhida. Para trocar, feche os filmes.'
                    : `Estante liberada: arraste as caixas até os blocos. “Mostrar Filmes” vira os quadrados e mostra a capa de cada um.`}
              </p>
            </div>
          </div>

          {/*
            Cenário da locadora com a estante no miolo, que é a parede vazia da
            arte. O `prateleira.svg` é linha com `fill="none"` e sem `<rect>`,
            então não tem nada de fundo para cobrir a cena.

            Fica FORA do `div max-w-5xl px-4` da grade, de propósito: dentro dele a
            caixa pararia em 992px e o desenho ficaria com branco dos dois lados.
            Como filha direta da `section` — que é larga e não tem padding
            horizontal — `w-full` já é a largura inteira da página, e o desenho
            encosta nas duas bordas. Nada de `w-screen`: 100vw inclui a barra de
            rolagem e abriria rolagem horizontal.

            Com a caixa mais larga, a estante — dimensionada pela ALTURA — também
            cresce, e os slots ficam maiores e mais fáceis de acertar no arrasto.

            A caixa é 16:9 no desktop, que é a proporção da arte, então o
            `object-cover` não corta nada e aparecem o cliente e a atendente.
            No celular a caixa é mais alta (3:4) porque uma caixa 16:9 deixaria
            a estante com 18px de slot, inutilizável; aí o cover corta as
            pontas, que é onde estão as personagens, e sobra a parede do meio.

            A estante é dimensionada pela ALTURA da caixa, e não pela largura,
            para nunca estourar a cena; os slots crescem junto com a caixa.

            O brilho radial atrás dela não é decoração: a arte da estante é
            preta e a parede é terracota escura, então sem luz a estante some no
            fundo. O gradiente é mais forte no celular, onde a parede cropada
            ocupa quase toda a caixa.
          */}
          <div className="relative mt-12 aspect-[3/4] w-full overflow-hidden sm:aspect-[16/9]">

              <img src={FUNDO_ESTANTE_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 top-6 flex items-end justify-center sm:top-8">
                {/*
                  Brilho e placa saem do fluxo (`absolute`): como irmãos do
                  flex, eles viravam colunas ao lado da estante e a empurravam
                  para a direita. Só a estante fica no fluxo, e é ela que
                  centraliza.
                */}
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
                  <div
                    className="h-[86%] w-[62%] sm:w-[46%]"
                    style={{
                      background:
                        'radial-gradient(ellipse 62% 52% at 50% 46%, rgba(255,240,214,0.42), rgba(255,236,205,0.22) 52%, rgba(255,236,205,0) 78%)',
                    }}
                  />
                </div>
                <div className="absolute inset-x-0 top-0 mx-auto w-fit border-[3px] border-[#3B2A1E] bg-[#E9E1D3] px-6 py-1 text-center text-sm font-semibold uppercase tracking-[0.22em] text-[#3B2A1E] shadow-[3px_3px_0_#3B2A1E] sm:px-10 sm:py-1.5 sm:text-lg">
                  Paraíba
                </div>
                <div className="relative aspect-[1122/1402] h-[84%] sm:h-[88%]">
                  <img src={PRATELEIRA_SRC} alt="" className="absolute inset-0 h-full w-full" />
                {[1, 2, 3].map((bloco) => {
                  const fila = filaVisual(bloco, prateleiras[bloco])
                  const ocupados = fila.filter(Boolean).length
                  const teto = CAPACIDADES[bloco]
                  return (
                    <button
                      key={bloco}
                      type="button"
                      onClick={() => moverParaPrateleira(bloco)}
                      disabled={locked}
                      className={`absolute left-[9%] right-[9%] ${NIVEIS[bloco]} cursor-pointer transition-colors hover:bg-[#3B2A1E]/10 disabled:cursor-default ${
                        alvoBloco === bloco
                          ? 'bg-[#82181A]/15 outline outline-[3px] outline-[#82181A]'
                          : blocoAlerta === bloco
                            ? 'outline outline-2 outline-red-600'
                            : ''
                      }`}
                      aria-label={`Prateleira ${bloco}, até ${teto} enigmas`}
                    >
                      <span className="absolute left-0 top-0 -translate-y-[115%] bg-[#E9E1D3] px-1.5 text-[10px] font-medium uppercase tracking-wider text-[#3B2A1E]">
                        Bloco {bloco} · {ocupados}/{teto}
                      </span>
                      <div
                        className="grid h-full items-end gap-[1.5%]"
                        style={{ gridTemplateColumns: `repeat(${teto}, minmax(0, 1fr))` }}
                      >
                        {Array.from({ length: teto }, (_, i) => {
                          const id = fila[i]
                          const fixo = FIXO_IDS.has(id)
                          const alvo = alvoSlot === `${bloco}:${i}`
                          if (!id) {
                            return (
                              <span
                                key={`vazio-${i}`}
                                data-slot={`${bloco}:${i}`}
                                className={`aspect-[3/4] border-2 border-dashed transition-colors ${
                                  alvo ? 'border-[#82181A] bg-[#82181A]/20' : 'border-[#3B2A1E]/40 bg-[#E9E1D3]/25'
                                }`}
                              />
                            )
                          }
                          return (
                            <span
                              key={id}
                              data-slot={fixo ? undefined : `${bloco}:${i}`}
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation()
                                abrirEnigma(id, true)
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  abrirEnigma(id, true)
                                }
                              }}
                              aria-label={`Abrir o enigma ${id} na prateleira ${bloco}${fixo ? ' (fixo)' : ''}`}
                              className="relative block aspect-[3/4] cursor-pointer"
                            >
                              <img
                                src={
                                  mostrarFilmes
                                    ? CAPA_SRC[id]
                                    : marcados.has(id)
                                      ? RESPONDIDO_SRC
                                      : ICONE_SRC
                                }
                                alt={`Enigma ${id}`}
                                className={`pointer-events-none h-full w-full border-2 object-cover ${
                                  alvo ? 'border-[#82181A]' : 'border-[#3B2A1E]'
                                } ${selecionadoId === id ? 'ring-2 ring-[#82181A]' : ''}`}
                              />
                              {fixo && (
                                <span
                                  aria-hidden
                                  title="Fixo na estante"
                                  className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center bg-[#3B2A1E] text-white"
                                >
                                  <svg viewBox="0 0 16 16" width="9" height="9" fill="currentColor">
                                    <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3m-1.5 5V4a1.5 1.5 0 1 1 3 0v2z" />
                                  </svg>
                                </span>
                              )}
                              {!locked && !fixo && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    removerDaPrateleira(id)
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      removerDaPrateleira(id)
                                    }
                                  }}
                                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center bg-[#82181A] text-[10px] leading-none text-white"
                                  aria-label={`Tirar ${id} da prateleira`}
                                >
                                  ×
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </button>
                  )
                })}
                </div>
              </div>
            </div>
          {alertaCapacidade && (
            <p className="mx-auto mt-3 max-w-md px-4 text-center text-sm font-medium text-red-700">{alertaCapacidade}</p>
          )}

          <div className="mt-12 flex flex-col items-center justify-center gap-4 px-4">
            <button
              type="button"
              disabled={salvando || locked}
              onClick={() => salvar('rascunho')}
              className="min-w-[190px] cursor-pointer border-2 border-[#8A7007] bg-[#C5A00A] px-6 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-[#B08F09] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={salvando || (status !== 'entregue' && (!completa || locked))}
              onClick={entregarTarefa}
              className={`min-w-[210px] cursor-pointer border-2 px-6 py-3 text-sm font-medium uppercase text-white transition-colors disabled:cursor-not-allowed ${
                status === 'entregue'
                  ? 'border-[#0F4D00] bg-[#197400]'
                  : completa
                    ? 'border-[#0F4D00] bg-[#197400] hover:bg-[#156300]'
                    : 'border-neutral-400 bg-neutral-400'
              }`}
            >
              Entregar tarefa
            </button>
          </div>

          {mensagem && (
            <div className={`mx-auto mt-8 max-w-md rounded-lg p-4 text-center font-medium ${
              mensagem.startsWith('Responda os')
                || mensagem.includes('Coloque')
                || mensagem.includes('Clique')
                || mensagem.includes('Não foi')
                || mensagem.includes('Não pode')
                || mensagem.includes('já entregue')
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
            >
              {mensagem}
            </div>
          )}

          <div className="mt-10 space-y-2 px-4 text-center text-sm text-neutral-500">
            {atualizadoEm && status === 'rascunho' && (
              <p>{formatAudit(atualizadoEm, atualizadoPor, false)}</p>
            )}
            {atualizadoEm && status === 'entregue' && (
              <p>{formatAudit(atualizadoEm, atualizadoPor, true)}</p>
            )}
          </div>

          <div className="mt-12 flex justify-center">
            <Link href={resumoHref} className="text-sm font-medium text-neutral-500 transition-colors hover:text-[#82181A] hover:underline">
              Voltar para lista de questões
            </Link>
          </div>
        </section>

        <Footer />
      </div>

      {fantasma && (
        <span
          ref={fantasmaRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[70] block w-16 border-2 border-[#3B2A1E] opacity-90 shadow-[4px_4px_0_#3B2A1E]"
          style={{
            transform: `translate3d(${fantasma.x}px, ${fantasma.y}px, 0) translate(-50%, -50%) rotate(-6deg)`,
          }}
        >
          <img src={mostrarFilmes ? CAPA_SRC[fantasma.id] : ICONE_SRC} alt="" className="block w-full" draggable={false} />
        </span>
      )}

      {detalhe && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70 p-3 backdrop-blur-sm sm:gap-4 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Enigma ${detalhe.id}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) fecharEnigma()
          }}
        >
          <div
            className={`flex flex-col items-center gap-3 ${fechando ? 'dvd-saindo' : ''}`}
            style={{
              '--dvd-saida-capa': `${DVD_ANIM.saidaCapaMs}ms`,
              '--dvd-saida-centro': `${DVD_ANIM.saidaCentroMs}ms`,
              '--dvd-saida-parada': `${DVD_ANIM.saidaParadaMs}ms`,
              '--dvd-saida-palco': `${DVD_ANIM.saidaPalcoMs}ms`,
              '--dvd-desvio-fechado': desvioFechado,
            }}
          >
            <div style={{ width: larguraFaixa }}>
              <FaixaPergunta ref={faixaRef} texto={detalhe.comando} />
            </div>
            <div className="relative mt-1 shrink-0 sm:mt-2" style={{ width: larguraPalco }}>
              {/*
                A seleção mora dentro de cada papel, não numa camada sobre o
                palco: os dois papéis estão em sistemas de coordenadas
                diferentes, e cada botão usa o retângulo do seu próprio pai.

                `escolha` nulo com `fechando` esconde os botões no mesmo quadro
                em que a tampa começa a fechar. Sem isso a tinta ficava 1,2s
                pendurada no palco — um retângulo vinho do lado do DVD em pleno
                fundo escuro.

                `textoMostrado` já vem resolvido: em Mostrar Filmes é só a
                alternativa escolhida (e o lado direito é o disco, então não
                existe segundo papel).
              */}
              <DvdCaixa
                aberto={dvdAbertoDoDetalhe}
                fechado={mostrarFilmes ? CAPA_SRC[detalhe.id] : DVD_FECHADO_SRC}
                girarDisco={mostrarFilmes}
                textoEsquerda={textoMostrado.esquerda}
                textoDireita={textoMostrado.direita}
                escolha={
                  /* Sem `escolha` em Mostrar Filmes: sem quadrado de seleção
                     vermelho e sem clique. O modo é só para ver o que foi
                     escolhido; para trocar, fecha os filmes. */
                  fechando || mostrarFilmes
                    ? null
                    : {
                        esquerda: alternativas[0]?.valor,
                        direita: alternativas[1]?.valor,
                        valor: valorMarcado,
                        travado: locked || somenteLeitura,
                        onPick: escolherAlternativa,
                      }
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[#82181A]">Carregando...</div>}>
      <TarefaContent />
    </Suspense>
  )
}
