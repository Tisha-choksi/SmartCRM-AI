// src/app/dashboard/contacts/[id]/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ContactDetailPage() {
  const { id } = useParams()
  const [contact, setContact]     = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [question, setQuestion]   = useState('')
  const [messages, setMessages]   = useState<any[]>([])
  const [asking, setAsking]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('contacts').select('*')
      .eq('id', id).single()
      .then(({ data }) => setContact(data))
  }, [id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    const form = new FormData()
    form.append('file', file)
    try {
      const res  = await fetch(`${API}/rag/upload/${id}`, { method: 'POST', body: form })
      const data = await res.json()
      setUploadMsg(`Indexed ${data.chunks} chunks from "${data.filename}"`)
    } catch {
      setUploadMsg('Upload failed. Is the backend running?')
    }
    setUploading(false)
  }

  async function handleAsk() {
    if (!question.trim()) return
    const q = question
    setQuestion('')
    setAsking(true)
    setMessages(m => [...m, { role: 'user', text: q }])
    try {
      const res  = await fetch(`${API}/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, contact_id: id })
      })
      const data = await res.json()
      setMessages(m => [...m, {
        role: 'assistant',
        text: data.answer,
        sources: data.sources
      }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Error contacting backend.' }])
    }
    setAsking(false)
  }

  if (!contact) return <p style={{padding:32,color:'#888'}}>Loading...</p>

  return (
    <div style={{maxWidth:720}}>
      <h1 style={{fontSize:22,fontWeight:500,marginBottom:4}}>{contact.name}</h1>
      <p style={{color:'#888',fontSize:13,marginBottom:32}}>
        {contact.company} · {contact.email}
      </p>

      {/* Upload section */}
      <div style={{border:'0.5px solid #e5e5e0',borderRadius:12,padding:20,marginBottom:24}}>
        <h2 style={{fontSize:16,fontWeight:500,marginBottom:8}}>Documents</h2>
        <p style={{fontSize:13,color:'#888',marginBottom:12}}>
          Upload contracts, emails, or notes — then ask questions about them.
        </p>
        <input ref={fileRef} type="file" accept=".pdf,.txt"
          onChange={handleUpload} style={{display:'none'}}/>
        <button onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{padding:'8px 16px',background:'#000',color:'#fff',
            border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}>
          {uploading ? 'Uploading...' : 'Upload PDF or TXT'}
        </button>
        {uploadMsg && (
          <p style={{marginTop:10,fontSize:12,
            color: uploadMsg.includes('failed') ? '#c0392b' : '#0f6e56'}}>
            {uploadMsg}
          </p>
        )}
      </div>

      {/* Chat section */}
      <div style={{border:'0.5px solid #e5e5e0',borderRadius:12,padding:20}}>
        <h2 style={{fontSize:16,fontWeight:500,marginBottom:8}}>Ask AI</h2>
        <p style={{fontSize:13,color:'#888',marginBottom:12}}>
          Ask anything about the uploaded documents.
        </p>

        {/* Messages */}
        <div style={{minHeight:120,marginBottom:16}}>
          {messages.length === 0 && (
            <p style={{fontSize:13,color:'#bbb',fontStyle:'italic'}}>
              Try: "What are the payment terms?" or "Summarize this contract"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              marginBottom:12,
              display:'flex',
              justifyContent: m.role==='user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth:'80%',padding:'10px 14px',borderRadius:10,fontSize:13,
                background: m.role==='user' ? '#000' : '#f7f7f5',
                color: m.role==='user' ? '#fff' : '#1a1a18',
                border: m.role==='assistant' ? '0.5px solid #e5e5e0' : 'none'
              }}>
                <p>{m.text}</p>
                {m.sources?.length > 0 && (
                  <p style={{fontSize:11,marginTop:6,opacity:.6}}>
                    Source: {m.sources.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
          {asking && (
            <div style={{display:'flex',gap:4,padding:'10px 0'}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{
                  width:6,height:6,borderRadius:'50%',background:'#888',
                  animation:`bounce 1s ${i*0.15}s infinite`
                }}/>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{display:'flex',gap:8}}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleAsk()}
            placeholder="Ask about uploaded documents..."
            style={{flex:1,padding:'8px 12px',border:'0.5px solid #ccc',
              borderRadius:8,fontSize:13}}
          />
          <button onClick={handleAsk} disabled={asking || !question.trim()}
            style={{padding:'8px 16px',background:'#000',color:'#fff',
              border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}>
            Ask
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  )
}