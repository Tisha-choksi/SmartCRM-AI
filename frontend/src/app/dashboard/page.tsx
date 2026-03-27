'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || '')
    })
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Welcome back!</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>{email}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 600 }}>
        {[
          { label: 'Total contacts', value: '0' },
          { label: 'Active deals', value: '0' },
          { label: 'Tasks due', value: '0' },
        ].map(card => (
          <div key={card.label} style={{ background: '#f7f7f5', borderRadius: 10, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 500 }}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}