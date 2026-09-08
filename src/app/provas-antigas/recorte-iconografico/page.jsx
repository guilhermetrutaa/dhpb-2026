'use client'

import { useMemo, useState } from 'react'
import { Inter, Merriweather } from 'next/font/google'
import DemoFooter from '@/components/old-tasks/DemoFooter'
import DemoHeader from '@/components/old-tasks/DemoHeader'

const inter = Inter({ subsets: ['latin'] })
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'] })

const opcoesModal = [
  { id: 'A', texto: 'Um rio, próximo a região da Baia da Traição (nome dado pelo colonizador) demonstra como o processo de povoamento indígenas foi realizado naquela região e a área foi palco de disputas.' },
  { id: 'B', texto: 'Uma nova batalha ocorreu na costa da Paraíba em 14 de janeiro de 1640.' },
  { id: 'C', texto: 'A representação de uma criança é vista entre os adultos.' },
  { id: 'D', texto: 'Um homem bem vestido, trajando botas, meias, casaca vermelha, chapéu e espada, lembra um fidalgo holandês que comanda o grupo.' },
  { id: 'E', texto: 'Um conjunto de pessoas, que lembram indígenas, sem camisas, pés descalços e segurando armas de fogo compõem parte de um exército.' },
  { id: 'F', texto: 'Um grupo de indígenas, segurando arcos e flechas caminham e um deles ostenta um símbolo.' },
  { id: 'G', texto: 'Navios de guerra com bandeira caracterizam as disputas políticas e militares para o domínio do território.' },
  { id: 'H', texto: 'O sino, símbolo maior da catequese, foi usado para chamar os fiéis à oração e às cerimônias litúrgicas, anunciando e celebrando a fé que a cruz simbolizava.' },
  { id: 'I', texto: 'Uma procissão agradece a Nossa Senhora das Neves a derrota dos invasores.' },
  { id: 'J', texto: 'Um conjunto de pessoas, que podem ser escravizados, por estarem de pés descalços e sem camisas, seguram armas de fogo.' },
  { id: 'K', texto: 'Em 17 de janeiro de 1640, houve confrontos nessa altitude e os espanhóis fugiram.' },
  { id: 'L', texto: 'Uma batalha naval é travada no litoral da Paraíba e um navio vai a pique depois de atacado.' },
  { id: 'M', texto: 'Uma cerca de proteção feita com varas pode ser percebida próximo a construções.' },
  { id: 'N', texto: 'Aspectos do relevo, hidrografia e nomes indígenas e europeus foram representados na imagem.' },
  { id: 'O', texto: 'Brasões de identificação das capitanias da Paraíba e Rio Grande aparecem destacando a produção de cana de açúcar e a homenagem a EMA, símbolo da capitania.' },
  { id: 'P', texto: 'Construções arquitetônicas com cobertura em telha de barro e palhas pode diferenciar o espaço religioso das casas habitacionais.' },
  { id: 'Q', texto: 'Um emblema identificando as prefeituras da Paraíba e Rio Grande aparecem no canto da imagem.' },
  { id: 'R', texto: 'Um guerreiro holandês, com arco e flechas, se despede de sua família.' },
  { id: 'S', texto: 'Vegetações típicas do litoral podem ser encontradas demonstrando a variedade da flora no século XVII.' },
  { id: 'T', texto: 'A representação da Coroa e das assas de anjos, nos brasões da Paraíba e Rio Grande, demonstram que essas capitanias foram criadas em 1534 e 1536 por cartas régias.' },
  { id: 'U', texto: 'Os navios que aparecem na imagem fazem parte dos dois confrontos cruciais, travados na costa paraibana, durante a expulsão dos holandeses, pelo exército luso-espanhol.' },
  { id: 'V', texto: 'A fortaleza de Marguerita, atual Santa Catarina, e a cidade de João Pessoa, chamada de Frederica foram retratadas na foz do rio Paraíba.' },
  { id: 'W', texto: 'Em 14 de janeiro 1640 ocorreu uma batalha pela terceira vez na Paraíba nesta altura, com a derrota holandesa.' },
  { id: 'X', texto: 'A região onde está localizada a igreja de Nossa Senhora da Guia, que deu origem a fortaleza que protegia a cidade de Frederica, aparece na imagem com o nome de Marguerita.' },
  { id: 'Y', texto: 'Elementos do cristianismo e de controle social foram retratados pelo artista na pintura.' },
  { id: 'Z', texto: 'Mulheres carregam cestos com roupas na cabeça.' },
  { id: 'AA', texto: 'Um texto demonstra que em "13 de janeiro do ano 1640 a frota holandesa entrou em conflito uma segunda vez com os espanhóis, em frente ao Cabo Albi ou Blanco, nesta latitude."' },
  { id: 'BB', texto: 'Representação gráfica que indica as direções e os pontos de orientação que pode ser usada em mapas e bússolas para a navegação, orientação e cartografia, ajudando a localizar e direcionar com mais precisão.' },
  { id: 'CC', texto: 'Esse brasão remete ao período de unificação das duas capitanias, durante o Período holandês.' },
]

const coordenadasPontos = [
  { top: '46%', left: '70%' },
  { top: '32%', left: '6%' },
  { top: '13%', left: '60%' },
  { top: '10%', left: '19%' },
  { top: '30%', left: '87%' },
  { top: '29%', left: '83%' },
  { top: '28%', left: '71%' },
  { top: '24%', left: '63%' },
  { top: '16%', left: '69%' },
  { top: '95%', left: '20%' },
  { top: '87%', left: '57%' },
  { top: '92%', left: '87%' },
  { top: '82%', left: '25%' },
  { top: '73%', left: '38%' },
  { top: '91%', left: '32%' },
  { top: '92%', left: '52%' },
  { top: '78%', left: '75%' },
  { top: '20%', left: '80%' },
  { top: '37%', left: '33%' },
  { top: '87%', left: '75.5%' },
]

const pontosIniciais = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  estado: 'cinza',
  opcaoSelecionada: null,
  texto: '',
}))

export default function RecorteIconografico() {
  const [modalAberto, setModalAberto] = useState(false)
  const [pontoSelecionado, setPontoSelecionado] = useState(null)
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('')
  const [pontos, setPontos] = useState(pontosIniciais)
  const [taskStatus, setTaskStatus] = useState('nao_respondida')
  const [showMessage, setShowMessage] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)

  const pontosRespondidos = useMemo(() => pontos.filter((ponto) => ponto.estado !== 'cinza'), [pontos])
  const todosRascunho = pontos.length > 0 && pontos.every((ponto) => ponto.estado === 'vermelho')

  const abrirModal = (pontoId) => {
    if (taskStatus === 'entregue') return

    const ponto = pontos.find((item) => item.id === pontoId)
    if (ponto?.estado === 'verde') return

    setPontoSelecionado(pontoId)
    setOpcaoSelecionada(ponto?.opcaoSelecionada || '')
    setZoomLevel(1)
    setModalAberto(true)
  }

  const confirmarRascunho = () => {
    if (!opcaoSelecionada || !pontoSelecionado) return

    const opcaoTexto = opcoesModal.find((opcao) => opcao.id === opcaoSelecionada)?.texto || ''

    setPontos((prev) =>
      prev.map((ponto) =>
        ponto.id === pontoSelecionado
          ? { ...ponto, estado: 'vermelho', opcaoSelecionada, texto: opcaoTexto }
          : ponto
      )
    )
    setTaskStatus('em rascunho')
    setModalAberto(false)
    setOpcaoSelecionada('')
  }

  const entregarTodos = () => {
    if (!window.confirm('Tem certeza que deseja entregar todos os pontos desta demonstração?')) return

    setPontos((prev) => prev.map((ponto) => ({ ...ponto, estado: 'verde' })))
    setTaskStatus('entregue')
    setShowMessage('Tarefa entregue nesta demonstração!')
    setTimeout(() => setShowMessage(''), 3000)
  }

  const salvarRascunho = () => {
    setTaskStatus('em rascunho')
    setShowMessage('Rascunho mantido nesta demonstração.')
    setTimeout(() => setShowMessage(''), 3000)
  }

  const resetarDemo = () => {
    setPontos(pontosIniciais)
    setTaskStatus('nao_respondida')
    setShowMessage('Demonstração reiniciada.')
    setTimeout(() => setShowMessage(''), 2500)
  }

  return (
    <div className={inter.className}>
      <div className="min-h-screen bg-white text-black flex flex-col">
        <DemoHeader />

        <main className="flex-1 text-[#000]">
          <section className="max-w-7xl mx-auto px-5 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
              <div>
                <p className="text-[#82181A] font-semibold">3º DHPB · Fase 2</p>
                <h1 className="text-3xl md:text-5xl font-bold text-[#82181A] mt-2">Recorte Iconográfico</h1>
                <p className={`${merriweather.className} text-[#5B5B5B] text-lg md:text-xl mt-3 max-w-3xl`}>
                  Praefecturae de Paraiba, et Rio Grande · Frans Post, 1647.
                </p>
              </div>
            </div>

            <div className="relative mx-auto mt-10 max-w-5xl overflow-x-auto">
              <div className="relative inline-block min-w-[720px] md:min-w-0">
                <img
                  src="/MIGALHAS.svg"
                  alt="Mapa Praefecturae de Paraiba, et Rio Grande"
                  className="w-full max-w-5xl border-2 border-gray-300 bg-white"
                />

                {coordenadasPontos.map((coords, index) => {
                  const ponto = pontos[index]
                  const corPonto = ponto.estado === 'verde' ? 'bg-green-600' : ponto.estado === 'vermelho' ? 'bg-red-600' : 'bg-gray-500'

                  return (
                    <button
                      key={ponto.id}
                      className={`absolute w-7 h-7 rounded-full ${corPonto} text-white flex items-center justify-center text-xs font-bold -translate-x-1/2 -translate-y-1/2 transition-transform ${taskStatus === 'entregue' ? 'cursor-default' : 'hover:scale-110'}`}
                      style={{ top: coords.top, left: coords.left }}
                      onClick={() => abrirModal(ponto.id)}
                      title={taskStatus === 'entregue' ? 'Demonstração entregue' : 'Selecionar opção'}
                    >
                      {ponto.id}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="max-w-5xl mx-auto mt-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Respostas selecionadas</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={resetarDemo} className="border-2 border-[#82181A] text-[#82181A] px-6 py-3 font-bold">
                    Reiniciar demo
                  </button>
                </div>
              </div>

              {pontosRespondidos.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum ponto foi respondido ainda.</p>
              ) : (
                <div className="space-y-4">
                  {pontosRespondidos.map((ponto) => (
                    <div key={ponto.id} className={`p-5 border-l-4 ${ponto.estado === 'verde' ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`w-7 h-7 rounded-full ${ponto.estado === 'verde' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center justify-center text-sm font-bold`}>
                          {ponto.id}
                        </span>
                        <span className="font-bold">Opção {ponto.opcaoSelecionada}</span>
                        <span className="ml-auto text-sm font-semibold px-3 py-1 bg-white">
                          {ponto.estado === 'verde' ? 'Entregue' : 'Rascunho'}
                        </span>
                      </div>
                      <p className="text-gray-700">{ponto.texto}</p>
                    </div>
                  ))}
                </div>
              )}

              {todosRascunho && taskStatus !== 'entregue' && (
                <div className="mt-8 flex justify-center">
                  <button onClick={entregarTodos} className="bg-green-700 text-white font-bold py-3 px-8 hover:bg-green-800 transition-colors">
                    Entregar todos os pontos
                  </button>
                </div>
              )}

              {showMessage && (
                <div className="fixed bottom-5 right-5 bg-[#82181A] text-white py-3 px-5 shadow-xl font-semibold z-40">
                  {showMessage}
                </div>
              )}
            </div>
          </section>
        </main>

        <DemoFooter />
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex text-[#000] items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            <div className="p-5 md:p-7">
              <div className="flex justify-between items-center gap-4 mb-5">
                <h3 className="text-2xl font-bold text-gray-900">Ponto {pontoSelecionado}</h3>
                <button onClick={() => setModalAberto(false)} className="text-gray-500 hover:text-[#82181A] text-3xl leading-none" aria-label="Fechar">
                  ×
                </button>
              </div>

              <div className="mb-6 flex flex-col items-center">
                <div className="w-full h-80 overflow-auto border border-gray-300 mb-3 flex items-center justify-center bg-gray-50">
                  <img
                    src={`/recortes/recorte${pontoSelecionado}.svg`}
                    alt={`Recorte do ponto ${pontoSelecionado}`}
                    className="transition-transform duration-200 ease-in-out"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  />
                </div>
                <div className="flex items-center gap-3 w-full max-w-md">
                  <button onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))} className="px-3 py-1 bg-gray-200">-</button>
                  <input type="range" min="0.5" max="3" step="0.1" value={zoomLevel} onChange={(event) => setZoomLevel(parseFloat(event.target.value))} className="w-full accent-[#82181A]" />
                  <button onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.1))} className="px-3 py-1 bg-gray-200">+</button>
                  <button onClick={() => setZoomLevel(1)} className="text-xs px-3 py-1 border">100%</button>
                </div>
              </div>

              <p className="text-gray-700 mb-3 font-semibold">Selecione uma opção:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
                {opcoesModal.map((opcao) => (
                  <button
                    key={opcao.id}
                    className={`p-3 text-left border transition-colors ${opcaoSelecionada === opcao.id ? 'bg-red-100 border-[#82181A]' : 'border-gray-300 hover:bg-gray-100'}`}
                    onClick={() => setOpcaoSelecionada(opcao.id)}
                  >
                    <span className="font-bold">{opcao.id}:</span> {opcao.texto}
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={confirmarRascunho} disabled={!opcaoSelecionada} className="px-6 py-3 bg-[#82181A] text-white font-bold disabled:opacity-50">
                  Deixar em rascunho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
