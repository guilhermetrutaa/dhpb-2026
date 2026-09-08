import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let jwks = null

const getJwks = () => {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL))
  return jwks
}

export const verificarTokenFirebase = async (tokenId) => {
  if (!tokenId) throw new Error('Token não informado')
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID não configurado')

  const payload = await jwtVerify(tokenId, getJwks(), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  })

  return payload.payload
}
