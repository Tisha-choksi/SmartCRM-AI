'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [msg, setMsg]           = useState('')
  const router = useRouter()

  async function handleSubmit() {
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      setMsg(error ? error.message : 'Check your email to confirm!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else router.push('/dashboard')
    }
  }

  return (
    <div style={{maxWidth:360,margin:'80px auto',padding:'0 1rem'}}>
      <h1 style={{fontSize:22,fontWeight:500,marginBottom:8}}>SmartCRM AI</h1>
      <input type="email" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)} style={{width:'100%',marginBottom:10}}/>
      <input type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)} style={{width:'100%',marginBottom:16}}/>
      <button onClick={handleSubmit} style={{width:'100%',padding:'10px 0'}}>
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
      {msg && <p style={{marginTop:12,fontSize:13}}>{msg}</p>}
    </div>
  )
}