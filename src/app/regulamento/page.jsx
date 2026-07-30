'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export default function Page() {
  const { authUser, userData } = useAuth()
  const router = useRouter()

  const handleGoToHome = () => {
    if (userData?.tipo === 'professor') {
      router.push('/home-professor')
    } else {
      router.push('/home')
    }
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#fff] text-[#000] flex flex-col'>
        <header className='flex flex-col lg:flex-row justify-around items-center pt-5 pb-5 gap-6 px-4'>
          <div>
            <Image
              src="/logo.svg"
              width={100}
              height={100}
              alt="Logo"
            />
          </div>

          <nav>
            <ul className='flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base'>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><Link href="/contato">Contato</Link></li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><Link href="/provas-antigas">Provas Antigas</Link></li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><Link href="/biblioteca">Biblioteca</Link></li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><a href="/calendario">Calendário</a></li>
              <li className='hover:text-[#82181A] hover:underline transition-colors'><Link href="/regulamento">Regulamento</Link></li>
            </ul>
          </nav>

          <div className='flex flex-col sm:flex-row items-center gap-5'>
            <div className='flex gap-4'>
              <div className='cursor-pointer hover:text-[#82181A] transition-colors'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              </div>
              <div className='cursor-pointer hover:text-[#82181A] transition-colors'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16">
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                </svg>
              </div>
              <div className='cursor-pointer hover:text-[#82181A] transition-colors'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-youtube" viewBox="0 0 16 16">
                  <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/>
                </svg>
              </div>
            </div>

            {authUser ? (
              <button
                onClick={handleGoToHome}
                className='border-[#82181A] border-[3px] text-[#82181A] font-medium px-6 py-2 hover:bg-[#82181A] hover:text-[#fff] transition-colors cursor-pointer whitespace-nowrap'
              >
                Ir para home
              </button>
            ) : (
              <button className='border-[#82181A] border-[3px] text-[#82181A] font-medium px-6 py-2 hover:bg-[#82181A] hover:text-[#fff] transition-colors cursor-pointer whitespace-nowrap'>
                <a href="/login">Login & Cadastro</a>
              </button>
            )}
          </div>
        </header>

        <main className='flex-1' style={{ backgroundImage: 'url(/bg-dhpb.svg)' }}>
          <section className='max-w-4xl mx-auto py-16 px-6'>
            <div className='bg-black/80 p-6 md:p-10 rounded-xl text-white/90 text-sm md:text-base leading-relaxed space-y-6'>
              
              <div className="text-center border-white/20 pb-4">
                <div className='flex justify-center items-center pb-5'>
                  <Image
                    src="/logo-gov2.svg"
                    width={200}
                    height={200}
                    alt="Picture of the author"
                  />
                </div>

                <p className="font-semibold text-white uppercase text-xs tracking-wider">MINISTÉRIO DA EDUCAÇÃO</p>
                <p className="font-semibold text-white uppercase text-xs tracking-wider">SECRETARIA DE EDUCAÇÃO PROFISSIONAL E TECNOLÓGICA</p>
                <p className="font-semibold text-white uppercase text-xs tracking-wider">INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DA PARAÍBA</p>
                <p className="font-semibold text-white uppercase text-xs tracking-wider">NÚCLEO DE EXTENSÃO E PESQUISA EM OLIMPÍADA DE HISTÓRIA DA PARAÍBA - NEPOHP</p>
                <p className="text-white/60 text-xs mt-1">Av. João da Mata, 256 - Jaguaribe, João Pessoa - PB, 58015-020 - www.ifpb.edu.br</p>
              </div>

              <div className="text-center py-2">
                <h2 className='text-xl md:text-2xl font-bold text-white'>EDITAL Nº 01/2026 PRE; PREX; PRP/REITORIA-IFPB</h2>
                <p className='text-md font-bold text-white mt-1'>Regulamento</p>
                <h3 className='text-lg font-semibold text-[#f87171] mt-1'>4º DESAFIO EM HISTÓRIA DA PARAÍBA – 4º DHPB</h3>
              </div>

              <div className="text-left py-2">
                <p className='text-md font-bold text-white mt-1'>DHPB 2026 - EDITAL</p>
              </div>

              <div>
                <p className='mb-4'>
                  A Comissão Organizadora do Desafio em História da Paraíba, instituída pela Portaria 433/2026 - REITORIA/IFPB, de 26 de março de 2026. vinculada às Pró-reitorias de Ensino, de Pesquisa, Inovação e Pós-graduação, e de Extensão e Cultura do Instituto Federal de Educação Ciência e Tecnologia do Estado da Paraíba - IFPB, no uso de suas atribuições, torna pública a abertura de inscrições para a 4ª edição do Desafio em História da Paraíba - 4º DHPB, de acordo com as disposições estipuladas neste Edital, que se coloca em observância ao Regulamento Oficial do 4º DHPB.
                </p>
                <p className='font-semibold text-white'>O 4º DHPB conta com o apoio das seguintes instituições:</p>
                <ul className='list-disc list-inside space-y-1 mt-2 text-white/80'>
                  <p>a) Secretaria de Estado da Ciência, Tecnologia, Inovação e Educação Superior da Paraíba (SECTIES);</p>
                  <p>b) Secretaria de Estado da Educação da Paraíba (SEE);</p>
                </ul>
              </div>

              <hr className="border-white/20" />

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>1. DO OBJETO</h3>
                <p>
                  O 4º DHPB é uma Olimpíada de Conhecimento, voltada ao incentivo à pesquisa com finalidade educacional e cultural, organizada pelo Instituto Federal da Paraíba - IFPB, que será desenvolvida de forma híbrida, composta por fases online, através do site https://dhpb.ifpb.edu.br/ e uma fase final presencial, que envolverá professores/as da disciplina de História - que atuarão como orientadores/as de equipes e estudantes regularmente matriculados em escolas públicas das redes municipais, estadual e federais, e privadas de níveis de Ensinos Fundamental II ( 8º e 9º anos); Médio (regular e profissionalizante integrado), além da modalidade de Educação de Jovens e Adultos (EJA) de todo o Estado da Paraíba.
                </p>
                <p className='mt-3'>
                  O DHPB tem foco no estímulo ao desenvolvimento sociocultural e educacional do estado da Paraíba, através do incentivo à pesquisa, contato dos estudantes com fontes históricas, conhecimento e apropriação de elementos da cultura e realidade paraibana. Desse modo, por meio da abordagem de questões de múltipla escolha e atividades subjetivas, as equipes irão explorar os costumes, personagens, elementos históricos, geográficos, filosóficos, literários, sociais, econômicos e ambientais do estado da Paraíba.
                </p>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>2. OBJETIVOS</h3>
                <h4 className='font-semibold text-white mt-2'>2.1. OBJETIVO GERAL</h4>
                <p>
                  Estimular a formação integral de jovens e adultos paraibanos por meio da pesquisa e utilização de Tecnologias Digitais de Informação e Comunicação (TDIC), por meio do incentivo à integração cultural, à sociabilidade e à inclusão, contribuindo para o conhecimento da realidade e o desenvolvimento da cidadania, levando estudantes e professores/as paraibanos, de forma lúdica, a refletir sobre a História paraibana, abrindo-lhes o horizonte do conhecimento teórico da cultura, das paisagens, da economia, da literatura, da História, da sociedade e do meio ambiente do estado da Paraíba.
                </p>

                <h4 className='font-semibold text-white mt-3'>2.2. OBJETIVOS ESPECÍFICOS</h4>
                <ul className='list-disc list-inside space-y-2 mt-2 text-white/80'>
                  <p>2.2.1) Incentivar a pesquisa, a compreensão e o conhecimento da História, cultura, economia e meio ambiente do estado da Paraíba, oferecendo aos estudantes uma possibilidade de apropriação do contexto histórico social no qual estão inseridos;</p>
                  <p>2.2.2) Desenvolver a habilidade de elaborar conhecimentos em temáticas regionais e a valorizar o patrimônio histórico e cultural, aspectos sociais e econômicos, personagens, riquezas e paisagens paraibanas;</p>
                  <p>2.2.3) Promover o contato de estudantes com fontes documentais diversas;</p>
                  <p>2.2.4) Fomentar a utilização de ambientes virtuais, para além das redes sociais, com uso de Tecnologias Digitais da Informação e Comunicação (TDICs) para a integração com elementos do passado e do presente do estado em que vivem;</p>
                  <p>2.2.5) Estimular uma cultura de integração, trabalho em equipe, apoio, solidariedade e estímulo para a valorização e construção de uma identidade paraibana diversa;</p>
                  <p>2.2.6) Promover práticas educativas de capacitação e formação continuada para professores/as das disciplinas de História que atuam em escolas públicas das redes municipal, estadual, federal e privadas da Educação Básica do Estado da Paraíba.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>3. DO REGULAMENTO</h3>
                <ul className='list-disc list-inside space-y-1 text-white/80'>
                  <p>3.1) A participação no 4º DHPB está condicionada à leitura e aceitação do Regulamento Oficial que rege o certame.</p>
                  <p>3.2) O Regulamento Oficial do 4º DHPB é parte indissociável deste Edital.</p>
                  <p>3.3) O Regulamento Oficial do 4º DHPB será disponibilizado no site oficial do IFPB (https://www.ifpb.edu.br) e na área da Plataforma do Desafio https://dhpb.ifpb.edu.br/</p>
                  <p>3.4) Só realize sua inscrição após a leitura atenta e concordância com todos os itens constantes no Regulamento Oficial do 4º DHPB.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>4. DOS REQUISITOS GERAIS PARA PARTICIPAÇÃO</h3>
                <p>São requisitos para inscrição e participação no 4º DHPB os dispostos nos capítulos 2 e 3 deste edital.</p>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>5. DAS FASES DO 4º DHPB</h3>
                <ul className='list-disc list-inside space-y-2 text-white/80'>
                  <p>5.1) O 4º DHPB será composto por 4 (quatro) fases online realizadas a partir do acesso ao site e a sala da equipe pelo endereço https://dhpb.ifpb.edu.br/ 1 (uma) fase final presencial, que será realizada no Instituto Federal do Sertão Paraibano (IFSertãoPB) Campus Patos, conforme cronograma apresentado neste Edital e regras estabelecidas no Regulamento Oficial do 4º DHPB.</p>
                  <p>5.2) Cada fase é classificatória e eliminatória, e os pontos obtidos são cumulativos para as fases seguintes.</p>
                  <p>5.3) As questões e as tarefas das fases virtuais serão disponibilizadas, acessadas e obrigatoriamente resolvidas e respondidas única e exclusivamente por meio do site https://dhpb.ifpb.edu.br/</p>
                  <p>5.4) A primeira fase online será formada por até 8 (oito) questões objetivas, compostas por 4 (quatro) itens cada, cuja pontuação atribuída a cada item pode ser 0 (zero), 1 (um), 4 (quatro) ou 5 (cinco) pontos, e uma tarefa elaborada pela comissão organizadora do 4º DHPB. Serão eliminadas nesta fase as equipes participantes que não tenham atingido o perfil mínimo de obtenção de 25% (vinte e cinco por cento) dos pontos da fase e/ou mediante nota de corte da etapa estabelecida pela Comissão Organizadora.</p>
                  <p>5.5) A segunda fase online será formada por até 8 (oito) questões objetivas, compostas por 4 (quatro) itens cada, cuja pontuação atribuída a cada item pode ser 0 (zero), 1 (um), 4 (quatro) ou 5 (cinco) pontos e uma tarefa elaborada pela comissão organizadora do 4º DHPB. Serão eliminadas nesta fase as equipes participantes que não tenham atingido o perfil mínimo de obtenção de 50% (cinquenta por cento) dos pontos da fase e/ou mediante nota de corte da fase estabelecida pela Comissão Organizadora.</p>
                  <p>5.6) A Terceira fase online será formada por até 8 (oito) questões objetivas, compostas por 4 (quatro) itens cada, cuja pontuação atribuída a cada item pode ser 0 (zero), 1 (um), 4 (quatro) ou 5 (cinco) pontos e uma tarefa elaborada pela comissão organizadora do 4º DHPB. Na terceira fase, serão aprovadas no máximo 250 equipes (este número pode ser alterado exclusivamente a partir da deliberação da Comissão Organizadora, em caso de alteração, para mais ou para menos, a Comissão Organizadora registrará em "Comunicado Oficial" o novo limite de equipes que participarão da fase seguinte). O número de equipes aprovadas na fase 4 não é ou será relacionado à uma proporção do número de equipes inscritas, mas sim à deliberação da Comissão Organizadora que levará em conta exclusivamente a operacionalidade da tarefa da fase 4 e sua correção e/ou mediante nota de corte da fase estabelecida pela Comissão Organizadora.</p>
                  <p>5.7) Cada questão proposta nas três primeiras fases virtuais poderá apresentar referências e conteúdos relacionados para auxiliar na pesquisa das equipes e na escolha da resposta para a questão, sem prejuízo das demais.</p>
                  <p>5.8) O gabarito das questões objetivas será publicado após o término de cada fase, nas datas e horários estabelecidos no Cronograma do Edital do 4º DHPB.</p>
                  <p>5.9) A Quarta Fase online será formada por uma tarefa elaborada pela Comissão Organizadora do 4º DHPB.</p>
                  <p>5.10) Em caso de constatação de plágio nas tarefas subjetivas, será atribuída nota ZERO à(as) equipe(s) envolvida(s), bem como está(s) equipe(s) poderá (ão) sofrer as sanções cabíveis. Caso seja observado plágio interno, caracterizado pela cópia parcial ou integral de textos de outras equipes, a(s) equipe(s) responsável(s) poderá(ão) ser punida(s) com a eliminação do certame. Em caso de plágio de obras ou autores externos ao processo, além da eliminação do certame, a(s) equipe(s) responsável(s) estará (ão) sujeita(s) às penalidades cíveis e criminais previstas em lei.</p>
                  <p>5.11) A Comissão Organizadora do 4º DHPB e o IFPB não se responsabilizam por opiniões, ideias, termos ou elementos inadequados ou que desrespeitem a lei, os direitos individuais e coletivos, os direitos humanos ou as regras de boa convivência e respeito às individualidades e coletividades, apresentados pelas equipes ou seus(as) membros(as) na tarefa subjetiva ou quaisquer atividades realizadas ao longo do certame, e, em caso de conteúdo considerado ofensivo ou ilegal, a equipe é passível de eliminação do certame e estará sujeita às penalidades legais.</p>
                  <p>5.12) Em caso de falha no site https://dhpb.ifpb.edu.br/ durante a realização do 4º DHPB ou falha ampla da conectividade em diversas regiões do Estado da Paraíba, a Comissão Organizadora do 4º DHPB poderá prorrogar ou alterar os prazos e datas das fases, em separado ou na sua totalidade, visando sempre assegurar os princípios norteadores básicos do certame, como a isonomia entre os participantes, ou em virtude de situações diversas, a critério da Comissão Organizadora.</p>
                  <p>5.12.1) Falhas pontuais e/ou locais de conectividade, que atinjam apenas uma parcela de participantes, não serão obrigatoriamente levadas em consideração.</p>
                  <p>5.13) A fase final presencial do 4º DHPB ocorrerá no O Instituto Federal do Sertão Paraibano (IFSertãoPB) Campus Patos, e a cerimônia de premiação no ginásio poliesportivo dentro do campus Patos.</p>
                  <p>5.14) A quantidade de equipes participantes da fase final presencial do 4º DHPB será de até 120 (cento e vinte) equipes, dentre as que obtiverem maior pontuação acumulada nas fases anteriores, em ordem crescente de classificação. 50% destas vagas serão destinadas para equipes oriundas da rede pública estadual ou municipal ou federal.</p>
                  <p>5.14.1) A Comissão Organizadora do 4º DHPB não se responsabilizará pelo deslocamento, hospedagem e alimentação das equipes finalistas. As equipes classificadas, de escola pública ou privada, deverão buscar, a seu critério, meios próprios para participar da fase final.</p>
                  <p>5.15) Ficam alertado(a)s o(a)s participantes da fase final, de que deverão providenciar uma série de documentos relativos à viagem para Campina Grande e outros documentos relativos à participação na Fase Final.</p>
                  <p>5.15.1) É de suma importância que o(a)s estudantes tragam um documento de identidade com foto. Recomendamos enfaticamente que este documento seja o RG. Em casos excepcionais, este documento poderá ser a certidão de nascimento, desde que acompanhada de outro documento oficial com foto. Carteirinhas estudantis ou de associações NÃO SÃO consideradas um documento oficial de identidade, a menos que acompanhadas da certidão de nascimento. Atenção: o(a) aluno(a) que não trouxer seu RG, ou certidão de nascimento acompanhada de documento oficial com foto, será impedido(as) de realizar a prova da fase final da Olimpíada. Recomendamos aos(às) jovens que ainda não possuem RG que aproveitem essa circunstância para emitir este importante documento, alertando que o mesmo pode demorar até 90 dias para ser emitido.</p>
                  <p>5.15.2) Outros documentos relativos à participação na fase final da Olimpíada incluem autorização para viagem de menores assinada por pais e/ou responsáveis, que será utilizada pelo(a)s próprio(a)s estudantes para seu deslocamento em território paraibano. Incluem também permissão concedida à Comissão Organizadora do DHPB para o uso da imagem de todo(a)s o(a)s membros da equipe, incluindo o(a) professor(a), permissão essa que será entregue à Comissão Organizadora da Olimpíada no dia da prova final. Outros documentos pertinentes podem vir a ser requisitados pela Comissão Organizadora da Olimpíada no momento da convocação do(a)s selecionado(a)s para a Fase Final.</p>
                  <p>5.16) Na fase final presencial do 4º DHPB, as equipes deverão realizar uma atividade avaliativa, cuja pontuação pode variar de 0 (zero) a 100 (cem) pontos.</p>
                  <p>5.17) Somente membros(as) estudantes das equipes poderão realizar a atividade avaliativa na fase final presencial do 4º DHPB, sem poder contar com a ajuda ou orientação do(a) professor/a orientador/a da equipe, durante a realização da referida atividade.</p>
                  <p>5.18) O acesso ao local de aplicação das provas/atividades na fase final presencial do 4º DHPB é restrito e exclusivo para membros(as) estudantes das equipes finalistas, membros(as) da Comissão Organizadora do 4º DHPB e colaboradores(as) devidamente identificados. É vetado o acesso aos blocos, corredores e salas de aplicação a familiares, pais, mães, professores/as, gestores/as de ensino e quaisquer outros(as) acompanhantes ou pessoas alheias ao processo.</p>
                  <p>5.19) As fases do 4º DHPB terão pesos diferentes e crescentes, correspondendo respectivamente aos pesos de 1 (um), 2 (dois), 3 (três), 4 (quatro), 5 (cinco) para cada uma das 5 (cinco) fases.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>6. DA PREMIAÇÃO</h3>
                <ul className='list-disc list-inside space-y-1 text-white/80'>
                  <p>6.1) Serão emitidos certificados de participação a todos/as membros/as das equipes inscritas que participarem do 4º DHPB, constando as fases que participaram.</p>
                  <p>6.2) Além do previsto no item 6.1 deste edital, serão emitidos certificados de premiação e medalhas para os(as) membros(as) das 50 (cinquenta equipes) equipes finalistas com melhor desempenho nesta edição do 4º DHPB conforme classificação final divulgada em data e horários informados no cronograma apresentado neste Edital, através dos meios de comunicação oficiais do IFPB, da Pró-Reitoria de Pesquisa, Inovação e Pós-graduação, de Ensino e de Extensão e Cultura do IFPB e do 4º DHPB. Para as demais equipes finalistas, será fornecido certificado de menção honrosa.</p>
                  <p>6.3) As medalhas e certificados serão distribuídos levando em consideração o somatório da pontuação obtida nas 5 (cinco) fases, de acordo com a classificação a seguir:
                    <ul className='list-disc list-inside ml-6 mt-1 text-white/70'>
                      <p>1ª a 10ª Medalha de Ouro.</p>
                      <p>11ª a 25ª Medalha de Prata.</p>
                      <p>26ª a 50ª - Medalha de Bronze.</p>
                      <p>51ª a 120ª Medalha de Cristal (Menção Honrosa).</p>
                    </ul>
                  </p>
                  <p>6.4) Em caso de equipes empatadas em pontuação nas Fases 4 e 5, fica estabelecido a seguinte sequência de critérios de desempate:
                    <ul className='list-disc list-inside ml-6 mt-1 text-white/70'>
                      <p>a) a maior pontuação obtida pela equipe na Fase 3;</p>
                      <p>b) a maior pontuação obtida pela equipe na Fase 2.</p>
                      <p>c) a maior pontuação obtida pela equipe na Fase 1.</p>
                    </ul>
                  </p>
                  <p>6.4.1) Persistindo o empate, serão classificadas para a Fase seguinte as equipes com mesma pontuação.</p>
                  <p>6.5) Os certificados serão disponibilizados através do site https://dhpb.ifpb.edu.br/ e ficarão disponíveis por tempo indeterminado.</p>
                  <p>6.6) A comissão organizadora do 4º DHPB reserva-se ao direito de alterar ou acrescentar prêmios, segundo seu critério e de acordo com a disponibilidade de recursos.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>7. DAS INSCRIÇÕES</h3>
                <ul className='list-disc list-inside space-y-2 text-white/80'>
                  <p>7.1) As inscrições para o 4º DHPB são gratuitas e deverão ser realizadas exclusivamente online, através do sistema https://dhpb.ifpb.edu.br/ conforme estabelecido no capítulo 3 do Regulamento Oficial do 4º DHPB, obedecendo às datas fixadas neste Edital.</p>
                  <p>7.2) Não serão aceitas, sob nenhuma hipótese, inscrições feitas por e-mail, correspondência ou qualquer outro meio de comunicação diferente do estabelecido no item 7.1 deste Edital e no capítulo 3 do Regulamento Oficial do 4º DHPB.</p>
                  <p>7.3) A inscrição no 4º DHPB será composta por 2 (duas) etapas, conforme datas específicas previstas neste Edital, obedecendo o determinado no item 3.3 do Regulamento Oficial do DHPB:
                    <ul className='list-disc list-inside ml-6 mt-1 text-white/70'>
                        <p>7.3.1) Cadastro individual dos membros da equipe no sistema https://dhpb.ifpb.edu.br/;</p>
                        <p>7.3.2) montagem da equipe com os três alunos e o professor orientador no sistema https://dhpb.ifpb.edu.br/</p>
                    </ul>
                  </p>
                  <p>7.4) O estudante da equipe deve possuir CPF e endereço de e-mail próprio, pois para cada CPF será criada uma senha de acesso ao site https://dhpb.ifpb.edu.br/conforme estabelecido no Regulamento Oficial do 4°DHPB.</p>
                  <p>7.5) O login de acesso à Plataforma do 4º DHPB será realizado por meio do e-mail informado no cadastro e senha no ato de acesso ao sistema https://dhpb.ifpb.edu.br/</p>
                  <p>7.6) Os/as membros/as das equipes deverão escolher um nome para sua equipe, respeitando as condições previstas no Regulamento Oficial do 4º DHPB.</p>
                  <p>7.6.1) Você deve criar um nome para sua equipe. Esse "nome da equipe" a acompanhará em todo o 4º DHPB e será utilizado em todas as etapas da competição, do início até a premiação, e por isso deve ser escolhido com critério.</p>
                  <p>7.6.2) São proibidos nomes ofensivos, pornográficos ou que remetam a qualquer forma de violência, preconceito racial, social, de gênero, de credo, capacitista, geracional ou de origem, bem como nomes que causem dubiedade de interpretação no que se refere aos casos acima.</p>
                  <p>7.7) Poderão participar do 4º DHPB discentes de escolas públicas das redes municipais, estadual, federal e privadas, de todo o Estado da Paraíba e que estejam regularmente matriculados a partir do 8º ano do Ensino Fundamental até o último ano do Ensino Médio, bem como alunos da Educação de Jovens e Adultos.</p>
                  <p>7.8) Para a realização das provas do 4º DHPB, os discentes deverão ser inscritos em equipes com três integrantes da mesma escola, sob a orientação de um/a professor/a de História da sua escola.</p>
                  <p>7.9) Cada discente somente poderá participar de uma equipe.</p>
                  <p>7.10) Cada equipe será composta por: três estudantes que formam o trio de discentes que compõem a equipe e um professor orientador.</p>
                  <p>7.11) As equipes, em cada escola, poderão ser formadas por discentes apenas do Ensino Fundamental, apenas do Ensino Médio.</p>
                  <p>7.12) Obedecendo ao Decreto No. 8.727, de 28 de abril de 2016, é garantida a possibilidade de utilização de nome social ao longo de toda a participação no 4º DHPB, sendo permitido a qualquer participante registrar no cadastro a opção por nome social. Em obediência ao Artigo 40. do referido Decreto, é opcional constar o nome social no(s) certificado(s) obtido(s), se requerido expressamente pelo(a) interessado (a), obrigatoriamente acompanhado do nome civil.</p>
                  <p>7.13) Quanto ao/à professor/a orientador/a:
                    <ul className='list-disc list-inside ml-6 mt-1 text-white/70'>
                      <p>7.13.1) O(a) professor(a) orientador(a) deve ter vínculo empregatício ou contrato estágio/trabalho com a escola, professore(a)s temporário(a)s/ não concursado(a)s/substituto(a)s também podem participar como orientadores. É permitida a participação de professore(a)s que estejam exercendo outras funções (coordenação, direção, supervisão pedagógica) ou ministrando outras disciplinas na escola no momento da inscrição e/ou da realização da prova, observado o fato de que tenham formação em História. Há casos em que a formação original do(a) professor(a) se deu em outras áreas, como Ciências Sociais, por exemplo. Desde que este(a) professor(a) seja o(a) professor(a) de História da escola, ele(a) poderá orientar equipes no Desafio. É permitida, ainda, a participação de estagiário(a)s e plantonistas como orientador(a)s de equipes desde que estejam regularmente matriculados em curso de graduação em História e tenham vínculo empregatício ou contrato estágio/trabalho com as instituições de ensino da(s) equipe(s);</p>
                      <p>7.13.2) Enviar no momento da inscrição da equipe no site https://dhpb.ifpb.edu.br/ o comprovante de vínculo empregatício do professor orientador</p>
                      <p>7.13.3) Poderá orientar mais de uma equipe da mesma escola;</p>
                      <p>7.13.4) Poderá orientar equipes em duas ou mais instituições de ensino, desde que tenha vínculo institucional válido em cada uma delas.</p>
                    </ul>
                  </p>
                  <p>7.14) Não há limite para o número de equipes inscritas por escola.</p>
                  <p>7.15) Não há limite para o número de equipes orientadas por um/a mesmo/a professor/a orientador/a.</p>
                  <p>7.16) Para participantes portadores de deficiência (pessoas com deficiência - PCD), com demandas específicas de saúde ou dificuldade temporária de locomoção, é possível a solicitação de atendimento especial para a fase final presencial e para a cerimônia de premiação do 4º DHPB, desde que comunique suas necessidades específicas à comissão organizadora do 4º DHPB, através do correio eletrônico dhpb@ifpb.edu.br, exclusivamente durante o período de Inscrições indicado no item 8 deste Edital e mediante ratificação desta solicitação no período de confirmação de presença na fase final presencial do 4º DHPB, indicado no item 8 deste Edital.</p>
                  <p>7.17) A comunicação a que se refere o item 7.16 deverá ser realizada exclusivamente por meio do correio eletrônico indicado, devendo ser preenchido ipsi literis no campo Assunto SOLICITAÇÃO DE ATENDIMENTO ESPECIAL - DHPB, e obedecendo aos prazos estabelecidos.</p>
                  <p>7.18) A Comissão Organizadora do 4º DHPB e o IFPB reservam-se ao direito de não atender a qualquer tipo de solicitação de atendimento especial por participante com deficiência PCD que não estejam presentes ou sejam oferecidas nas estruturas físicas de suas sedes, bem como as que demandarem recursos extras e não previstos no orçamento reservado para este desafio.</p>
                  <p>7.19) A Comissão Organizadora do 4º DHPB e o IFPB não se responsabilizarão, em nenhuma hipótese, com o atendimento de qualquer tipo solicitação especial por participante com deficiência (PCD) para a inscrição e as Fases Online (Fases 1, 2, 3 e 4) do desafio, cabendo exclusivamente ao(â) participante a responsabilidade com o acesso ao sistema onde a prova está alocada.</p>
                  <p>7.20) Restrições religiosas: Para a Fase Final presencial, o(a) s participantes que, por restrições religiosas, não puderem realizar a prova final no sábado dia 05 de dezembro de 2026 das 9h às 12h, ficarão juntamente com toda sua equipe  menos o(a) professor(a)] em uma sala isolada no prédio onde ocorrem as provas. Deverão aguardar neste local a realização da prova Final da DHPB que se iniciará após o horário oficial do pôr-do-sol e serão acompanhados o tempo todo por Monitores(as) do Desafio. Apenas as equipes finalistas que necessitarem dessa programação especial deverão entrar em contato com a Comissão Organizadora conforme orientações e nas datas a serem divulgadas no Manual que ficará disponível nas salas das equipes finalistas durante a Convocação. No caso de uma equipe possuir restrição religiosa e não comunicar o fato à Organização, não será possível reservar para ela local e horário em separado. Nesse caso, se a equipe declarar possuir um ou mais membros como restrição religiosa apenas no momento da aplicação da prova, caberá a ela decidir se realiza a prova em mesmo local e horário que todos os demais (sábado dia 05 de dezembro de 2026) ou se abandona a competição.</p>
                  <p>7.21) Poderão ocorrer até duas substituições na equipe durante a realização da 4º DHPB. São critérios de substituição de membros de uma equipe:
                    <ul className='list-disc list-inside ml-6 mt-1 text-white/70'>
                      <p>7.21.1) Licença médica por período igual ou superior ao tempo restante para a conclusão de todas as fases do 4º DHPB;</p>
                      <p>7.21.2) Doença infectocontagiosa que comprometa o contato com os outros membros da equipe ou com os participantes em geral;</p>
                      <p>7.21.3) Desligamento da escola;</p>
                      <p>7.21.4) Morte ou invalidez;</p>
                      <p>7.21.5) Outros casos omissos a este Regulamento, que serão avaliados pela Comissão Organizadora do 4º DHPB.</p>
                    </ul>
                  </p>
                  <p>7.22) Somente o(a) Professor(a) orientador(a) da equipe pode solicitar a substituição de membros das equipes, conforme critérios estabelecidos nos itens 7.21.1, 7.21.2, 7.21.3, 7.21.4, 7.21.5 sendo o único responsável pelo envio da documentação exigida pela Comissão Organizadora do 4º DHPB.</p>
                  <p>7.23) Em caso de desligamento do(a) Professor(a) orientador(a) do quadro docente da instituição de ensino, deverá ser enviado pedido formal por parte do estabelecimento em documento oficial, comunicando o desligamento, acompanhado da documentação comprobatória e/ou outros documentos exigidos pela Comissão Organizadora do 4º DHPB para que um novo(a) Professor(a) assuma a orientação da/as equipes.</p>
                  <p>7.24) O prazo de substituição e indicação de novos membros, incluindo a apresentação de documentos solicitados, é de até 5 (cinco) dias corridos, a contar do envio da solicitação. A solicitação de substituição a que tratam os itens 7.21, 7.22, 7.23 deve ser realizada exclusivamente através do correio eletrônico dhpb@ifpb.edu.br, em tempo hábil e obedecendo aos prazos estabelecidos no Calendário Oficial do Desafio.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>8. NÍVEL DE MONTAGEM DA EQUIPE</h3>
                <ul className='list-disc list-inside space-y-1 text-white/80'>
                  <p>8.1) A composição das equipes é decidida pelos participantes, desde que obedecendo ao modelo de um/a professor/a e três estudantes do mesmo nível de ensino.</p>
                  <p>8.2) Para a sua inscrição deverá acessar o site https://dhpb.ifpb.edu.br/ e selecionar a inscrição conforme o nível escolar de seus/suas alunos/alunas Equipe do Ensino Fundamental ou Equipe do Ensino Médio na página de inscrições.</p>
                  <p><strong>8.3) Nível 1:</strong> estudantes do 8º e 9º ano do Ensino Fundamental e Educação de Jovens e Adultos (EJA) equivalente ao Ensino Fundamental.</p>
                  <p><strong>8.4) Nível 2:</strong> estudantes do Ensino Médio Regular e Profissionalizante Integrado e Educação de Jovens e Adultos (EJA) equivalente ao Ensino Médio.</p>
                  <p>8.5) As equipes podem ser compostas por estudantes de séries diferentes, mas somente do mesmo nível de Ensino (Fundamental II ou Médio), sempre da mesma escola, não sendo permitida a presença de estudantes de níveis de ensino diferentes na mesma equipe.</p>
                  <p>8.6) As equipes concorrerão entre si no mesmo nível, independentemente das notas e pontuação das equipes do outro nível.</p>
                  <p>8.7) A classificação para as Fases Quarta e Quinta obedecerá ao critério da proporcionalidade do total de equipes inscritas, que serão divulgadas ao final do Período de Inscrições. Desta forma, a distribuição de equipes nas Fases Quarta e Quinta será determinada pela quantidade de equipes inscritas em cada nível. Assim, a quantidade de vagas para estas fases será dividida entre as equipes dos dois níveis, de acordo com a proporção de inscrições no início da olimpíada para cada nível.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>9. CRONOGRAMA</h3>
                <ul className='list-disc list-inside space-y-1 text-white/80'>
                  <p><strong>9.1.1) Publicação do Edital e Regulamento:</strong> 30/07/2026.</p>
                  <p><strong>9.1.2) Período de Impugnação das regras do Edital e Regulamento:</strong> 31/07/2026, das 8 às 17 horas.</p>
                  <p><strong>9.1.3) Resultado de eventuais pedidos de impugnação das regras do Edital e Regulamento:</strong> 01/08/2026.</p>
                  <p><strong>9.1.4) Período de Inscrição - individual e de equipes:</strong> 30/07/2026 a 01/09/2026, até às 23h59.</p>
                  <p><strong>9.1.5) Deferimento e impugnação de inscrições:</strong> 04/09/2026.</p>
                  <p><strong>9.1.6) 1ª Fase Online:</strong> das 08:00 do dia 10 de setembro até às 23h59 do dia 15 de setembro.</p>
                  <p><strong>9.1.6.1) Divulgação do gabarito da Fase 1:</strong> dia 16 de setembro as 08:00</p>
                  <p><strong>9.1.7) 2ª Fase Online:</strong> das 08:00 do dia 17 de setembro até às 23h59 do dia 22 de setembro.</p>
                  <p><strong>9.1.7.1) Divulgação do gabarito da Fase 2:</strong> dia 23 de setembro as 08:00</p>
                  <p><strong>9.1.8) 3ª Fase Online:</strong> das 08:00 do dia 24 de setembro até às 23h59 do dia 29 de setembro.</p>
                  <p><strong>9.1.8.1) Divulgação do gabarito da Fase 3:</strong> dia 30 de setembro as 08:00</p>
                  <p><strong>9.1.9) 4ª Fase Online:</strong> das 08:00 do dia 01 de outubro até às 23h59 do dia 09 de outubro.</p>
                  <p><strong>9.1.10) Resultado final da 4ª Fase online e convocação das equipes para a final presencial:</strong> ocorrerá até o dia 30 de outubro às 23h59.</p>
                  <p><strong>9.1.11) Fase final presencial:</strong> no dia 05 de dezembro das 08:00 às 12:00.</p>
                  <p><strong>9.1.12) Cerimônia de premiação:</strong> no dia 06 de dezembro das 08:00 às 12:00.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>10. RECURSOS</h3>
                <ul className='list-disc list-inside space-y-1 text-white/80'>
                  <p>10.1) É garantido o direito de qualquer cidadão entrar com termo de impugnação contra as regras deste Edital e Regulamento Oficial do 4ºDHPB, identificando-se e pronunciando-se no período especificado no Cronograma informado no item 9 deste Edital.</p>
                  <p>10.2) A ação de impugnação deverá ser realizada por meio eletrônico via internet, com assunto intitulado ipsi literis IMPUGNAÇÃO EDITAL E/OU REGULAMENTO DO 3º DHPB e enviado para o endereço eletrônico dhpb@ifpb.edu.br com justificativa e argumentação.</p>
                  <p>10.3) Não serão apreciados os pedidos intempestivos e sem fundamentação técnica.</p>
                  <p>10.4) Os pedidos de impugnação devidamente fundamentados serão julgados pela Comissão Organizadora do 4º DHPB.</p>
                  <p>10.5) As respostas às impugnações/recursos serão disponibilizadas em um único arquivo no site do 4º DHPB nas datas previstas pelo cronograma apresentado no item 9.1.3 deste Edital.</p>
                  <p>10.6) Da decisão não cabe recurso administrativo.</p>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-bold text-white mb-2'>11. DAS DISPOSIÇÕES FINAIS</h3>
                <ul className='list-disc list-inside space-y-1 text-white/80'>
                  <p>11.1) O não cumprimento de qualquer um dos prazos previstos no cronograma apresentado neste Edital por parte das equipes ou membros/as implicará na perda do(s) respectivo(s) direito(s), não cabendo qualquer tipo de questionamento.</p>
                  <p>11.2) A qualquer tempo este Edital poderá ser alterado, revogado ou anulado, no todo ou em parte, por decisão unilateral da Comissão Organizadora ou órgãos superiores a esta do IFPB. Isso pode ocorrer por motivo de interesse público ou exigência legal, em decisão fundamentada, sem que isso implique direito à indenização de qualquer natureza.</p>
                  <p>11.3) As possíveis situações a que se refere o item 11.2 entrarão em vigor a partir da deliberação da Comissão Organizadora do 4º DHPB e conforme documento publicado no sítio oficial do IFPB e do 4º DHPB, amplamente divulgado nos canais oficiais de comunicação do IFPB e do 4º DHPB, devidamente registrados em seus nomes nas redes sociais.</p>
                  <p>11.4) Dúvidas sobre o Edital ou Regulamento Oficial da 4º DHPB poderão ser enviadas para o correio eletrônico: dhpb@ifpb.edu.br</p>
                  <p>11.5) Os casos omissos a este Edital ou ao regulamento oficial do DHPB serão analisados pela Comissão Organizadora;</p>
                  <p>11.6) Este Edital entrará em vigor na data da sua publicação.</p>
                  <p>11.7) Determina-se ampla divulgação deste Edital, obedecendo ao princípio da publicidade da administração pública, possibilitando assim conhecimento e participação do maior número de pessoas interessadas.</p>
                </ul>
              </div>

              <div className='pt-6 text-center border-t border-white/20'>
                <p className='text-white font-bold text-base'>Comissão Organizadora do 4º Desafio em História da Paraíba.</p>
              </div>

            </div>
          </section>
        </main>

        <footer className="w-full pt-12 md:pt-5 pb-5">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

              <div className="flex flex-col items-center lg:items-start gap-4">
                <img
                  src="/logo.svg"
                  alt="DHPB"
                  className="h-14 w-auto object-contain"
                />
                <div className="flex items-center gap-4 text-black">
                  <a href="https://www.instagram.com/oficialdhpb/" target="_blank" rel="noopener noreferrer" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
                    </svg>
                  </a>
                  <a href="https://www.tiktok.com/@oficialdhpb" target="_blank" rel="noopener noreferrer" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16">
                      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
                    </svg>
                  </a>
                  <a href="#" className="hover:text-[#82181A] transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-youtube" viewBox="0 0 16 16">
                      <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="hidden lg:block w-px h-20 bg-[#000]" />

              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Realização:</span>
                <img src="/ifpb-logo.svg" alt="IFPB" className="h-10 w-auto object-contain" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Apoio:</span>
                <div className="flex items-center gap-5 flex-wrap justify-center">
                  <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
                  <img src="/logo-nuhcl.svg" alt="NUHCL" className="h-10 w-auto object-contain" />
                  <img src="/logo-ufcg.svg" alt="HISTORIA-UFCG" className="h-12 w-auto object-contain" />
                </div>
              </div>

              <div className="hidden lg:block w-px h-20 bg-[#000]" />

              <div className="flex flex-col items-center gap-2">
                <span className="text-black font-semibold text-base">Powered by:</span>
                <div className="flex items-center gap-4">
                  <img src="/kodeo-logo.svg" alt="Kodeo" className="h-10 w-auto object-contain" />
                  <img src="/comite-logo.svg" alt="Comitê" className="h-10 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
