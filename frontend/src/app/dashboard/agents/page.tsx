'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AgentsPage() {
  const [deals, setDeals]         = useState<any[]>([])
  const [contacts, setContacts]   = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState('')
  const [activeTab, setActiveTab] = useState('followup')

  // Follow-up state
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [emailDraft, setEmailDraft]     = useState('')

  // Research state
  const [companyName, setCompanyName] = useState('')
  const [researchResult, setResearchResult] = useState('')

  // Digest state
  const [digest, setDigest] = useState('')

  useEffect(() => {
    supabase.from('deals').select('*, contacts(name, company)')
      .then(({ data }) => setDeals(data || []))
    supabase.from('contacts').select('*')
      .then(({ data }) => setContacts(data || []))
  }, [])

  function getStaleDays(deal: any) {
    const last = new Date(deal.last_touch || deal.created_at)
    const now  = new Date()
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  }

  async function draftEmail(deal: any) {
    setLoading(true); setEmailDraft('')
    setSelectedDeal(deal)
    const contact = contacts.find(c => c.id === deal.contact_id)
    try {
      const res  = await fetch(`${API}/agent/draft-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contact?.name || 'there',
          company:      contact?.company || deal.title,
          deal_title:   deal.title,
          days_stale:   getStaleDays(deal)
        })
      })
      const data = await res.json()
      setEmailDraft(data.email)
    } catch { setEmailDraft('Error contacting backend.') }
    setLoading(false)
  }

  async function generateDigest() {
    setLoading(true); setDigest('')
    try {
      const res  = await fetch(`${API}/agent/pipeline-digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deals: deals.map(d => ({
          title: d.title, stage: d.stage,
          value: d.value, days_stale: getStaleDays(d)
        }))})
      })
      const data = await res.json()
      setDigest(data.digest)
    } catch { setDigest('Error contacting backend.') }
    setLoading(false)
  }

  async function researchCompany() {
    if (!companyName.trim()) return
    setLoading(true); setResearchResult('')
    try {
      const res  = await fetch(`${API}/agent/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName })
      })
      const data = await res.json()
      setResearchResult(data.info)
    } catch { setResearchResult('Error contacting backend.') }
    setLoading(false)
  }

  const stalDeals = deals.filter(d => getStaleDays(d) >= 7)

  const tabs = [
    { id: 'followup', label: 'Follow-up emails' },
    { id: 'digest',   label: 'Pipeline digest' },
    { id: 'research', label: 'Research' },
  ]

  return (
    <div style={{maxWidth:720}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:500,marginBottom:4}}>AI Agent</h1>
        <p style={{fontSize:13,color:'#888'}}>
          Autonomous actions — review before anything is sent
        </p>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'0.5px solid #e5e5e0',paddingBottom:0}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding:'8px 16px',border:'none',background:'none',
              cursor:'pointer',fontSize:13,
              borderBottom: activeTab===t.id ? '2px solid #185fa5' : '2px solid transparent',
              color: activeTab===t.id ? '#185fa5' : '#888',
              fontWeight: activeTab===t.id ? 500 : 400,
              marginBottom:-1
            }}>{t.label}</button>
        ))}
      </div>

      {/* Follow-up tab */}
      {activeTab === 'followup' && (
        <div>
          <p style={{fontSize:13,color:'#888',marginBottom:16}}>
            Deals not touched in 7+ days. Click to draft a follow-up email.
          </p>
          {stalDeals.length === 0 ? (
            <div style={{border:'0.5px dashed #e5e5e0',borderRadius:10,
              padding:'32px',textAlign:'center',color:'#bbb',fontSize:13}}>
              No stale deals! All deals touched recently.
            </div>
          ) : (
            stalDeals.map(deal => (
              <div key={deal.id} style={{border:'0.5px solid #e5e5e0',
                borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontWeight:500,fontSize:14}}>{deal.title}</p>
                    <p style={{fontSize:12,color:'#888',marginTop:2}}>
                      {deal.stage} · {getStaleDays(deal)} days since last touch
                      {deal.value > 0 && ` · $${Number(deal.value).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => draftEmail(deal)}
                    disabled={loading}
                    style={{padding:'7px 14px',background:'#185fa5',color:'#fff',
                      border:'none',borderRadius:8,cursor:'pointer',fontSize:12}}>
                    Draft email
                  </button>
                </div>
              </div>
            ))
          )}

          {emailDraft && (
            <div style={{marginTop:20,border:'0.5px solid #c8e6d8',
              borderRadius:10,padding:16,background:'#f0f8f4'}}>
              <p style={{fontWeight:500,fontSize:13,color:'#0f6e56',marginBottom:8}}>
                AI-drafted email for "{selectedDeal?.title}"
              </p>
              <textarea
                value={emailDraft}
                onChange={e => setEmailDraft(e.target.value)}
                rows={6}
                style={{width:'100%',padding:'10px 12px',border:'0.5px solid #c8e6d8',
                  borderRadius:8,fontSize:13,background:'#fff',resize:'vertical'}}
              />
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(emailDraft)
                    alert('Email copied to clipboard!')
                  }}
                  style={{padding:'7px 14px',background:'#000',color:'#fff',
                    border:'none',borderRadius:8,cursor:'pointer',fontSize:12}}>
                  Copy email
                </button>
                <button
                  onClick={() => setEmailDraft('')}
                  style={{padding:'7px 14px',background:'transparent',color:'#888',
                    border:'0.5px solid #ccc',borderRadius:8,cursor:'pointer',fontSize:12}}>
                  Dismiss
                </button>
              </div>
              <p style={{fontSize:11,color:'#888',marginTop:8}}>
                Review and edit before sending. Copy to your email client.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Digest tab */}
      {activeTab === 'digest' && (
        <div>
          <p style={{fontSize:13,color:'#888',marginBottom:16}}>
            Generate an AI summary of your entire pipeline — great for weekly reviews.
          </p>
          <div style={{border:'0.5px solid #e5e5e0',borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontWeight:500,fontSize:14}}>Weekly pipeline digest</p>
                <p style={{fontSize:12,color:'#888',marginTop:2}}>
                  {deals.length} total deals across all stages
                </p>
              </div>
              <button
                onClick={generateDigest}
                disabled={loading || deals.length === 0}
                style={{padding:'8px 16px',background:'#185fa5',color:'#fff',
                  border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}>
                {loading ? 'Generating...' : 'Generate digest'}
              </button>
            </div>
          </div>

          {digest && (
            <div style={{border:'0.5px solid #b5d4f4',borderRadius:10,
              padding:16,background:'#e6f1fb'}}>
              <p style={{fontWeight:500,fontSize:13,color:'#0c447c',marginBottom:10}}>
                Pipeline digest
              </p>
              <p style={{fontSize:13,color:'#1a1a18',lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                {digest}
              </p>
              <button
                onClick={() => {navigator.clipboard.writeText(digest); alert('Copied!')}}
                style={{marginTop:12,padding:'7px 14px',background:'#0c447c',color:'#fff',
                  border:'none',borderRadius:8,cursor:'pointer',fontSize:12}}>
                Copy digest
              </button>
            </div>
          )}
        </div>
      )}

      {/* Research tab */}
      {activeTab === 'research' && (
        <div>
          <p style={{fontSize:13,color:'#888',marginBottom:16}}>
            Research any company — get a summary of their business, industry, and size.
          </p>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              onKeyDown={e => e.key==='Enter' && researchCompany()}
              placeholder="Enter company name..."
              style={{flex:1,padding:'8px 12px',border:'0.5px solid #ccc',
                borderRadius:8,fontSize:13}}
            />
            <button
              onClick={researchCompany}
              disabled={loading || !companyName.trim()}
              style={{padding:'8px 16px',background:'#185fa5',color:'#fff',
                border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}>
              {loading ? 'Searching...' : 'Research'}
            </button>
          </div>

          {researchResult && (
            <div style={{border:'0.5px solid #e5e5e0',borderRadius:10,padding:16}}>
              <p style={{fontWeight:500,fontSize:13,marginBottom:10}}>
                Research: {companyName}
              </p>
              <p style={{fontSize:13,color:'#444',lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                {researchResult}
              </p>
            </div>
          )}

          {!researchResult && (
            <div style={{border:'0.5px dashed #e5e5e0',borderRadius:10,
              padding:'32px',textAlign:'center',color:'#bbb',fontSize:13}}>
              Enter a company name above to research it
            </div>
          )}
        </div>
      )}
    </div>
  )
}