export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
}

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
}
