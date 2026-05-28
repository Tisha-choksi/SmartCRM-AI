'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setSession } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setMsg('')
    setIsError(false)
    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login'
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIsError(true)
        setMsg(data.detail || 'Something went wrong')
        return
      }
      setSession(data.access_token, data.email)
      router.push('/dashboard')
    } catch {
      setIsError(true)
      setMsg('Could not connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[360px] mx-auto mt-20 px-4">
      <h1 className="text-[22px] font-medium mb-1">SmartCRM AI</h1>
      <p className="text-[13px] text-stone-400 mb-6">
        {mode === 'login' ? 'Sign in to your account' : 'Create a free account'}
      </p>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="mb-2.5 h-9"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
        className="mb-4 h-9"
      />
      <Button
        onClick={handleSubmit}
        disabled={loading || !email.trim() || !password.trim()}
        className="w-full h-9 bg-black text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
      {msg && (
        <p className={`mt-3 text-[13px] ${isError ? 'text-red-500' : 'text-[#185fa5]'}`}>{msg}</p>
      )}
      <p className="mt-4 text-[13px] text-center text-stone-400">
        {mode === 'login' ? 'No account? ' : 'Have an account? '}
        <span
          className="cursor-pointer text-[#185fa5] underline"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setMsg('')
            setIsError(false)
          }}
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </span>
      </p>
    </div>
  )
}
