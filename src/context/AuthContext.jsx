import { createContext, useContext, useState } from 'react'
import { login as loginApi, logout as logoutApi } from '../api/auth'
import {
  getToken, setToken, removeToken,
  getUser,  setUser,  removeUser,
} from '../utils/token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUserState]  = useState(() => getUser())
  const [token, setTokenState] = useState(() => getToken())

  const signIn = async ({ email, password }) => {
    const { data } = await loginApi({ email, password })
    setToken(data.token)
    setUser(data.user)
    setTokenState(data.token)
    setUserState(data.user)
  }

  const signOut = async () => {
    try { await logoutApi() } catch { /* token may be expired */ }
    removeToken()
    removeUser()
    setTokenState(null)
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
