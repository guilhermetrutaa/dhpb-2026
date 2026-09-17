import { carregarMainServiceAccount, ServiceAccountError, MSG_SA_AUSENTE } from '@/lib/admin/main-service-account'

export { ServiceAccountError }

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

const pemToDer = (pem) => {
  const b64 = String(pem || '').replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return buf
}

const gerarJWT = async (sa) => {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const agora = Math.floor(Date.now() / 1000)
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: agora + 3600,
      iat: agora,
    })
  )

  const entrada = `${header}.${payload}`
  let chave
  try {
    chave = await crypto.subtle.importKey(
      'pkcs8',
      pemToDer(sa.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  } catch (e) {
    throw new ServiceAccountError(`${MSG_SA_AUSENTE} (private_key PEM: ${e.message})`)
  }
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(entrada))
  return `${entrada}.${base64url(sig)}`
}

let _cache = null

const getAccessToken = async () => {
  if (_cache && _cache.expira > Date.now()) return _cache
  const sa = carregarMainServiceAccount()
  const jwt = await gerarJWT(sa)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new ServiceAccountError(`${MSG_SA_AUSENTE} (OAuth ${res.status}: ${txt.slice(0, 180)})`)
  }
  const { access_token } = await res.json()
  _cache = { token: access_token, projectId: sa.project_id, expira: Date.now() + 55 * 60 * 1000 }
  return _cache
}

class AuthRestError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code || ''
  }
}

const mapIdentityError = (status, bodyText) => {
  let parsed
  try {
    parsed = JSON.parse(bodyText)
  } catch {
    parsed = null
  }
  const message = String(parsed?.error?.message || bodyText || `HTTP ${status}`).slice(0, 300)
  const upper = message.toUpperCase()
  if (upper.includes('USER_NOT_FOUND') || status === 404) {
    return new AuthRestError('Conta Auth não encontrada.', 'auth/user-not-found')
  }
  if (upper.includes('EMAIL_EXISTS') || upper.includes('EMAIL_ALREADY_EXISTS')) {
    return new AuthRestError('Já existe uma conta com este e-mail.', 'auth/email-already-exists')
  }
  if (upper.includes('INVALID_EMAIL')) {
    return new AuthRestError('E-mail inválido.', 'auth/invalid-email')
  }
  return new AuthRestError(message, parsed?.error?.status || `http-${status}`)
}

const identityPost = async (path, body) => {
  const { token, projectId } = await getAccessToken()
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw mapIdentityError(res.status, text)
  return text ? JSON.parse(text) : {}
}

const serializarUser = (u) => ({
  uid: u.localId || u.uid || '',
  email: u.email || '',
  emailVerified: !!u.emailVerified,
  disabled: !!u.disabled,
  displayName: u.displayName || '',
  lastSignInAt: u.lastLoginAt
    ? new Date(Number(u.lastLoginAt)).toISOString()
    : (u.lastSignInAt || null),
  creationTime: u.createdAt
    ? new Date(Number(u.createdAt)).toISOString()
    : (u.creationTime || null),
})

export const lookupAuthUser = async ({ uid, email }) => {
  const body = uid
    ? { localId: [uid] }
    : { email: [String(email || '').trim().toLowerCase()] }
  const data = await identityPost('accounts:lookup', body)
  const user = (data.users || [])[0]
  if (!user) {
    const err = new AuthRestError('Conta Auth não encontrada.', 'auth/user-not-found')
    throw err
  }
  return serializarUser(user)
}

export const updateAuthUser = async ({ uid, email, password }) => {
  const payload = { localId: uid }
  if (email) payload.email = email
  if (password) payload.password = password
  const data = await identityPost('accounts:update', payload)
  return serializarUser({ ...data, localId: data.localId || uid })
}

export const createAuthUser = async ({ email, password, displayName }) => {
  const data = await identityPost('accounts', {
    email,
    password,
    displayName: displayName || '',
  })
  return serializarUser(data)
}

export const deleteAuthUser = async (uid) => {
  await identityPost('accounts:delete', { localId: uid })
  return { ok: true, uid }
}

const toFsString = (v) => ({ stringValue: String(v) })

export const setUsersDoc = async (uid, fields) => {
  const { token, projectId } = await getAccessToken()
  const keys = Object.keys(fields)
  const mask = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
  const fsFields = Object.fromEntries(keys.map((k) => [k, toFsString(fields[k])]))
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?${mask}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: fsFields }),
    }
  )
  if (!res.ok) {
    throw new Error(`Falha ao gravar users/${uid} no Firestore (${res.status}).`)
  }
}
