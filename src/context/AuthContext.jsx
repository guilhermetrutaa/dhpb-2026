'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, collection, query, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})
const TTL_CACHE = 5 * 60 * 1000

const lerCache = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (!ts || Date.now() - ts > TTL_CACHE) return null
    return data
  } catch { return null }
}

const gravarCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

const removerCache = (key) => {
  try { localStorage.removeItem(key) } catch {}
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [edicoes, setEdicoes] = useState([])
  const router = useRouter()

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
      if (!user) {
        setUserData(null)
        setEdicoes([])
        setLoading(false)
      }
    })

    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!authUser) return

    const chave = `dhpb_userdata_${authUser.uid}`
    const cacheado = lerCache(chave)
    if (cacheado) {
      setUserData(cacheado)
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'users', authUser.uid))
        const dados = snap.exists() ? snap.data() : {}
        setUserData(dados)
        gravarCache(chave, dados)
      } catch {
        setUserData({})
      }
      setLoading(false)
    })()
  }, [authUser])

  useEffect(() => {
    if (!authUser) return
    const cacheado = lerCache('dhpb_edicoes')
    if (cacheado) { setEdicoes(cacheado); return }
    ;(async () => {
      try {
        const q = query(collection(db, 'edicoes'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setEdicoes(dados)
        gravarCache('dhpb_edicoes', dados)
      } catch {}
    })()
  }, [authUser])

  const logout = async () => {
    removerCache(`dhpb_userdata_${authUser?.uid}`)
    await signOut(auth)
    router.push('/')
  }

  const refreshUserData = async () => {
    if (!authUser) return
    const chave = `dhpb_userdata_${authUser.uid}`
    try {
      const snap = await getDoc(doc(db, 'users', authUser.uid))
      if (snap.exists()) {
        setUserData(snap.data())
        gravarCache(chave, snap.data())
      }
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ authUser, userData, loading, logout, edicoes, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
