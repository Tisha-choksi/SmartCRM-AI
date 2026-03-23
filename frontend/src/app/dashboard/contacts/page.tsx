'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    const { data } = await supabase.from('contacts').select('*').order('created_at',{ascending:false})
    setContacts(data||[])
  }
  async function addContact() {
    const { data:{user} } = await supabase.auth.getUser()
    await supabase.from('contacts').insert({name,email,company,user_id:user!.id})
    setAdding(false); setName(''); setEmail(''); setCompany(''); load()
  }
  useEffect(()=>{load()},[])

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:500}}>Contacts</h1>
        <button onClick={()=>setAdding(true)}>+ Add contact</button>
      </div>
      {adding && (
        <div style={{border:'0.5px solid #e5e5e0',borderRadius:12,padding:20,marginBottom:20,maxWidth:400}}>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',marginBottom:8}}/>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',marginBottom:8}}/>
          <input placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} style={{width:'100%',marginBottom:12}}/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={addContact}>Save</button>
            <button onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
        <thead><tr style={{borderBottom:'0.5px solid #e5e5e0'}}>
          {['Name','Company','Email','Created'].map(h=>(
            <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {contacts.map(c=>(
            <tr key={c.id} style={{borderBottom:'0.5px solid #e5e5e0'}}>
              <td style={{padding:'10px 12px',fontWeight:500}}>{c.name}</td>
              <td style={{padding:'10px 12px',color:'#888'}}>{c.company||'—'}</td>
              <td style={{padding:'10px 12px',color:'#888'}}>{c.email||'—'}</td>
              <td style={{padding:'10px 12px',color:'#aaa',fontSize:12}}>{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}