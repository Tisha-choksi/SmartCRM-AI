'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Deal, Contact } from '@/types'

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won']

const STAGE_COLORS: Record<string, string> = {
  lead: '#888',
  qualified: '#185fa5',
  proposal: '#854f0b',
  negotiation: '#0f6e56',
  won: '#27500a',
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Pick<Contact, 'id' | 'name'>[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState('lead')
  const [contactId, setContactId] = useState('')
  const [movingDeal, setMovingDeal] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [dealsData, contactsData] = await Promise.all([
        apiFetch('/deals/').then(r => r.json()),
        apiFetch('/contacts/').then(r => r.json()),
      ])
      setDeals(Array.isArray(dealsData) ? dealsData : [])
      setContacts(Array.isArray(contactsData) ? contactsData : [])
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function addDeal() {
    if (!title.trim()) return
    try {
      await apiFetch('/deals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          value: parseFloat(value) || 0,
          stage,
          contact_id: contactId || null,
        }),
      })
      setAdding(false)
      setTitle(''); setValue(''); setStage('lead'); setContactId('')
      load()
    } catch {
      toast.error('Failed to add deal')
    }
  }

  async function moveDeal(dealId: string, newStage: string) {
    setMovingDeal(dealId)
    try {
      await apiFetch(`/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, last_touch: new Date().toISOString() }),
      })
      await load()
    } catch {
      toast.error('Failed to move deal')
    } finally {
      setMovingDeal(null)
    }
  }

  async function deleteDeal(dealId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this deal?')) return
    try {
      await apiFetch(`/deals/${dealId}`, { method: 'DELETE' })
      load()
    } catch {
      toast.error('Failed to delete deal')
    }
  }

  function totalWonValue() {
    return deals.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[22px] font-medium mb-0.5">Deal pipeline</h1>
          <p className="text-[13px] text-stone-400">
            {deals.length} deals · Won: ${totalWonValue().toLocaleString()}
          </p>
        </div>
        <Button
          onClick={() => setAdding(true)}
          className="h-9 px-4 bg-black text-white hover:bg-stone-800"
        >
          + Add deal
        </Button>
      </div>

      {adding && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-5 max-w-[480px]">
          <p className="font-medium text-sm mb-3.5">New deal</p>
          <Input
            placeholder="Deal title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mb-2.5 h-9"
          />
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Input
              placeholder="Value ($)"
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="h-9"
            />
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="h-9 px-3 border border-stone-200 rounded-lg text-[13px] bg-white"
            >
              {STAGES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <select
            value={contactId}
            onChange={e => setContactId(e.target.value)}
            className="w-full h-9 px-3 border border-stone-200 rounded-lg text-[13px] bg-white mb-3.5"
          >
            <option value="">— Link to contact (optional) —</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              onClick={addDeal}
              disabled={!title.trim()}
              className="h-8 px-4 bg-black text-white hover:bg-stone-800"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => { setAdding(false); setTitle(''); setValue('') }}
              className="h-8 px-4 text-stone-400 border-stone-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-stone-400 text-[13px] mt-6">Loading...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 mt-5">
          {STAGES.map(s => {
            const stageDeals = deals.filter(d => d.stage === s)
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)

            return (
              <div key={s} className="min-w-[210px] w-[210px] shrink-0">
                <div className="flex justify-between items-center mb-2.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[s] }} />
                    <span className="text-xs font-medium capitalize text-stone-600">{s}</span>
                    <span className="text-[11px] text-stone-400 bg-stone-100 rounded-full px-1.5 py-px">
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-[11px] text-stone-400">${stageValue.toLocaleString()}</span>
                  )}
                </div>

                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    className={cn(
                      'bg-white border border-stone-200 rounded-lg p-3 mb-2 transition-opacity',
                      movingDeal === deal.id ? 'opacity-50' : 'opacity-100'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-[13px] mb-1 flex-1">{deal.title}</p>
                      <button
                        onClick={e => deleteDeal(deal.id, e)}
                        aria-label={`Delete ${deal.title}`}
                        className="text-stone-300 hover:text-red-400 text-base leading-none ml-1.5 transition-colors"
                      >
                        ×
                      </button>
                    </div>

                    {deal.value > 0 && (
                      <p className="text-xs text-[#0f6e56] mb-1 font-medium">
                        ${Number(deal.value).toLocaleString()}
                      </p>
                    )}

                    {deal.contacts?.name && (
                      <p className="text-[11px] text-stone-400 mb-2">{deal.contacts.name}</p>
                    )}

                    <div className="flex gap-1 mt-2">
                      {STAGES.indexOf(s) > 0 && (
                        <button
                          onClick={() => moveDeal(deal.id, STAGES[STAGES.indexOf(s) - 1])}
                          className="flex-1 py-1 text-[11px] bg-stone-50 border border-stone-200 rounded-md text-stone-400 hover:bg-stone-100 transition-colors"
                        >
                          ← Back
                        </button>
                      )}
                      {STAGES.indexOf(s) < STAGES.length - 1 && (
                        <button
                          onClick={() => moveDeal(deal.id, STAGES[STAGES.indexOf(s) + 1])}
                          className="flex-1 py-1 text-[11px] bg-[#f0f8f4] border border-[#c8e6d8] rounded-md text-[#0f6e56] hover:bg-[#e0f4eb] transition-colors"
                        >
                          Advance →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="border border-dashed border-stone-200 rounded-lg py-5 text-center text-xs text-stone-300">
                    Empty
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
