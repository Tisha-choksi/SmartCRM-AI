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
      <h1 style={{fontSize:22,fontWeight:500,marginBottom:4}}>SmartCRM AI</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>
        {mode==='login' ? 'Sign in to your account' : 'Create a free account'}
      </p>
      <input
        type="email" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)}
        style={{width:'100%',marginBottom:10,padding:'8px 12px',border:'0.5px solid #ccc',borderRadius:8,fontSize:14}}
      />
      <input
        type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)}
        style={{width:'100%',marginBottom:16,padding:'8px 12px',border:'0.5px solid #ccc',borderRadius:8,fontSize:14}}
      />
      <button
        onClick={handleSubmit}
        style={{width:'100%',padding:'10px 0',background:'#000',color:'#fff',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}
      >
        {mode==='login' ? 'Sign in' : 'Create account'}
      </button>
      {msg && <p style={{marginTop:12,fontSize:13,color:'#185fa5'}}>{msg}</p>}
      <p style={{marginTop:16,fontSize:13,textAlign:'center',color:'#888'}}>
        {mode==='login' ? "No account? " : "Have an account? "}
        <span
          style={{cursor:'pointer',color:'#185fa5',textDecoration:'underline'}}
          onClick={() => { setMode(mode==='login'?'signup':'login'); setMsg('') }}
        >
          {mode==='login' ? 'Sign up' : 'Sign in'}
        </span>
      </p>
    </div>
  )
}