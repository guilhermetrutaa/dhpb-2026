/**
 * Firestore REST API helper
 * Substitui o firebase-admin para evitar ERR_REQUIRE_ESM no Turbopack.
 * Usa apenas fetch + Web Crypto API (nativas do Node.js 18+).
 */

// ─── Base64url ───────────────────────────────────────────────────────────────
const base64url = (data) => {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data
  let bin = ''
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ─── PEM → DER ───────────────────────────────────────────────────────────────
const pemToDer = (pem) => {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return buf
}

// ─── Service Account ─────────────────────────────────────────────────────────
const carregarSA = () => {
  const rawB64 = process.env.SUPPORT_SERVICE_ACCOUNT_BASE64
  const rawJson = process.env.SUPPORT_SERVICE_ACCOUNT
  if (!rawB64 && !rawJson) throw new Error('SUPPORT_SERVICE_ACCOUNT não configurada')
  const json = rawB64 ? Buffer.from(rawB64, 'base64').toString('utf8') : rawJson
  const sa = JSON.parse(json)
  if (typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  }
  return sa
}

export const getProjectId = () => {
  const rawB64 = process.env.SUPPORT_SERVICE_ACCOUNT_BASE64
  const rawJson = process.env.SUPPORT_SERVICE_ACCOUNT
  const json = rawB64 ? Buffer.from(rawB64, 'base64').toString('utf8') : rawJson
  return JSON.parse(json).project_id
}

// ─── JWT + Access Token ───────────────────────────────────────────────────────
const gerarJWT = async (sa) => {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const agora = Math.floor(Date.now() / 1000)
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: agora + 3600,
      iat: agora,
    })
  )

  const entrada = `${header}.${payload}`
  const chave = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(entrada))
  return `${entrada}.${base64url(sig)}`
}

let _cache = null

export const getToken = async () => {
  if (_cache && _cache.expira > Date.now()) return _cache.token
  const sa = carregarSA()
  const jwt = await gerarJWT(sa)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Token Google falhou: ${await res.text()}`)
  const { access_token } = await res.json()
  _cache = { token: access_token, expira: Date.now() + 55 * 60 * 1000 }
  return access_token
}

// ─── Conversão de tipos Firestore ─────────────────────────────────────────────
const toFs = (v) => {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  return { stringValue: String(v) }
}

const fromFs = (v) => {
  if (!v) return null
  if ('nullValue' in v) return null
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return parseInt(v.integerValue, 10)
  if ('doubleValue' in v) return v.doubleValue
  if ('stringValue' in v) return v.stringValue
  if ('timestampValue' in v) return v.timestampValue
  if ('mapValue' in v) return fromFsFields(v.mapValue.fields || {})
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFs)
  return null
}

const fromFsFields = (fields) =>
  Object.fromEntries(Object.entries(fields || {}).map(([k, v]) => [k, fromFs(v)]))

// ─── URLs base ────────────────────────────────────────────────────────────────
const BASE = (pid) =>
  `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`

const docName = (pid, path) =>
  `projects/${pid}/databases/(default)/documents/${path}`

// ─── GET ──────────────────────────────────────────────────────────────────────
export const fsGet = async (projectId, docPath, token) => {
  const res = await fetch(`${BASE(projectId)}/${docPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return { exists: false, data: null }
  if (!res.ok) throw new Error(`fsGet ${res.status}: ${await res.text()}`)
  const doc = await res.json()
  return { exists: true, data: fromFsFields(doc.fields || {}) }
}

export const fsGetCollection = async (projectId, collectionPath, token) => {
  const res = await fetch(`${BASE(projectId)}/${collectionPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`fsGetCollection ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.documents) return []
  return data.documents.map((doc) => ({
    id: doc.name.split('/').pop(),
    ...fromFsFields(doc.fields || {}),
  }))
}

// ─── UPDATE simples ───────────────────────────────────────────────────────────
export const fsUpdate = async (projectId, docPath, fields, token) => {
  const keys = Object.keys(fields)
  const mask = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
  const fsFields = Object.fromEntries(keys.map((k) => [k, toFs(fields[k])]))
  const res = await fetch(`${BASE(projectId)}/${docPath}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fsFields }),
  })
  if (!res.ok) throw new Error(`fsUpdate ${res.status}: ${await res.text()}`)
}

// ─── ADD (cria documento com ID aleatório) ────────────────────────────────────
export const fsAdd = async (projectId, collectionPath, fields, token) => {
  const fsFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toFs(v)]))
  const res = await fetch(`${BASE(projectId)}/${collectionPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fsFields }),
  })
  if (!res.ok) throw new Error(`fsAdd ${res.status}: ${await res.text()}`)
}

// ─── BATCH WRITE (para serverTimestamp + increment) ───────────────────────────
export const fsBatchWrite = async (projectId, writes, token) => {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes }),
    }
  )
  if (!res.ok) throw new Error(`fsBatchWrite ${res.status}: ${await res.text()}`)
}

/**
 * Update com server timestamp automático nos campos indicados.
 */
export const fsUpdateComTimestamp = async (projectId, docPath, fields, camposTimestamp, token) => {
  const name = docName(projectId, docPath)
  const allKeys = [...Object.keys(fields), ...camposTimestamp]
  const fsFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toFs(v)]))
  await fsBatchWrite(
    projectId,
    [
      {
        update: { name, fields: fsFields },
        updateMask: { fieldPaths: allKeys },
        updateTransforms: camposTimestamp.map((f) => ({
          fieldPath: f,
          setToServerValue: 'REQUEST_TIME',
        })),
      },
    ],
    token
  )
}

/**
 * Update com increment + server timestamp.
 * incrementos: [['nomeCampo', quantidade], ...]
 */
export const fsUpdateComIncremento = async (
  projectId,
  docPath,
  fields,
  incrementos,
  camposTimestamp,
  token
) => {
  const name = docName(projectId, docPath)
  const fsFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toFs(v)]))
  const transforms = [
    ...incrementos.map(([f, qtd]) => ({
      fieldPath: f,
      increment: { integerValue: String(qtd) },
    })),
    ...camposTimestamp.map((f) => ({
      fieldPath: f,
      setToServerValue: 'REQUEST_TIME',
    })),
  ]
  await fsBatchWrite(
    projectId,
    [
      {
        update: { name, fields: fsFields },
        updateMask: { fieldPaths: Object.keys(fields) },
        updateTransforms: transforms,
      },
    ],
    token
  )
}

/**
 * Add com server timestamp (gera ID aleatório).
 */
export const fsAddComTimestamp = async (
  projectId,
  collectionPath,
  fields,
  camposTimestamp,
  token
) => {
  const randomId = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(36))
    .join('')
  const name = docName(projectId, `${collectionPath}/${randomId}`)
  const fsFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toFs(v)]))
  await fsBatchWrite(
    projectId,
    [
      {
        update: { name, fields: fsFields },
        updateTransforms: camposTimestamp.map((f) => ({
          fieldPath: f,
          setToServerValue: 'REQUEST_TIME',
        })),
      },
    ],
    token
  )
}

// ─── Envio de FCM (Push) ──────────────────────────────────────────────────────
export const fsSendFcm = async (projectId, tokenFCM, accessToken, title, bodyStr, url) => {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: tokenFCM,
          notification: {
            title,
            body: bodyStr,
          },
          webpush: {
            fcm_options: {
              link: url || '/',
            },
          },
        },
      }),
    }
  )
  if (!res.ok) {
    console.error(`[fsSendFcm] Falha: ${res.status} ${await res.text()}`)
  }
}
