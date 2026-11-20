import { jsPDF } from 'jspdf'

const CATEGORIA = {
  ouro: 'Medalha de Ouro',
  prata: 'Medalha de Prata',
  bronze: 'Medalha de Bronze',
  cristal: 'Medalha de Cristal (Menção Honrosa)',
}

export function pdfCapas(linhas) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  linhas.forEach((linha, i) => {
    if (i > 0) doc.addPage()
    const W = doc.internal.pageSize.getWidth()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(36)
    doc.text(`Sala ${linha.numero}`, W / 2, 200, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text('ID da equipe', W / 2, 280, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(doc.splitTextToSize(String(linha.id), W - 96), W / 2, 330, { align: 'center' })
  })
  return doc
}

export function pdfCertificadoFinal({ nome, equipe, colocacao, premiacao }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFont('times', 'bold')
  doc.setFontSize(26)
  doc.text('4º DHPB — Certificado de premiação', 48, 90)
  doc.setFontSize(22)
  doc.text(String(nome || ''), 48, 170)
  doc.setFont('times', 'normal')
  doc.setFontSize(16)
  doc.text(`Equipe: ${equipe || ''}`, 48, 220)
  doc.text(`Colocação: ${colocacao}º`, 48, 250)
  doc.text(`Categoria: ${CATEGORIA[premiacao] || premiacao || ''}`, 48, 280)
  return doc
}
