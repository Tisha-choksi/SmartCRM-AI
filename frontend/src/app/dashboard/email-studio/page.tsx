'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function EmailStudioPage() {
  const [instruction, setInstruction] = useState('')
  const [baseEmail, setBaseEmail]     = useState('')
  const [ftEmail, setFtEmail]         = useState('')
  const [loadingBase, setLoadingBase] = useState(false)
  const [loadingFt, setLoadingFt]     = useState(false)
  const [ollamaOk, setOllamaOk]       = useState<boolean|null>(null)

  async function checkOllama() {
    try {
      const res  = await fetch(`${API}/finetune/ollama-status`)
      const data = await res.json()
      setOllamaOk(data.running)
    } catch { setOllamaOk(false) }
  }

  async function generateBoth() {
    if (!instruction.trim()) return
    setBaseEmail(''); setFtEmail('')
    setLoadingBase(true); setLoadingFt(true)

    // Run both in parallel
    const [baseRes, ftRes] = await Promise.allSettled([
      fetch(`${API}/finetune/generate-base`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({instruction})
      }).then(r=>r.json()),
      fetch(`${API}/finetune/generate-finetuned`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({instruction})
      }).then(r=>r.json())
    ])

    if (baseRes.status === 'fulfilled') setBaseEmail(baseRes.value.email)
    if (ftRes.status === 'fulfilled')   setFtEmail(ftRes.value.email)
    setLoadingBase(false); setLoadingFt(false)
  }

  const samples = [
    "Write a follow-up email to a diamond buyer who hasn't responded in 2 weeks. Deal: 5ct Round Brilliant.",
    "Write a cold outreach email to a jewelry manufacturer about our GIA-certified inventory.",
    "Write a payment reminder for an overdue invoice on a princess cut parcel."
  ]

  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:500,marginBottom:4}}>Email Studio</h1>
        <p style={{fontSize:13,color:'#888'}}>
          Compare base model vs fine-tuned model side by side
        </p>
      </div>

      {/* Ollama status */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        <button onClick={checkOllama}
          style={{padding:'6px 12px',border:'0.5px solid #ccc',borderRadius:8,
            background:'transparent',cursor:'pointer',fontSize:12,color:'#888'}}>
          Check Ollama status
        </button>
        {ollamaOk === true && (
          <span style={{fontSize:12,color:'#0f6e56'}}>Ollama running</span>
        )}
        {ollamaOk === false && (
          <span style={{fontSize:12,color:'#c0392b'}}>
            Ollama not running — run: ollama serve
          </span>
        )}
      </div>

      {/* Instruction input */}
      <div style={{marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:500,marginBottom:8}}>Email instruction</p>
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="Describe the email you want to write..."
          rows={3}
          style={{width:'100%',padding:'10px 12px',border:'0.5px solid #ccc',
            borderRadius:8,fontSize:13,resize:'vertical'}}
        />
        <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
          {samples.map((s,i) => (
            <button key={i} onClick={() => setInstruction(s)}
              style={{padding:'4px 10px',border:'0.5px solid #ccc',borderRadius:20,
                background:'transparent',cursor:'pointer',fontSize:11,color:'#888'}}>
              Sample {i+1}
            </button>
          ))}
        </div>
      </div>

      <button onClick={generateBoth}
        disabled={!instruction.trim() || loadingBase}
        style={{padding:'9px 20px',background:'#000',color:'#fff',
          border:'none',borderRadius:8,cursor:'pointer',fontSize:13,marginBottom:24}}>
        {loadingBase ? 'Generating...' : 'Generate both versions'}
      </button>

      {/* Side by side comparison */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

        {/* Base model */}
        <div style={{border:'0.5px solid #e5e5e0',borderRadius:12,padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',
            alignItems:'center',marginBottom:12}}>
            <div>
              <p style={{fontWeight:500,fontSize:14}}>Base model</p>
              <p style={{fontSize:11,color:'#888'}}>Groq LLaMA-3</p>
            </div>
            <span style={{fontSize:11,padding:'3px 8px',borderRadius:10,
              background:'#f0f0ee',color:'#888'}}>No fine-tuning</span>
          </div>
          {loadingBase ? (
            <p style={{fontSize:13,color:'#aaa',fontStyle:'italic'}}>Generating...</p>
          ) : baseEmail ? (
            <>
              <p style={{fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap',color:'#333'}}>
                {baseEmail}
              </p>
              <button onClick={()=>{navigator.clipboard.writeText(baseEmail);alert('Copied!')}}
                style={{marginTop:12,padding:'6px 12px',background:'transparent',
                  border:'0.5px solid #ccc',borderRadius:6,cursor:'pointer',fontSize:11,color:'#888'}}>
                Copy
              </button>
            </>
          ) : (
            <p style={{fontSize:13,color:'#ccc',fontStyle:'italic'}}>
              Output will appear here
            </p>
          )}
        </div>

        {/* Fine-tuned model */}
        <div style={{border:'0.5px solid #c8e6d8',borderRadius:12,padding:16,
          background:'#fafffe'}}>
          <div style={{display:'flex',justifyContent:'space-between',
            alignItems:'center',marginBottom:12}}>
            <div>
              <p style={{fontWeight:500,fontSize:14}}>Fine-tuned model</p>
              <p style={{fontSize:11,color:'#888'}}>Mistral-7B + QLoRA</p>
            </div>
            <span style={{fontSize:11,padding:'3px 8px',borderRadius:10,
              background:'#e6f9f1',color:'#0f6e56'}}>Trained on your style</span>
          </div>
          {loadingFt ? (
            <p style={{fontSize:13,color:'#aaa',fontStyle:'italic'}}>Generating...</p>
          ) : ftEmail ? (
            <>
              <p style={{fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap',color:'#333'}}>
                {ftEmail}
              </p>
              <button onClick={()=>{navigator.clipboard.writeText(ftEmail);alert('Copied!')}}
                style={{marginTop:12,padding:'6px 12px',background:'#0f6e56',color:'#fff',
                  border:'none',borderRadius:6,cursor:'pointer',fontSize:11}}>
                Copy
              </button>
            </>
          ) : (
            <p style={{fontSize:13,color:'#ccc',fontStyle:'italic'}}>
              Output will appear here
            </p>
          )}
        </div>

      </div>
    </div>
  )
}