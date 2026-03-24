'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [company, setCompany]   = useState('')
  const [phone, setPhone]       = useState('')
  const [adding, setAdding]     = useState(false)
  const [loading, setLoading]   = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  async function addContact() {
    if (!name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('contacts').insert({
      name, email, company, phone, user_id: user!.id
    })
    setAdding(false)
    setName(''); setEmail(''); setCompany(''); setPhone('')
    load()
  }

  async function deleteContact(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 2 }}>Contacts</h1>
          <p style={{ fontSize: 13, color: '#888' }}>{contacts.length} total</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '8px 16px', background: '#000', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13
          }}>
          + Add contact
        </button>
      </div>

      {/* Add contact form */}
      {adding && (
        <div style={{
          background: '#f7f7f5', border: '0.5px solid #e5e5e0',
          borderRadius: 12, padding: 20, marginBottom: 20, maxWidth: 480
        }}>
          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 14 }}>New contact</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input
              placeholder="Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                padding: '8px 12px', border: '0.5px solid #ccc',
                borderRadius: 8, fontSize: 13, width: '100%'
              }}
            />
            <input
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              style={{
                padding: '8px 12px', border: '0.5px solid #ccc',
                borderRadius: 8, fontSize: 13, width: '100%'
              }}
            />
            <input
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: '8px 12px', border: '0.5px solid #ccc',
                borderRadius: 8, fontSize: 13, width: '100%'
              }}
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{
                padding: '8px 12px', border: '0.5px solid #ccc',
                borderRadius: 8, fontSize: 13, width: '100%'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addContact}
              disabled={!name.trim()}
              style={{
                padding: '8px 16px', background: '#000', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13
              }}>
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setName(''); setEmail(''); setCompany(''); setPhone('') }}
              style={{
                padding: '8px 16px', background: 'transparent', color: '#888',
                border: '0.5px solid #ccc', borderRadius: 8, cursor: 'pointer', fontSize: 13
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts table */}
      {loading ? (
        <p style={{ color: '#888', fontSize: 13 }}>Loading...</p>
      ) : contacts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 0',
          border: '0.5px dashed #e5e5e0', borderRadius: 12
        }}>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>No contacts yet</p>
          <p style={{ fontSize: 13, color: '#bbb' }}>Click "+ Add contact" to get started</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e5e0' }}>
              {['Name', 'Company', 'Email', 'Phone', 'Created', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 12px',
                  color: '#888', fontWeight: 500, fontSize: 12
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr
                key={c.id}
                style={{ borderBottom: '0.5px solid #f0f0ee' }}
              >
                <td style={{ padding: '12px 12px' }}>
                  <Link
                    href={`/dashboard/contacts/${c.id}`}
                    style={{ color: '#185fa5', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {c.name}
                  </Link>
                </td>
                <td style={{ padding: '12px 12px', color: '#666' }}>
                  {c.company || '—'}
                </td>
                <td style={{ padding: '12px 12px', color: '#666' }}>
                  {c.email || '—'}
                </td>
                <td style={{ padding: '12px 12px', color: '#666' }}>
                  {c.phone || '—'}
                </td>
                <td style={{ padding: '12px 12px', color: '#aaa', fontSize: 12 }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <button
                    onClick={(e) => deleteContact(c.id, e)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#ccc', cursor: 'pointer', fontSize: 16,
                      padding: '2px 6px', borderRadius: 4
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}