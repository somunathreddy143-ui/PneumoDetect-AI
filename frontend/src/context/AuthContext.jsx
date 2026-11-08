import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
  getCurrentUser as apiGetCurrentUser,
} from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('pneumo_access_token')
      if (token) {
        try {
          const userData = await apiGetCurrentUser()
          setUser(userData)
        } catch (err) {
          // Token expired or invalid
          localStorage.removeItem('pneumo_access_token')
          localStorage.removeItem('pneumo_refresh_token')
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()

    const handleExternalLogout = () => {
      setUser(null)
    }
    window.addEventListener('auth:logout', handleExternalLogout)
    return () => window.removeEventListener('auth:logout', handleExternalLogout)
  }, [])

  const login = async (email, password, rememberMe = false) => {
    const data = await apiLogin({ email, password, remember_me: rememberMe })
    localStorage.setItem('pneumo_access_token', data.access_token)
    localStorage.setItem('pneumo_refresh_token', data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const data = await apiRegister(formData)
    localStorage.setItem('pneumo_access_token', data.access_token)
    localStorage.setItem('pneumo_refresh_token', data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('pneumo_refresh_token')
    await apiLogout(refreshToken)
    localStorage.removeItem('pneumo_access_token')
    localStorage.removeItem('pneumo_refresh_token')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const u = await apiGetCurrentUser()
      setUser(u)
      return u
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

