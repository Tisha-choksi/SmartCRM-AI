const TOKEN_KEY = 'crm_token'
const EMAIL_KEY = 'crm_email'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(EMAIL_KEY) || ''
}
