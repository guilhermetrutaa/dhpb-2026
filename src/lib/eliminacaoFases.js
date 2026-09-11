export const NIVEIS_APROVACAO = ['fase1', 'fase2', 'fase3', 'fase4', 'fase_final']

export function getRede(tipoEscola) {
  if (tipoEscola === 'publica' || tipoEscola === 'federal' || tipoEscola === 'estadual' || tipoEscola === 'municipal') {
    return 'publica'
  }
  return 'particular'
}

export function ehPublica(tipoEscola) {
  return getRede(tipoEscola) === 'publica'
}

export function nivelIndex(aprovadoAte) {
  return NIVEIS_APROVACAO.indexOf(aprovadoAte || '')
}

export function jaLiberadaPara(equipe, destino) {
  return nivelIndex(equipe.aprovadoAte) >= nivelIndex(destino)
}

export function notaBruta(equipe, faseId) {
  if (!faseId) return 0
  return Number(equipe.pontuacao?.[faseId]?.ni || 0)
}

export function compareRanking(a, b, faseIds) {
  const dfA = Number(a.df || 0)
  const dfB = Number(b.df || 0)
  if (dfB !== dfA) return dfB - dfA
  const n3 = notaBruta(b, faseIds[2]) - notaBruta(a, faseIds[2])
  if (n3 !== 0) return n3
  const n2 = notaBruta(b, faseIds[1]) - notaBruta(a, faseIds[1])
  if (n2 !== 0) return n2
  return notaBruta(b, faseIds[0]) - notaBruta(a, faseIds[0])
}

export function mesmaChave(a, b, faseIds) {
  return compareRanking(a, b, faseIds) === 0
}

export function takeWithTies(sorted, n, mesma) {
  if (n <= 0) return []
  if (sorted.length <= n) return sorted.slice()
  const corte = sorted[n - 1]
  return sorted.filter((eq, i) => i < n || mesma(eq, corte))
}

const MINIMO_ORIGEM = {
  fase2: -1,
  fase3: 1,
  fase4: 2,
  fase_final: 3,
}

export function candidatas(equipes, destino) {
  const min = MINIMO_ORIGEM[destino]
  if (min === undefined) return []
  return equipes.filter((eq) => nivelIndex(eq.aprovadoAte) >= min)
}

function marcarStatus(equipe, destino, passa, motivo = '') {
  if (jaLiberadaPara(equipe, destino)) return { ...equipe, status: 'ja_liberada', motivo }
  if (passa) return { ...equipe, status: 'aprovar', motivo }
  return { ...equipe, status: 'nao_passa', motivo: '' }
}

export function selecionarPorNotaMinima(equipes, { destino, faseId, minimo }) {
  return candidatas(equipes, destino).map((eq) => {
    const ni = notaBruta(eq, faseId)
    return { ...marcarStatus(eq, destino, ni >= minimo), ni }
  })
}

export function selecionarAmplaEReservadas(equipes, { destino, faseIds, vagasAC, vagasVR }) {
  const lista = candidatas(equipes, destino).slice().sort((a, b) => compareRanking(a, b, faseIds))
  const mesma = (a, b) => mesmaChave(a, b, faseIds)
  const ac = takeWithTies(lista, vagasAC, mesma)
  const acIds = new Set(ac.map((eq) => eq.id))
  const resto = lista.filter((eq) => !acIds.has(eq.id))
  const vr = takeWithTies(resto.filter((eq) => ehPublica(eq.tipoEscola)), vagasVR, mesma)
  const vrIds = new Set(vr.map((eq) => eq.id))

  return lista.map((eq) => {
    if (acIds.has(eq.id)) return marcarStatus(eq, destino, true, 'ampla')
    if (vrIds.has(eq.id)) return marcarStatus(eq, destino, true, 'reservada')
    return marcarStatus(eq, destino, false)
  })
}

export function selecionarFinal(equipes, { destino, faseIds, vagasTotais, vagasACInicial, minimoPublicas }) {
  const lista = candidatas(equipes, destino).slice().sort((a, b) => compareRanking(a, b, faseIds))
  const mesma = (a, b) => mesmaChave(a, b, faseIds)
  const selectedIds = new Set()
  const motivos = new Map()

  const marcar = (eqs, motivo) => {
    eqs.forEach((eq) => {
      if (selectedIds.has(eq.id)) return
      selectedIds.add(eq.id)
      motivos.set(eq.id, motivo)
    })
  }

  marcar(takeWithTies(lista, vagasACInicial, mesma), 'ampla')
  const publicasNoBloco = lista.filter((eq) => selectedIds.has(eq.id) && ehPublica(eq.tipoEscola)).length
  if (publicasNoBloco < minimoPublicas) {
    const falta = minimoPublicas - publicasNoBloco
    const restoPub = lista.filter((eq) => !selectedIds.has(eq.id) && ehPublica(eq.tipoEscola))
    marcar(takeWithTies(restoPub, falta, mesma), 'reserva_publica')
  }
  const faltaTotal = vagasTotais - selectedIds.size
  if (faltaTotal > 0) {
    const resto = lista.filter((eq) => !selectedIds.has(eq.id))
    marcar(takeWithTies(resto, faltaTotal, mesma), 'geral')
  }

  return lista.map((eq) => marcarStatus(eq, destino, selectedIds.has(eq.id), motivos.get(eq.id) || ''))
}

export function gerarPreview(equipes, destino, params) {
  if (destino === 'fase2') {
    return selecionarPorNotaMinima(equipes, {
      destino,
      faseId: params.faseIds[0],
      minimo: params.minimo,
    })
  }
  if (destino === 'fase3') {
    return selecionarPorNotaMinima(equipes, {
      destino,
      faseId: params.faseIds[1],
      minimo: params.minimo,
    })
  }
  if (destino === 'fase4') {
    return selecionarAmplaEReservadas(equipes, {
      destino,
      faseIds: params.faseIds,
      vagasAC: params.vagasAC,
      vagasVR: params.vagasVR,
    })
  }
  if (destino === 'fase_final') {
    return selecionarFinal(equipes, {
      destino,
      faseIds: params.faseIds,
      vagasTotais: params.vagasTotais,
      vagasACInicial: params.vagasACInicial,
      minimoPublicas: params.minimoPublicas,
    })
  }
  return []
}
