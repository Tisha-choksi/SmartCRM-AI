'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ContactsPage() {
  const [contacts, setContacts]     = useState<any[]>([])
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [company, setCompany]       = useState('')
  const [phone, setPhone]           = useState('')
  const [adding, setAdding]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [scanning, setScanning]     = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const scanFileRef = useRef<HTMLInputElement>(null)

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
    setName(''); setEmail(''); setCompany('')
    setPhone(''); setScanResult(null)
    load()
  }

  async function deleteContact(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    load()
  }

  async function handleScanCard(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setScanResult(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch(`${API}/vision/scan-card`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      const ext  = data.extracted

      setName(ext.name || '')
      setEmail(ext.email || '')
      setCompany(ext.company || '')
      setPhone(ext.phone || '')
      setScanResult(ext)
      setAdding(true)
    } catch {
      alert('Scan failed. Is the backend running on :8000?')
    }

    setScanning(false)
    if (scanFileRef.current) scanFileRef.current.value = ''
  }

  function cancelForm() {
    setAdding(false)
    setName(''); setEmail('')
    setCompany(''); setPhone('')
    setScanResult(null)
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
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={scanFileRef}
            type="file"
            accept="image/*"
            onChange={handleScanCard}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => scanFileRef.current?.click()}
            disabled={scanning}
            style={{
              padding: '8px 16px',
              background: '#fff',
              color: '#185fa5',
              border: '0.5px solid #185fa5',
              borderRadius: 8,
              cursor: scanning ? 'not-allowed' : 'pointer',
              fontSize: 13,
              opacity: scanning ? 0.7 : 1
            }}>
            {scanning ? 'Scanning...' : 'Scan card'}
          </button>
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: '8px 16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13
            }}>
            + Add contact
          </button>
        </div>
      </div>

      {/* Add / Scan form */}
      {adding && (
        <div style={{
          background: '#f7f7f5',
          border: '0.5px solid #e5e5e0',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          maxWidth: 500
        }}>
          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 14 }}>
            {scanResult ? 'Review scanned contact' : 'New contact'}
          </p>

          {/* Scan result preview */}
          {scanResult && (
            <div style={{
              background: '#f0f8f4',
              border: '0.5px solid #c8e6d8',
              borderRadius: 8,
              padding: 10,
              marginBottom: 14,
              fontSize: 12
            }}>
              <p style={{ color: '#0f6e56', fontWeight: 500, marginBottom: 6 }}>
                Extracted from business card
              </p>
              {scanResult.title && (
                <p style={{ color: '#555', marginBottom: 2 }}>
                  Title: {scanResult.title}
                </p>
              )}
              {scanResult.website && (
                <p style={{ color: '#555', marginBottom: 2 }}>
                  Website: {scanResult.website}
                </p>
              )}
              {scanResult.address && (
                <p style={{ color: '#555', marginBottom: 2 }}>
                  Address: {scanResult.address}
                </p>
              )}
              <p style={{ color: '#888', marginTop: 6, fontSize: 11 }}>
                Edit fields below if needed before saving
              </p>
            </div>
          )}

          {/* Form fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 14
          }}>
            <input
              placeholder="Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                fontSize: 13,
                width: '100%',
                background: '#fff'
              }}
            />
            <input
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                fontSize: 13,
                width: '100%',
                background: '#fff'
              }}
            />
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                fontSize: 13,
                width: '100%',
                background: '#fff'
              }}
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                fontSize: 13,
                width: '100%',
                background: '#fff'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addContact}
              disabled={!name.trim()}
              style={{
                padding: '8px 16px',
                background: name.trim() ? '#000' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontSize: 13
              }}>
              Save
            </button>
            <button
              onClick={cancelForm}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#888',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts table */}
      {loading ? (
        <p style={{ color: '#888', fontSize: 13, padding: '24px 0' }}>Loading...</p>
      ) : contacts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0',
          border: '0.5px dashed #e5e5e0',
          borderRadius: 12
        }}>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
            No contacts yet
          </p>
          <p style={{ fontSize: 13, color: '#bbb' }}>
            Click "+ Add contact" or "Scan card" to get started
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e5e0' }}>
              {['Name', 'Company', 'Email', 'Phone', 'Created', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  color: '#888',
                  fontWeight: 500,
                  fontSize: 12
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} style={{
                borderBottom: '0.5px solid #f0f0ee',
                transition: 'background .1s'
              }}>
                <td style={{ padding: '12px 12px' }}>
                  <Link
                    href={`/dashboard/contacts/${c.id}`}
                    style={{
                      color: '#185fa5',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}>
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
                    onClick={e => deleteContact(c.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ddd',
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: '0 4px',
                      lineHeight: 1,
                      borderRadius: 4
                    }}>
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