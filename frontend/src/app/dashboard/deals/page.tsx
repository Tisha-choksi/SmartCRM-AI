'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won']

const STAGE_COLORS: Record<string, string> = {
  lead: '#888',
  qualified: '#185fa5',
  proposal: '#854f0b',
  negotiation: '#0f6e56',
  won: '#27500a',
}

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState('lead')
  const [contactId, setContactId] = useState('')
  const [movingDeal, setMovingDeal] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('id, name').order('name')
    ])
    setDeals(d || [])
    setContacts(c || [])
    setLoading(false)
  }

  async function addDeal() {
    if (!title.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Not logged in. Please refresh the page.')
        return
      }
      await supabase.from('deals').insert({
        title,
        value: parseFloat(value) || 0,
        stage,
        contact_id: contactId || null,
        user_id: user.id,
        last_touch: new Date().toISOString()
      })
      setAdding(false)
      setTitle(''); setValue(''); setStage('lead'); setContactId('')
      load()
    } catch (err) {
      console.error('Error adding deal:', err)
      alert('Failed to add deal. Check console.')
    }
  }
  async function moveDeal(dealId: string, newStage: string) {
    setMovingDeal(dealId)
    await supabase.from('deals')
      .update({ stage: newStage, last_touch: new Date().toISOString() })
      .eq('id', dealId)
    await load()
    setMovingDeal(null)
  }

  async function deleteDeal(dealId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', dealId)
    load()
  }

  function getContactName(contactId: string) {
    return contacts.find(c => c.id === contactId)?.name || null
  }

  function totalValue() {
    return deals
      .filter(d => d.stage === 'won')
      .reduce((sum, d) => sum + (d.value || 0), 0)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 2 }}>Deal pipeline</h1>
          <p style={{ fontSize: 13, color: '#888' }}>
            {deals.length} deals · Won: ${totalValue().toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '8px 16px', background: '#000', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13
          }}>
          + Add deal
        </button>
      </div>

      {/* Add deal form */}
      {adding && (
        <div style={{
          background: '#f7f7f5', border: '0.5px solid #e5e5e0',
          borderRadius: 12, padding: 20, marginBottom: 20, maxWidth: 480
        }}>
          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 14 }}>New deal</p>
          <input
            placeholder="Deal title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', border: '0.5px solid #ccc',
              borderRadius: 8, fontSize: 13, marginBottom: 10
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input
              placeholder="Value ($)"
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              style={{
                padding: '8px 12px', border: '0.5px solid #ccc',
                borderRadius: 8, fontSize: 13, width: '100%'
              }}
            />
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              style={{
                padding: '8px 12px', border: '0.5px solid #ccc',
                borderRadius: 8, fontSize: 13, width: '100%',
                background: '#fff'
              }}>
              {STAGES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <select
            value={contactId}
            onChange={e => setContactId(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', border: '0.5px solid #ccc',
              borderRadius: 8, fontSize: 13, marginBottom: 14, background: '#fff'
            }}>
            <option value="">— Link to contact (optional) —</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addDeal}
              disabled={!title.trim()}
              style={{
                padding: '8px 16px', background: '#000', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13
              }}>
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setTitle(''); setValue('') }}
              style={{
                padding: '8px 16px', background: 'transparent', color: '#888',
                border: '0.5px solid #ccc', borderRadius: 8, cursor: 'pointer', fontSize: 13
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <p style={{ color: '#888', fontSize: 13, marginTop: 24 }}>Loading...</p>
      ) : (
        <div style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', paddingBottom: 16, marginTop: 20
        }}>
          {STAGES.map(s => {
            const stageDeals = deals.filter(d => d.stage === s)
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)

            return (
              <div key={s} style={{ minWidth: 210, flex: '0 0 210px' }}>
                {/* Column header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 10, padding: '0 2px'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: STAGE_COLORS[s]
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                      color: '#444'
                    }}>{s}</span>
                    <span style={{
                      fontSize: 11, color: '#aaa',
                      background: '#f0f0ee', borderRadius: 10,
                      padding: '1px 6px'
                    }}>{stageDeals.length}</span>
                  </div>
                  {stageValue > 0 && (
                    <span style={{ fontSize: 11, color: '#888' }}>
                      ${stageValue.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Deal cards */}
                {stageDeals.map(deal => (
                  <div key={deal.id} style={{
                    background: '#fff',
                    border: '0.5px solid #e5e5e0',
                    borderRadius: 8, padding: 12, marginBottom: 8,
                    opacity: movingDeal === deal.id ? 0.5 : 1,
                    transition: 'opacity .15s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, flex: 1 }}>
                        {deal.title}
                      </p>
                      <button
                        onClick={e => deleteDeal(deal.id, e)}
                        style={{
                          background: 'none', border: 'none',
                          color: '#ddd', cursor: 'pointer',
                          fontSize: 16, padding: '0 0 0 6px', lineHeight: 1
                        }}>×</button>
                    </div>

                    {deal.value > 0 && (
                      <p style={{ fontSize: 12, color: '#0f6e56', marginBottom: 4, fontWeight: 500 }}>
                        ${Number(deal.value).toLocaleString()}
                      </p>
                    )}

                    {deal.contact_id && (
                      <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                        {getContactName(deal.contact_id)}
                      </p>
                    )}

                    {/* Move buttons */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      {STAGES.indexOf(s) > 0 && (
                        <button
                          onClick={() => moveDeal(deal.id, STAGES[STAGES.indexOf(s) - 1])}
                          style={{
                            flex: 1, padding: '4px 0', fontSize: 11,
                            background: '#f7f7f5', border: '0.5px solid #e5e5e0',
                            borderRadius: 6, cursor: 'pointer', color: '#888'
                          }}>← Back</button>
                      )}
                      {STAGES.indexOf(s) < STAGES.length - 1 && (
                        <button
                          onClick={() => moveDeal(deal.id, STAGES[STAGES.indexOf(s) + 1])}
                          style={{
                            flex: 1, padding: '4px 0', fontSize: 11,
                            background: '#f0f8f4', border: '0.5px solid #c8e6d8',
                            borderRadius: 6, cursor: 'pointer', color: '#0f6e56'
                          }}>Advance →</button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty column */}
                {stageDeals.length === 0 && (
                  <div style={{
                    border: '0.5px dashed #e5e5e0', borderRadius: 8,
                    padding: '20px 12px', textAlign: 'center',
                    fontSize: 12, color: '#ccc'
                  }}>Empty</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}