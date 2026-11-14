// Spec 059: PDF do certificado montado direto no jsPDF (sem captura do DOM).
// Posições e tamanhos espelham as porcentagens da prévia em tela.
import { jsPDF } from 'jspdf'

/**
 * @param {object} p
 * @param {HTMLImageElement|string} p.fundo imagem ou data URL de /certificado-fundo.jpg
 * @param {Array<[string, boolean]>} p.conclusao trechos [texto, negrito] da última linha
 */
export function gerarCertificadoPdf({ fundo, nome, equipe, orientador, colegas, escola, modalidade, conclusao, data }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const x = 0.071 * W

  doc.addImage(fundo, 'JPEG', 0, 0, W, H)
  doc.setTextColor(0, 0, 0)

  const escrever = (texto, tx, ty, tamanho, negrito = false) => {
    doc.setFont('times', negrito ? 'bold' : 'normal')
    doc.setFontSize(tamanho)
    doc.text(texto, tx, ty, { baseline: 'top' })
    return doc.getTextWidth(texto)
  }

  const linha = (trechos, ty, tamanho) => {
    let tx = x
    for (const [texto, negrito] of trechos) tx += escrever(texto, tx, ty, tamanho, negrito)
  }

  const campo = (rotulo, valor, cx, cy, largura, tamanho, lh) => {
    const lr = escrever(`${rotulo} `, cx, cy, tamanho, true)
    doc.setFont('times', 'normal')
    const linhas = doc.splitTextToSize(String(valor || ''), largura - lr)
    linhas.forEach((l, i) => doc.text(l, cx + lr, cy + i * lh, { baseline: 'top' }))
    return cy + Math.max(linhas.length, 1) * lh
  }

  escrever('Certificado', x, 0.103 * H, 0.0355 * W, true)

  const corpo = 0.0102 * W
  doc.setFont('times', 'normal')
  doc.setFontSize(corpo)
  const intro = doc.splitTextToSize(
    'A Comissão Organizadora do 4º Desafio em História da Paraíba - DHPB 2026, composta por docentes do Instituto Federal de Educação, Ciência e Tecnologia da Paraíba - IFPB, certifica que',
    0.68 * W
  )
  doc.text(intro, x, 0.202 * H, { baseline: 'top', lineHeightFactor: 1.34 })

  escrever(String(nome || '').toUpperCase(), x, 0.288 * H, 0.0278 * W, true)

  const lhDados = corpo * 1.45
  let y = 0.385 * H
  y = campo('Equipe:', equipe, x, y, 0.372 * W, corpo, lhDados)
  y = campo('Orientada por:', orientador, x, y, 0.372 * W, corpo, lhDados)
  campo('Composta por:', colegas, x, y, 0.372 * W, corpo, lhDados)
  const x2 = 0.515 * W
  y = campo('Escola:', escola, x2, 0.385 * H, 0.276 * W, corpo, lhDados)
  campo('Modalidade:', modalidade, x2, y, 0.276 * W, corpo, lhDados)

  const fim = 0.01 * W
  linha([
    ['participou do ', false],
    ['4º Desafio em História da Paraíba', true],
    [', realizado de 10 de setembro a 10 de dezembro de 2026.', false],
  ], 0.508 * H, fim)
  linha(conclusao, 0.508 * H + fim * 1.34, fim)

  escrever(`Campina Grande, ${data}.`, x, 0.608 * H, fim)

  return doc
}
