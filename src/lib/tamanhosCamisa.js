// Spec 053: tamanho de camisa da final. Função pura, sem Firestore.

export const TAMANHOS = ['P', 'M', 'G', 'GG']

/** @returns {''|'presenca'|'ja'} */
export function motivoBloqueioTamanhos(data) {
  if (!data?.presencaFinalConfirmada) return 'presenca'
  if (data.tamanhosCamisa) return 'ja'
  return ''
}

export function tamanhoPorUid(tamanhosCamisa) {
  const map = {}
  for (const m of tamanhosCamisa?.membros || []) map[m.uid] = m.tamanho
  return map
}

export function indiceTamanhos(equipes) {
  const map = {}
  for (const eq of equipes || []) {
    for (const m of eq.tamanhosCamisa?.membros || []) {
      if (m.uid && TAMANHOS.includes(m.tamanho) && !map[m.uid]) map[m.uid] = m.tamanho
    }
  }
  return map
}

function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function htmlTamanhos(equipes) {
  const linhas = []
  const contagem = { P: 0, M: 0, G: 0, GG: 0, pendente: 0 }
  const indice = indiceTamanhos(equipes)
  const contados = new Set()
  for (const eq of equipes || []) {
    if (!eq.presencaFinalConfirmada) continue
    const map = tamanhoPorUid(eq.tamanhosCamisa)
    for (const m of (eq.membros || []).filter((x) => x.status === 'ativo')) {
      const tamanho = map[m.uid] || indice[m.uid] || ''
      if (!m.uid || !contados.has(m.uid)) {
        if (m.uid) contados.add(m.uid)
        if (contagem[tamanho] !== undefined) contagem[tamanho] += 1
        else contagem.pendente += 1
      }
      linhas.push(
        `<tr><td>${esc(eq.nome)}</td><td>${esc(eq.escola)}</td><td>${esc(m.nome)}</td><td>${esc((m.papel || '').replace(/_/g, ' '))}</td><td>${esc(tamanho || '—')}</td></tr>`
      )
    }
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Tamanhos das camisas — final</title>
<style>
  body { font-family: sans-serif; margin: 32px; color: #111; }
  h1 { color: #82181A; font-size: 22px; }
  p { margin: 8px 0 0; }
  table { border-collapse: collapse; width: 100%; margin-top: 16px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
  th { background: #82181A; color: #fff; }
</style>
</head>
<body>
<h1>Tamanhos das camisas — final</h1>
<p>P: ${contagem.P} · M: ${contagem.M} · G: ${contagem.G} · GG: ${contagem.GG} · Sem tamanho: ${contagem.pendente}</p>
<table>
<thead><tr><th>Equipe</th><th>Escola</th><th>Nome</th><th>Papel</th><th>Tamanho</th></tr></thead>
<tbody>
${linhas.join('\n')}
</tbody>
</table>
</body>
</html>`
}
