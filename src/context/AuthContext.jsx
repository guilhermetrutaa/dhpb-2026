'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, getDocs, collection, query, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

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
        setLoading(false)
      }
    })

    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!authUser) return

    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'users', authUser.uid))
        if (snap.exists()) setUserData(snap.data())
        else setUserData({})
      } catch {
        setUserData({})
      }
      setLoading(false)
    })()
  }, [authUser])

  useEffect(() => {
    if (!authUser) return
    ;(async () => {
      try {
        const q = query(collection(db, 'edicoes'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        setEdicoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {}
    })()
  }, [authUser])

  const logout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const refreshUserData = async () => {
    if (!authUser) return
    try {
      const snap = await getDoc(doc(db, 'users', authUser.uid))
      if (snap.exists()) setUserData(snap.data())
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ authUser, userData, loading, logout, edicoes, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
