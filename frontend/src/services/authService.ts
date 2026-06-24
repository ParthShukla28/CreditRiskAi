import api from './api'

export interface LoginPayload { email: string; password: string }
export interface User {
  id: string; firstName: string; lastName: string; email: string; role: string
}

export const authService = {
  async login(payload: LoginPayload) {
    const res = await api.post('/auth/login', payload)
    const { token, user } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    return user as User
  },

  async logout() {
    try { await api.post('/auth/logout') } catch (_) {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await api.get('/auth/me')
      return res.data.user
    } catch { return null }
  },

  getCurrentUser(): User | null {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token')
  },
}
