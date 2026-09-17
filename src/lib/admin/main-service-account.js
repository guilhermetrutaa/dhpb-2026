export class ServiceAccountError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ServiceAccountError'
  }
}

export const MSG_SA_AUSENTE =
  'MAIN_SERVICE_ACCOUNT ausente ou inválida no servidor. No Vercel use JSON em uma linha ou MAIN_SERVICE_ACCOUNT_BASE64, depois Redeploy.'

const stripWrappingQuotes = (raw) => {
  let s = String(raw || '').trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1)
  }
  return s.trim()
}

const parseServiceAccountJson = (raw) => {
  const s = stripWrappingQuotes(raw)
  const tentativas = [s]
  if (s.includes('\n') || s.includes('\r')) {
    tentativas.push(s.replace(/\r?\n/g, '\\n'))
  }

  let lastErr
  for (const candidate of tentativas) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
      if (typeof parsed === 'string') {
        return parseServiceAccountJson(parsed)
      }
    } catch (e) {
      lastErr = e
    }
  }

  throw new ServiceAccountError(
    `${MSG_SA_AUSENTE} (JSON: ${lastErr?.message || 'inválido'})`
  )
}

export const carregarMainServiceAccount = () => {
  const rawB64 = process.env.MAIN_SERVICE_ACCOUNT_BASE64
  const rawSa = process.env.MAIN_SERVICE_ACCOUNT

  if (!rawB64 && !rawSa) {
    throw new ServiceAccountError(MSG_SA_AUSENTE)
  }

  let json
  if (rawB64) {
    try {
      json = Buffer.from(String(rawB64).trim(), 'base64').toString('utf8')
    } catch (e) {
      throw new ServiceAccountError(`${MSG_SA_AUSENTE} (BASE64: ${e.message})`)
    }
  } else {
    json = rawSa
  }

  const parsed = parseServiceAccountJson(json)

  if (typeof parsed.private_key === 'string') {
    let k = parsed.private_key.replace(/\r\n/g, '\n').trim()
    for (let i = 0; i < 3 && k.includes('\\n'); i++) {
      k = k.replace(/\\n/g, '\n')
    }
    if (k.includes('BEGIN') && !k.includes('\n')) {
      k = k
        .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
        .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----\n')
    }
    parsed.private_key = k
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new ServiceAccountError(`${MSG_SA_AUSENTE} (faltam project_id, client_email ou private_key)`)
  }

  return parsed
}
