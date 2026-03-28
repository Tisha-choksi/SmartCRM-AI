'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const [email, setEmail]       = useState('')
  const [contacts, setContacts] = useState(0)
  const [deals, setDeals]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || '')
      const [{ count: cc }, { data: dd }] = await Promise.all([
        supabase.from('contacts').select('*', { count:'exact', head:true }),
        supabase.from('deals').select('*')
      ])
      setContacts(cc || 0)
      setDeals(dd || [])
      setLoading(false)
    }
    load()
  }, [])

  const wonValue  = deals.filter(d=>d.stage==='won').reduce((s,d)=>s+(d.value||0),0)
  const activeDeals = deals.filter(d=>d.stage!=='won'&&d.stage!=='lost').length

  const cards = [
    { label:'Total contacts', value: loading ? '—' : contacts.toString(),
      href:'/dashboard/contacts', color:'#185fa5' },
    { label:'Active deals',   value: loading ? '—' : activeDeals.toString(),
      href:'/dashboard/deals', color:'#0f6e56' },
    { label:'Won value',      value: loading ? '—' : '$'+wonValue.toLocaleString(),
      href:'/dashboard/deals', color:'#854f0b' },
  ]

  const quickActions = [
    { label:'Scan business card', href:'/dashboard/contacts', desc:'Add contact from photo' },
    { label:'Ask AI about docs',  href:'/dashboard/contacts', desc:'RAG document Q&A' },
    { label:'Draft follow-up',    href:'/dashboard/agents',   desc:'AI email drafting' },
    { label:'Generate digest',    href:'/dashboard/agents',   desc:'Weekly pipeline summary' },
  ]

  return (
    <div style={{maxWidth:700}}>
      <h1 style={{fontSize:22,fontWeight:500,marginBottom:4}}>Welcome back!</h1>
      <p style={{color:'#888',fontSize:13,marginBottom:32}}>{email}</p>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:32}}>
        {cards.map(c=>(
          <Link key={c.label} href={c.href} style={{textDecoration:'none'}}>
            <div style={{background:'#f7f7f5',borderRadius:10,padding:'16px 20px',
              border:'0.5px solid #e5e5e0',cursor:'pointer',transition:'all .15s'}}>
              <p style={{fontSize:12,color:'#888',marginBottom:6}}>{c.label}</p>
              <p style={{fontSize:28,fontWeight:500,color:c.color}}>{c.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <p style={{fontSize:13,fontWeight:500,marginBottom:12}}>Quick actions</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {quickActions.map(a=>(
          <Link key={a.label} href={a.href} style={{textDecoration:'none'}}>
            <div style={{border:'0.5px solid #e5e5e0',borderRadius:10,padding:'12px 14px',
              cursor:'pointer'}}>
              <p style={{fontSize:13,fontWeight:500,marginBottom:2}}>{a.label}</p>
              <p style={{fontSize:11,color:'#888'}}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}