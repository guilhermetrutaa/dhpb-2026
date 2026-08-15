'use client'

import dynamic from 'next/dynamic'
import { useMemo, useRef, useState } from 'react'
import { Poppins } from 'next/font/google'
import { motion } from 'framer-motion'
import DemoFooter from '@/components/old-tasks/DemoFooter'
import DemoHeader from '@/components/old-tasks/DemoHeader'

const TravelMap = dynamic(() => import('@/components/old-tasks/TravelMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-red-950/20 flex items-center justify-center text-[#82181A] font-semibold">Carregando mapa...</div>,
})

const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

const DADOS_TAREFA = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  img: `/viagem-tempo/foto${index + 1}.svg`,
}))

const respostasIniciais = Array.from({ length: DADOS_TAREFA.length }, () => ({
  ano: null,
  local: null,
  status: 'pendente',
}))

function IntroScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <DemoHeader />
      <main className="flex-1 bg-cover bg-center" style={{ backgroundImage: 'url(/bg-dhpb.svg)' }}>
        <section className="min-h-[calc(100vh-88px)] flex items-center justify-center px-5 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white/95 border border-white/30 shadow-2xl p-7 md:p-10 max-w-2xl text-center"
          >
            <p className="text-[#82181A] font-semibold">3º DHPB · Fase 3</p>
            <h1 className="text-4xl md:text-5xl font-extrabold mt-2 text-[#82181A]">Viagem no Tempo</h1>
            <p className="text-lg md:text-xl mt-5 text-gray-700">
              Analise 10 fotografias históricas, estime o ano de cada uma e marque no mapa onde acredita que ela foi registrada.
            </p>

            <div className="text-left text-base md:text-lg mt-8 space-y-3 text-gray-700">
              <p>Use o controle de ano para estimar a época da imagem.</p>
              <p>Clique no mapa para marcar o local da fotografia.</p>
              <p>Você pode salvar rascunhos, entregar imagens individualmente e finalizar quando todas estiverem entregues.</p>
            </div>

            <motion.button
              onClick={onStart}
              className="bg-[#82181A] hover:bg-[#631214] transition-colors px-10 py-4 font-bold text-white shadow-lg text-xl mt-8"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Começar demo
            </motion.button>
          </motion.div>
        </section>
      </main>
      <DemoFooter />
    </div>
  )
}

export default function ViagemNoTempo() {
  const [showIntro, setShowIntro] = useState(true)
  const [rodadaAtual, setRodadaAtual] = useState(0)
  const [respostas, setRespostas] = useState(respostasIniciais)
  const [anoSelecionado, setAnoSelecionado] = useState(1950)
  const [localSelecionado, setLocalSelecionado] = useState(null)
  const [taskStatus, setTaskStatus] = useState('nao_respondida')
  const [message, setMessage] = useState('')
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const imageRef = useRef(null)
  const startDragPos = useRef({ x: 0, y: 0 })
  const mapRef = useRef(null)

  const dadosRodadaAtual = rodadaAtual < DADOS_TAREFA.length ? DADOS_TAREFA[rodadaAtual] : null
  const isCurrentRoundSubmitted = taskStatus === 'entregue' || respostas[rodadaAtual]?.status === 'entregue'
  const areAllImagesSubmitted = respostas.length === DADOS_TAREFA.length && respostas.every((resposta) => resposta.status === 'entregue')

  const progressWidth = useMemo(() => {
    if (rodadaAtual >= DADOS_TAREFA.length) return 100
    return ((rodadaAtual + 1) / DADOS_TAREFA.length) * 100
  }, [rodadaAtual])

  const notify = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3200)
  }

  const loadRound = (index, nextRespostas = respostas) => {
    const resposta = nextRespostas[index]
    setAnoSelecionado(resposta?.ano || 1950)
    setLocalSelecionado(resposta?.local || null)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const goToRound = (index) => {
    if (index < 0 || index > DADOS_TAREFA.length) return
    setRodadaAtual(index)
    if (index < DADOS_TAREFA.length) {
      loadRound(index)
    }
  }

  const saveCurrentImage = (status) => {
    if (taskStatus === 'entregue') return
    if (!localSelecionado || !anoSelecionado || rodadaAtual >= DADOS_TAREFA.length) {
      notify('Selecione um ano e marque um local no mapa antes de salvar.')
      return
    }

    const novasRespostas = respostas.map((resposta, index) =>
      index === rodadaAtual
        ? { id: DADOS_TAREFA[index].id, ano: anoSelecionado, local: localSelecionado, status }
        : resposta
    )

    setRespostas(novasRespostas)
    setTaskStatus('em rascunho')
  }

  const saveTaskDraft = () => {
    if (taskStatus === 'entregue') return

    if (rodadaAtual < DADOS_TAREFA.length && localSelecionado && anoSelecionado && respostas[rodadaAtual]?.status !== 'entregue') {
      const novasRespostas = respostas.map((resposta, index) =>
        index === rodadaAtual
          ? { id: DADOS_TAREFA[index].id, ano: anoSelecionado, local: localSelecionado, status: 'rascunho' }
          : resposta
      )
      setRespostas(novasRespostas)
    }

    setTaskStatus('em rascunho')
    notify('Tarefa salva como rascunho nesta demonstração.')
  }

  const navigateToFinalScreen = () => {
    if (!areAllImagesSubmitted) {
      notify('Entregue todas as 10 imagens antes de ir para a tela final.')
      return
    }
    setRodadaAtual(DADOS_TAREFA.length)
  }

  const finalizeTask = () => {
    setTaskStatus('entregue')
    setShowConfirmationModal(false)
    notify('Tarefa entregue nesta demonstração.')
  }

  const resetDemo = () => {
    setRespostas(respostasIniciais)
    setTaskStatus('nao_respondida')
    setRodadaAtual(0)
    setAnoSelecionado(1950)
    setLocalSelecionado(null)
    setShowConfirmationModal(false)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
    notify('Demonstração reiniciada.')
  }

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.max(1, Math.min(newZoom, 5))
    setImageZoom(clampedZoom)
    if (clampedZoom === 1) {
      setImagePosition({ x: 0, y: 0 })
    }
  }

  const handleWheel = (event) => {
    event.preventDefault()
    handleZoomChange(event.deltaY > 0 ? imageZoom - 0.1 : imageZoom + 0.1)
  }

  const handleMouseDown = (event) => {
    if (imageZoom <= 1) return
    event.preventDefault()
    setIsDragging(true)
    startDragPos.current = {
      x: event.clientX - imagePosition.x,
      y: event.clientY - imagePosition.y,
    }
  }

  const handleMouseMove = (event) => {
    if (!isDragging || imageZoom <= 1) return
    event.preventDefault()

    const imageEl = imageRef.current
    const newX = event.clientX - startDragPos.current.x
    const newY = event.clientY - startDragPos.current.y

    if (!imageEl) {
      setImagePosition({ x: newX, y: newY })
      return
    }

    const maxX = (imageEl.offsetWidth * imageZoom - imageEl.offsetWidth) / 2
    const maxY = (imageEl.offsetHeight * imageZoom - imageEl.offsetHeight) / 2
    setImagePosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const imageTransform = `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`

  if (showIntro) {
    return (
      <div className={poppins.className}>
        <IntroScreen onStart={() => setShowIntro(false)} />
      </div>
    )
  }

  if (rodadaAtual === DADOS_TAREFA.length) {
    return (
      <div className={poppins.className}>
        <div className="min-h-screen bg-white text-black flex flex-col">
          <DemoHeader />
          <main className="flex-1 bg-cover bg-center flex items-center justify-center px-5 py-12" style={{ backgroundImage: 'url(/bg-dhpb.svg)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/95 shadow-2xl p-8 max-w-xl text-center">
              <h1 className="text-4xl font-bold text-[#82181A] mb-4">Rodadas concluídas</h1>
              <p className="text-lg text-gray-700 mb-8">
                Todas as imagens foram entregues nesta demonstração. Finalize a tarefa para bloquear as respostas localmente.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={() => goToRound(0)} className="border-2 border-[#82181A] text-[#82181A] font-bold py-3 px-6">
                  Revisar imagens
                </button>
              </div>
            </motion.div>
          </main>
          <DemoFooter />
        </div>

        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 shadow-2xl max-w-md text-center">
              <h2 className="text-2xl font-bold mb-4 text-[#82181A]">Confirmar entrega</h2>
              <p className="mb-6 text-gray-700">Depois da entrega, esta demonstração ficará bloqueada até ser reiniciada.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={finalizeTask} className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3">
                  Sim, entregar
                </button>
                <button onClick={() => setShowConfirmationModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold px-6 py-3">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={poppins.className}>
      <div className="min-h-screen bg-white text-black flex flex-col">
        <DemoHeader />

        <main className="flex-1 bg-cover bg-center" style={{ backgroundImage: 'url(/bg-dhpb.svg)' }}>
          <section className="max-w-7xl mx-auto px-5 py-8 md:py-10 text-white">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <p className="text-white/75 font-semibold">3º DHPB · Fase 3</p>
                <h1 className="text-3xl md:text-5xl font-bold">Viagem no Tempo</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={resetDemo} className="bg-white text-[#82181A] px-5 py-3 font-bold">
                  Reiniciar demo
                </button>
              </div>
            </div>

            <div className="bg-white/95 text-black p-4 md:p-5 shadow-xl mb-6">
              <div className="w-full bg-red-100 h-2.5 mb-3">
                <div className="bg-[#82181A] h-2.5 transition-all duration-500" style={{ width: `${progressWidth}%` }} />
              </div>

              <div className="text-center text-sm font-semibold mb-4">
                Fotografia {rodadaAtual + 1} de {DADOS_TAREFA.length} · Status da tarefa: {taskStatus === 'entregue' ? 'Entregue' : taskStatus === 'em rascunho' ? 'Rascunho' : 'Não respondida'}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => goToRound(rodadaAtual - 1)} disabled={rodadaAtual === 0} className="px-3 py-2 bg-[#82181A] text-white text-sm disabled:bg-gray-400">
                  Anterior
                </button>

                {DADOS_TAREFA.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToRound(index)}
                    className={`w-9 h-9 text-sm font-bold border-2 transition-transform hover:scale-105 ${index === rodadaAtual ? 'ring-2 ring-[#82181A] ring-offset-2' : ''} ${
                      respostas[index]?.status === 'entregue'
                        ? 'bg-green-700 border-green-700 text-white'
                        : respostas[index]?.status === 'rascunho'
                          ? 'bg-yellow-500 border-yellow-500 text-black'
                          : 'bg-white border-[#82181A] text-[#82181A]'
                    }`}
                    title={`Imagem ${index + 1}: ${respostas[index]?.status || 'pendente'}`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button onClick={() => goToRound(rodadaAtual + 1)} disabled={rodadaAtual >= DADOS_TAREFA.length - 1} className="px-3 py-2 bg-[#82181A] text-white text-sm disabled:bg-gray-400">
                  Próxima
                </button>
              </div>
            </div>

            <motion.div
              key={rodadaAtual}
              className="bg-white/95 text-black shadow-2xl p-4 md:p-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <div className="overflow-hidden w-full aspect-[4/3] bg-gray-900" onWheel={handleWheel}>
                  <motion.div
                    ref={imageRef}
                    className={`w-full h-full ${imageZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
                    onMouseDown={handleMouseDown}
                  >
                    <img
                      src={dadosRodadaAtual.img}
                      alt={`Fotografia histórica ${rodadaAtual + 1}`}
                      className="object-cover w-full h-full"
                      style={{ transform: imageTransform, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
                    />
                  </motion.div>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button onClick={() => handleZoomChange(imageZoom - 0.2)} className="text-white text-lg font-bold w-8 h-8 bg-black/65 hover:bg-black/85" title="Diminuir zoom">-</button>
                  <button onClick={() => handleZoomChange(imageZoom + 0.2)} className="text-white text-lg font-bold w-8 h-8 bg-black/65 hover:bg-black/85" title="Aumentar zoom">+</button>
                  <button onClick={() => setIsImageFullscreen(true)} className="text-white text-xs font-bold px-3 h-8 bg-black/65 hover:bg-black/85" title="Tela cheia">Tela cheia</button>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div ref={mapRef} className="w-full h-[320px] overflow-hidden shadow-lg relative">
                  <TravelMap markerPosition={localSelecionado} setMarker={setLocalSelecionado} key={rodadaAtual} />
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-3 text-[#82181A]">Ano selecionado</h2>
                  <input
                    type="range"
                    min="1500"
                    max="2025"
                    value={anoSelecionado || 1950}
                    onChange={(event) => setAnoSelecionado(parseInt(event.target.value))}
                    className="w-full accent-[#82181A]"
                    disabled={isCurrentRoundSubmitted}
                  />
                  <p className="text-4xl mt-2 font-bold text-[#82181A]">{anoSelecionado}</p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col md:flex-row justify-center items-stretch gap-3 w-full">
              <motion.button
                onClick={() => saveCurrentImage('rascunho')}
                className="bg-yellow-600 hover:bg-yellow-700 px-5 py-3 font-bold text-white shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!localSelecionado || !anoSelecionado || isCurrentRoundSubmitted}
              >
                Salvar rascunho da imagem
              </motion.button>

              <motion.button
                onClick={() => saveCurrentImage('entregue')}
                className="bg-green-700 hover:bg-green-800 px-5 py-3 font-bold text-white shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!localSelecionado || !anoSelecionado || isCurrentRoundSubmitted}
              >
                {isCurrentRoundSubmitted ? 'Imagem entregue' : 'Entregar imagem'}
              </motion.button>

              <motion.button
                onClick={navigateToFinalScreen}
                className={`px-5 py-3 font-bold text-white shadow-lg ${areAllImagesSubmitted ? 'bg-[#82181A] hover:bg-[#631214]' : 'bg-gray-500 cursor-not-allowed'}`}
                whileHover={areAllImagesSubmitted ? { scale: 1.02 } : {}}
                whileTap={areAllImagesSubmitted ? { scale: 0.98 } : {}}
                disabled={!areAllImagesSubmitted}
              >
                Ir para entrega final
              </motion.button>
            </div>

            {message && (
              <div className="fixed bottom-5 right-5 bg-[#82181A] text-white py-3 px-5 shadow-xl font-semibold z-40">
                {message}
              </div>
            )}
          </section>
        </main>

        <DemoFooter />
      </div>

      {isImageFullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <div className="flex items-center gap-2 bg-white/20 p-2">
              <button onClick={() => handleZoomChange(imageZoom - 0.2)} className="text-white text-2xl font-bold w-9 h-9 bg-black/60 hover:bg-black/85">-</button>
              <span className="text-white font-semibold min-w-12 text-center">{Math.round(imageZoom * 100)}%</span>
              <button onClick={() => handleZoomChange(imageZoom + 0.2)} className="text-white text-2xl font-bold w-9 h-9 bg-black/60 hover:bg-black/85">+</button>
            </div>
            <button onClick={() => setIsImageFullscreen(false)} className="text-white text-4xl hover:text-red-400" aria-label="Fechar tela cheia">
              ×
            </button>
          </div>
          <div className="w-full h-full overflow-hidden" onWheel={handleWheel}>
            <motion.div
              ref={imageRef}
              className={`w-full h-full flex items-center justify-center ${imageZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
            >
              <img
                src={dadosRodadaAtual.img}
                alt={`Fotografia histórica ${rodadaAtual + 1} em tela cheia`}
                style={{ transform: imageTransform, objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
              />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
