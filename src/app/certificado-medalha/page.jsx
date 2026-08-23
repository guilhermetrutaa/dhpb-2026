'use client'

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Poppins } from 'next/font/google'
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const CertificadoContent = () => {
    const { authUser, userData, loading } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()

    const equipeId = searchParams.get('equipeId')
    const premiacao = searchParams.get('premiacao') || 'honrosa'

    const [equipe, setEquipe] = useState(null)
    const [carregando, setCarregando] = useState(true)
    const [baixando, setBaixando] = useState(false)
    const certificadoRef = useRef(null)

    useEffect(() => {
        if (!loading && !authUser) router.push('/login')
    }, [loading, authUser, router])

    useEffect(() => {
        if (!equipeId) return
        const fetchEquipe = async () => {
            try {
                const snap = await getDoc(doc(db, 'equipes', equipeId))
                if (snap.exists()) setEquipe({ id: snap.id, ...snap.data() })
            } catch (e) {
                console.error(e)
            } finally {
                setCarregando(false)
            }
        }
        fetchEquipe()
    }, [equipeId])

    if (loading || carregando || !authUser) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Carregando Certificado...</div>
    }

    if (!equipe) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Equipe não encontrada.</div>
    }

    // Tratamento de dados
    const nomeParticipante = userData?.nome ? `${userData.nome} ${userData.sobrenome || ''}`.trim() : 'Nome Indisponível'
    const membros = equipe.membros || []

    const orientadora = membros.find(m => m.papel === 'professor' || m.tipo === 'professor')
    const nomeOrientadora = orientadora ? orientadora.nome : 'Sem orientador(a)'

    const colegas = membros.filter(m => (m.papel !== 'professor' && m.tipo !== 'professor') && m.uid !== authUser.uid)
    const nomeColegas = colegas.map(c => c.nome).join(', ') || 'Nenhum outro membro'

    const modalidade = (equipe.modalidade || '').replace('_', ' ').toUpperCase()

    const nomeMedalha = {
        'ouro': 'MEDALHA DE OURO',
        'prata': 'MEDALHA DE PRATA',
        'bronze': 'MEDALHA DE BRONZE',
        'honrosa': 'MENÇÃO HONROSA'
    }[premiacao] || 'MENÇÃO HONROSA'

    const hoje = new Date()
    const dataExtenso = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`

    const handleDownloadPDF = async () => {
        if (!certificadoRef.current) return
        setBaixando(true)
        try {
            const canvas = await html2canvas(certificadoRef.current, {
                scale: 2,
                useCORS: true,
            })
            const imgData = canvas.toDataURL('image/jpeg', 1.0)

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            })

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
            pdf.save(`Certificado_DHPB_${nomeParticipante.replace(/\s+/g, '_')}.pdf`)
        } catch (e) {
            alert("Erro ao gerar PDF.")
        } finally {
            setBaixando(false)
        }
    }

    return (
        <main className="min-h-screen bg-neutral-200 p-2 font-times text-black print:bg-white print:p-0 flex flex-col items-center py-10 relative">
            <div className={poppins.className}>
                <div className="mb-6 print:hidden">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={baixando}
                        className="bg-neutral-200 text-[#82181A] border-2 border-[#82181A] px-8 py-4 font-medium text-lg  transition-colors flex items-center gap-3 cursor-pointer"
                    >
                        {baixando ? 'Gerando PDF...' : 'Baixar PDF em Alta Qualidade'}
                    </button>
                </div>
            </div>

            <section
                ref={certificadoRef}
                style={{ backgroundImage: "url(/certificado-fundo.svg)" }}
                className="relative aspect-[2000/1414] w-full max-w-[1400px] overflow-hidden bg-[#fff8eb] bg-cover bg-center shadow-xl print:max-w-none print:shadow-none"
            >
                <h1 className="absolute left-[7.1%] top-[10.3%] text-[clamp(2.15rem,3.55vw,4.55rem)] font-bold leading-none">
                    Certificado
                </h1>

                <p className="absolute left-[7.1%] top-[20.2%] w-[68%] text-[clamp(0.72rem,1.02vw,1.28rem)] leading-[1.34]">
                    A Comissão Organizadora do 4º Desafio em História da Paraíba - DHPB 2026,
                    composta por docentes do Instituto Federal de Educação, Ciência e Tecnologia
                    da Paraíba - IFPB, certifica que
                </p>

                <h2 className="absolute left-[7.1%] top-[28.8%] text-[clamp(1.55rem,2.78vw,3.55rem)] font-bold leading-none uppercase">
                    {nomeParticipante}
                </h2>

                <div className="absolute left-[7.1%] top-[38.5%] grid w-[72%] grid-cols-[1.08fr_0.8fr] gap-x-[10%] text-[clamp(0.72rem,1.02vw,1.28rem)] leading-[1.45]">
                    <div>
                        <p><strong>Equipe:</strong> {equipe.nome}</p>
                        <p><strong>Orientada por:</strong> {nomeOrientadora}</p>
                        <p><strong>Composta por:</strong> {nomeColegas}</p>
                    </div>

                    <div>
                        <p><strong>Escola:</strong> {equipe.escola}</p>
                        <p><strong>Modalidade:</strong> {modalidade}</p>
                    </div>
                </div>

                <p className="absolute left-[7.1%] top-[50.8%] w-[74%] text-[clamp(0.72rem,1vw,1.25rem)] leading-[1.34]">
                    participou do <strong>4º Desafio em História da Paraíba</strong>, realizado
                    de 10 de setembro a 10 de dezembro de 2026.
                    <br />
                    Por seu desempenho, conquistou <strong>{nomeMedalha}</strong>
                </p>

                <p className="absolute left-[7.1%] top-[60.8%] text-[clamp(0.72rem,1vw,1.25rem)] leading-none">
                    Campina Grande, {dataExtenso}.
                </p>
            </section>
        </main>
    )
}

export default function CertificadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xl">Carregando...</div>}>
      <CertificadoContent />
    </Suspense>
  )
}
