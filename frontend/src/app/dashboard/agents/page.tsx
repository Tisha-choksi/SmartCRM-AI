'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Deal } from '@/types'

interface DealWithContact extends Deal {
  contacts: { name: string; company: string | null } | null
}

export default function AgentsPage() {
  const [deals, setDeals] = useState<DealWithContact[]>([])
  const [activeTab, setActiveTab] = useState('followup')

  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null)
  const [emailDraft, setEmailDraft] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [researchResult, setResearchResult] = useState('')
  const [loadingResearch, setLoadingResearch] = useState(false)

  const [digest, setDigest] = useState('')
  const [loadingDigest, setLoadingDigest] = useState(false)

  useEffect(() => {
    apiFetch('/deals/')
      .then(r => r.json())
      .then(data => setDeals(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load deals'))
  }, [])

  function getStaleDays(deal: Deal) {
    const last = new Date(deal.last_touch || deal.created_at)
    return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
  }

  async function draftEmail(deal: DealWithContact) {
    setLoadingEmail(true)
    setEmailDraft('')
    setSelectedDeal(deal)
    try {
      const res = await apiFetch('/agent/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: deal.contacts?.name || 'there',
          company: deal.contacts?.company || deal.title,
          deal_title: deal.title,
          days_stale: getStaleDays(deal),
        }),
      })
      const data = await res.json()
      setEmailDraft(data.email)
    } catch {
      setEmailDraft('Error contacting backend.')
    } finally {
      setLoadingEmail(false)
    }
  }

  async function generateDigest() {
    setLoadingDigest(true)
    setDigest('')
    try {
      const res = await apiFetch('/agent/pipeline-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deals: deals.map(d => ({
            title: d.title,
            stage: d.stage,
            value: d.value,
            days_stale: getStaleDays(d),
          })),
        }),
      })
      const data = await res.json()
      setDigest(data.digest)
    } catch {
      setDigest('Error contacting backend.')
    } finally {
      setLoadingDigest(false)
    }
  }

  async function researchCompany() {
    if (!companyName.trim()) return
    setLoadingResearch(true)
    setResearchResult('')
    try {
      const res = await apiFetch('/agent/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName }),
      })
      const data = await res.json()
      setResearchResult(data.info)
    } catch {
      setResearchResult('Error contacting backend.')
    } finally {
      setLoadingResearch(false)
    }
  }

  const staleDeals = deals.filter(d => getStaleDays(d) >= 7)

  const tabs = [
    { id: 'followup', label: 'Follow-up emails' },
    { id: 'digest', label: 'Pipeline digest' },
    { id: 'research', label: 'Research' },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[22px] font-medium mb-1">AI Agent</h1>
        <p className="text-[13px] text-stone-400">Autonomous actions — review before anything is sent</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-stone-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'px-4 py-2 border-none bg-transparent cursor-pointer text-[13px] -mb-px border-b-2 transition-colors',
              activeTab === t.id
                ? 'border-[#185fa5] text-[#185fa5] font-medium'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'followup' && (
        <div>
          <p className="text-[13px] text-stone-400 mb-4">
            Deals not touched in 7+ days. Click to draft a follow-up email.
          </p>
          {staleDeals.length === 0 ? (
            <div className="border border-dashed border-stone-200 rounded-xl py-8 text-center text-[13px] text-stone-300">
              No stale deals! All deals touched recently.
            </div>
          ) : (
            staleDeals.map(deal => (
              <div key={deal.id} className="border border-stone-200 rounded-xl p-3.5 mb-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{deal.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {deal.stage} · {getStaleDays(deal)} days since last touch
                      {deal.value > 0 && ` · $${Number(deal.value).toLocaleString()}`}
                    </p>
                  </div>
                  <Button
                    onClick={() => draftEmail(deal)}
                    disabled={loadingEmail}
                    className="h-8 px-3.5 bg-[#185fa5] text-white hover:bg-[#0c447c] text-xs"
                  >
                    {loadingEmail && selectedDeal?.id === deal.id ? 'Drafting...' : 'Draft email'}
                  </Button>
                </div>
              </div>
            ))
          )}

          {emailDraft && (
            <div className="mt-5 border border-[#c8e6d8] rounded-xl p-4 bg-[#f0f8f4]">
              <p className="font-medium text-[13px] text-[#0f6e56] mb-2">
                AI-drafted email for &quot;{selectedDeal?.title}&quot;
              </p>
              <textarea
                value={emailDraft}
                onChange={e => setEmailDraft(e.target.value)}
                rows={6}
                className="w-full px-3 py-2.5 border border-[#c8e6d8] rounded-lg text-[13px] bg-white resize-y"
              />
              <div className="flex gap-2 mt-2.5">
                <Button
                  onClick={() => { navigator.clipboard.writeText(emailDraft); toast.success('Email copied!') }}
                  className="h-8 px-3.5 bg-black text-white hover:bg-stone-800 text-xs"
                >
                  Copy email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEmailDraft('')}
                  className="h-8 px-3.5 text-stone-400 border-stone-300 text-xs"
                >
                  Dismiss
                </Button>
              </div>
              <p className="text-[11px] text-stone-400 mt-2">
                Review and edit before sending. Copy to your email client.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'digest' && (
        <div>
          <p className="text-[13px] text-stone-400 mb-4">
            Generate an AI summary of your entire pipeline — great for weekly reviews.
          </p>
          <div className="border border-stone-200 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Weekly pipeline digest</p>
                <p className="text-xs text-stone-400 mt-0.5">{deals.length} total deals across all stages</p>
              </div>
              <Button
                onClick={generateDigest}
                disabled={loadingDigest || deals.length === 0}
                className="h-9 px-4 bg-[#185fa5] text-white hover:bg-[#0c447c]"
              >
                {loadingDigest ? 'Generating...' : 'Generate digest'}
              </Button>
            </div>
          </div>

          {digest && (
            <div className="border border-[#b5d4f4] rounded-xl p-4 bg-[#e6f1fb]">
              <p className="font-medium text-[13px] text-[#0c447c] mb-2.5">Pipeline digest</p>
              <p className="text-[13px] text-stone-800 leading-relaxed whitespace-pre-wrap">{digest}</p>
              <Button
                onClick={() => { navigator.clipboard.writeText(digest); toast.success('Copied!') }}
                className="mt-3 h-8 px-3.5 bg-[#0c447c] text-white hover:bg-[#093666] text-xs"
              >
                Copy digest
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'research' && (
        <div>
          <p className="text-[13px] text-stone-400 mb-4">
            Research any company — get a summary of their business, industry, and size.
          </p>
          <div className="flex gap-2 mb-4">
            <Input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && researchCompany()}
              placeholder="Enter company name..."
              className="h-9"
            />
            <Button
              onClick={researchCompany}
              disabled={loadingResearch || !companyName.trim()}
              className="h-9 px-4 bg-[#185fa5] text-white hover:bg-[#0c447c] shrink-0"
            >
              {loadingResearch ? 'Searching...' : 'Research'}
            </Button>
          </div>

          {researchResult ? (
            <div className="border border-stone-200 rounded-xl p-4">
              <p className="font-medium text-[13px] mb-2.5">Research: {companyName}</p>
              <p className="text-[13px] text-stone-600 leading-relaxed whitespace-pre-wrap">{researchResult}</p>
            </div>
          ) : (
            <div className="border border-dashed border-stone-200 rounded-xl py-8 text-center text-[13px] text-stone-300">
              Enter a company name above to research it
            </div>
          )}
        </div>
      )}
    </div>
  )
}
