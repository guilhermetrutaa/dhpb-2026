'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import Link from "next/link";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Componente para animação de números (CountUp)
const AnimatedNumber = ({ end, label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000; // 2 segundos de animação
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.ceil(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [end, hasAnimated]);

  return (
    <div ref={ref} className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 w-full md:w-64 hover:shadow-md transition-shadow">
      <span className="text-5xl font-bold text-red-900 mb-2">
        {count}{end >= 2000 ? '+' : ''}
      </span>
      <span className="text-lg text-gray-600 font-medium text-center">{label}</span>
    </div>
  );
};

// Componente para animação de aparecer ao scroll (Fade In)
const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setVisible(true);
      });
    });
    const current = domRef.current;
    if (current) observer.observe(current);
    return () => current && observer.unobserve(current);
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
};

const Page = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <main className={`${poppins.className} min-h-screen bg-white`}>
      {/* Header Simplificado */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className='text-red-900 group-hover:-translate-x-1 transition-transform'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-arrow-left-circle-fill" viewBox="0 0 16 16">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/>
                </svg>
              </div>
              <span className="text-red-900 font-medium group-hover:text-red-800">Voltar para o início</span>
            </div>
          </Link>
          <img src="/Logo.svg" alt="Logo DHPB" className="h-8 md:h-10" />
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: 'url(/bg-sobre2.svg)' }}>
      </div>

      {/* Conteúdo Principal */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FadeInSection>
            <div className="space-y-6 text-gray-700 leading-relaxed text-lg text-justify">
              <p>
                O <strong className="text-red-900 font-bold">Desafio em História da Paraíba</strong> é um evento que promete ser um marco no campo da história e da cultura paraibana. Voltado para estudantes do Ensino Fundamental e Médio de todo o estado, este desafio tem como objetivo promover a valorização e o estudo da história da Paraíba, destacando a diversidade de atividades e conhecimentos que podem ser explorados.
              </p>
              <p>
                Neste desafio, os participantes terão a oportunidade de ampliar seus horizontes históricos, através de questões que promoverão a pesquisa em fontes documentais e o debate sobre os mais diversos aspectos da história paraibana, promovendo uma experiência ímpar na formação dos estudantes.
              </p>
              <p>
                Venha fazer parte deste desafio e descubra as riquezas e particularidades da história da Paraíba, em um evento que promete marcar a trajetória acadêmica e profissional de todos os envolvidos.
              </p>
            </div>
          </FadeInSection>
          
          <FadeInSection>
            <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent z-10"></div>
              {/* Imagem ilustrativa - usando o banner existente ou outra imagem relevante */}
              <img src="/banner2-dhpb.svg" alt="Estudantes DHPB" className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-6 z-20">
                <p className="text-white font-bold text-xl">Junte-se a nós!</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Seção de Estatísticas */}
      <section className="bg-gray-50 py-20 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O Sucesso da Última Edição</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Números que comprovam o engajamento e a paixão dos estudantes pela nossa história</p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
              <AnimatedNumber end={830} label="Equipes Inscritas" />
              <AnimatedNumber end={2000} label="Participantes" />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Seção de Vídeos */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Edições Anteriores</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Confira os melhores momentos e sinta a energia de quem já fez história</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vídeo 1 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
              <div className="aspect-video bg-gray-200 relative">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/placeholder1" // Substitua pelo ID real do vídeo
                  title="Vídeo Edição Passada"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Melhores Momentos 2025</h3>
                <p className="text-sm text-gray-500">Um resumo emocionante de tudo que rolou.</p>
              </div>
            </div>

            {/* Vídeo 2 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
              <div className="aspect-video bg-gray-200 relative">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/placeholder2" 
                  title="Depoimentos"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2">O que dizem os alunos?</h3>
                <p className="text-sm text-gray-500">Depoimentos de quem viveu essa experiência.</p>
              </div>
            </div>

            {/* Vídeo 3 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
              <div className="aspect-video bg-gray-200 relative">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/placeholder3" 
                  title="Premiação"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Grande Final</h3>
                <p className="text-sm text-gray-500">A emoção da entrega das medalhas.</p>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Seção Redes Socais */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Vamos nos conectar?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Siga nossas redes sociais para ficar por dentro de tudo que acontece no desafio</p>
          </div>
          
          <div className="flex md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-center">
            <div>
              <div style={{ backgroundImage: 'url(/bg-insta.svg)' }} className="bg-center bg-cover text-white w-[45rem] mx-auto p-8 rounded-2xl shadow-2xl">
      
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  
                  {/* Foto de perfil */}
                  <div className="flex-shrink-0">
                    <div className="p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-red-500">
                      <img
                        src="/logo-instagram-dhpb.jpg"
                        alt="Perfil Instagram"
                        className="w-36 h-36 rounded-full object-cover bg-black"
                      />
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 text-center md:text-left">
                    
                    {/* Username */}
                    <h2 className="text-2xl font-semibold mb-4">
                      oficialdhpb
                    </h2>

                    {/* Estatísticas */}
                    <div className="flex justify-center md:justify-start gap-8 mb-6 text-sm">
                      <p><span className="font-bold text-base">156</span> posts</p>
                      <p><span className="font-bold text-base">1.526</span> seguidores</p>
                      <p><span className="font-bold text-base">81</span> seguindo</p>
                    </div>

                    {/* Bio */}
                    <div className="space-y-1 text-sm text-gray-300">
                      <p className="font-semibold text-white">
                        Desafio em História da Paraíba
                      </p>
                      <p>🔸 3ª Edição do DHPB</p>
                      <p>🔸 Projeto realizado pelo <span className='text-blue-400'>@ifpb.oficial</span></p>
                      <p>🔸 Apoiadores: SECTIES-PB, Comitê Olímpico</p>
                      <p className="text-gray-400">
                        Contato por... mais
                      </p>
                      <a
                        href="https://dhpb.ifpb.edu.br"
                        target="_blank"
                        className="text-blue-400 hover:underline"
                      >
                        dhpb.ifpb.edu.br
                      </a>
                    </div>

                    {/* Botão */}
                    <div className="mt-6">
                      <a
                        href="https://instagram.com/oficialdhpb"
                        target="_blank"
                        className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
                      >
                        Ver no Instagram
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Footer Completo (Estilo Home) */}
      <footer className="bg-white mt-20 py-8">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center md:items-start space-y-6 md:space-y-0">
                    <div className="flex flex-col items-center space-y-4">
                        <img src="/logo.svg" alt="Logo DHPB" className="h-12" />
                        <div className="flex space-x-4">
                            <a href="https://www.instagram.com/oficialdhpb/" target="_blank" rel="noopener noreferrer" className='text-[#000]'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                                </svg>
                            </a>
                            <a href="https://www.tiktok.com/@oficialdhpb" className='text-[#000]'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16">
                                    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                                </svg>
                            </a>
                            <a href="#" className='text-[#000]'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-youtube" viewBox="0 0 16 16">
                                    <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start space-y-4 md:space-y-0 md:flex-row md:space-x-12">
                        <div className="md:border-l md:border-red-900 md:pl-6 text-center md:text-left">
                            <p className="text-sm font-medium mb-2 text-[#000]">Realização:</p>
                            <div className="flex items-center justify-center md:justify-start space-x-4">
                                <img src="/ifpb-logo.svg" alt="IFPB" className="h-8" />
                            </div>
                        </div>

                        <div className="md:pl-6 text-center md:text-left">
                            <p className="text-sm font-medium mb-2 text-[#000]">Apoio:</p>
                            <div className='flex'>
                                <img src="/anpuhpb.svg" alt="ANPUH" className="h-8 mx-auto md:mx-0" />
                                <img src="/comite-logo.svg" alt="Comitê Olímpico" className="h-8 pl-5" />
                                <img src="/logo-gov.svg" alt="Logo-Gov" className="h-20 pl-5" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start space-y-4 md:space-y-0 md:flex-row md:space-x-12">
                        <div className="md:border-l md:border-red-900 md:pl-6 text-center md:text-left">
                            <p className="text-sm font-medium mb-2 text-[#000]">Powered by:</p>
                            <div className="flex items-center justify-center md:justify-start space-x-4">
                                <img src="/kodeo-logo.svg" alt="Kodeo" className="h-8" />
                                <img src="/comite-logo.svg" alt="Comitê Olímpico" className="h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
    </main>
  );
};

export default Page;