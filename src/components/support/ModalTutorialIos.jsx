'use client'

import React from 'react'

export default function ModalTutorialIos({ aberto, onFechar }) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-neutral-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-neutral-100 flex flex-col gap-4 relative animate-scale-up">
        <button
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#82181A]/10 text-[#82181A] flex items-center justify-center text-xl shrink-0">
            📲
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900 leading-tight">Ativar no iPhone (iOS)</h3>
            <p className="text-xs text-neutral-500">Siga os 3 passos para receber os avisos:</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-neutral-700 mt-1">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
            <span className="w-6 h-6 rounded-full bg-[#82181A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div className="flex-1">
              <p className="font-semibold text-neutral-900">Toque em Compartilhar</p>
              <p className="text-neutral-500 mt-0.5">
                No Safari do iPhone, toque no ícone de <b>Compartilhar</b> (o quadrado com a seta para cima 
                <span className="inline-block mx-1 align-middle text-blue-600 font-bold">⎋</span> na barra inferior).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
            <span className="w-6 h-6 rounded-full bg-[#82181A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <p className="font-semibold text-neutral-900">Adicionar à Tela de Início</p>
              <p className="text-neutral-500 mt-0.5">
                Role para baixo no menu e selecione a opção <b>"Adicionar à Tela de Início"</b> (com o ícone ➕).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
            <span className="w-6 h-6 rounded-full bg-[#82181A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </span>
            <div className="flex-1">
              <p className="font-semibold text-neutral-900">Abra pelo ícone e ative</p>
              <p className="text-neutral-500 mt-0.5">
                Abra o DHPB pelo novo ícone criado na tela de início do seu iPhone e clique em <b>"Ativar Notificações"</b>!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onFechar}
          className="w-full bg-[#82181A] text-white font-semibold text-xs py-3 rounded-2xl hover:bg-[#631214] transition-colors cursor-pointer shadow-md shadow-[#82181A]/20 mt-2"
        >
          Entendi, vou fazer isso!
        </button>
      </div>
    </div>
  )
}
