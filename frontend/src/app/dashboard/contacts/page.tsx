'use client'
import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Contact } from '@/types'

interface ScannedContact {
  name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  website?: string
  address?: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScannedContact | null>(null)
  const scanFileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await apiFetch('/contacts/').then(r => r.json())
      setContacts(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  async function addContact() {
    if (!name.trim()) return
    try {
      await apiFetch('/contacts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || null, company: company || null, phone: phone || null }),
      })
      setAdding(false)
      setName(''); setEmail(''); setCompany(''); setPhone(''); setScanResult(null)
      load()
    } catch {
      toast.error('Failed to add contact')
    }
  }

  async function deleteContact(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this contact?')) return
    try {
      await apiFetch(`/contacts/${id}`, { method: 'DELETE' })
      load()
    } catch {
      toast.error('Failed to delete contact')
    }
  }

  async function handleScanCard(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setScanResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await apiFetch('/vision/scan-card', { method: 'POST', body: form })
      const data = await res.json()
      const ext: ScannedContact = data.extracted
      setName(ext.name || '')
      setEmail(ext.email || '')
      setCompany(ext.company || '')
      setPhone(ext.phone || '')
      setScanResult(ext)
      setAdding(true)
    } catch {
      toast.error('Scan failed. Is the backend running?')
    } finally {
      setScanning(false)
      if (scanFileRef.current) scanFileRef.current.value = ''
    }
  }

  function cancelForm() {
    setAdding(false)
    setName(''); setEmail(''); setCompany(''); setPhone(''); setScanResult(null)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[22px] font-medium mb-0.5">Contacts</h1>
          <p className="text-[13px] text-stone-400">{contacts.length} total</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={scanFileRef}
            type="file"
            accept="image/*"
            onChange={handleScanCard}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => scanFileRef.current?.click()}
            disabled={scanning}
            className="text-[#185fa5] border-[#185fa5] hover:bg-blue-50 h-9 px-4"
          >
            {scanning ? 'Scanning...' : 'Scan card'}
          </Button>
          <Button
            onClick={() => setAdding(true)}
            className="h-9 px-4 bg-black text-white hover:bg-stone-800"
          >
            + Add contact
          </Button>
        </div>
      </div>

      {adding && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-6 max-w-[500px]">
          <p className="font-medium text-sm mb-3.5">
            {scanResult ? 'Review scanned contact' : 'New contact'}
          </p>

          {scanResult && (
            <div className="bg-[#f0f8f4] border border-[#c8e6d8] rounded-lg p-2.5 mb-3.5 text-xs">
              <p className="text-[#0f6e56] font-medium mb-1.5">Extracted from business card</p>
              {scanResult.title && <p className="text-stone-500 mb-0.5">Title: {scanResult.title}</p>}
              {scanResult.website && <p className="text-stone-500 mb-0.5">Website: {scanResult.website}</p>}
              {scanResult.address && <p className="text-stone-500 mb-0.5">Address: {scanResult.address}</p>}
              <p className="text-stone-400 mt-1.5 text-[11px]">Edit fields below if needed before saving</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <Input placeholder="Name *" value={name} onChange={e => setName(e.target.value)} className="h-9" />
            <Input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} className="h-9" />
            <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9" />
            <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="h-9" />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={addContact}
              disabled={!name.trim()}
              className="h-8 px-4 bg-black text-white hover:bg-stone-800 disabled:opacity-40"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={cancelForm}
              className="h-8 px-4 text-stone-400 border-stone-300 hover:bg-stone-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-stone-400 text-[13px] py-6">Loading...</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-stone-200 rounded-xl">
          <p className="text-sm text-stone-400 mb-2">No contacts yet</p>
          <p className="text-[13px] text-stone-300">Click &quot;+ Add contact&quot; or &quot;Scan card&quot; to get started</p>
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200">
              {['Name', 'Company', 'Email', 'Phone', 'Created', ''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-stone-400 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                <td className="px-3 py-3">
                  <Link
                    href={`/dashboard/contacts/${c.id}`}
                    className="text-[#185fa5] no-underline font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-stone-500">{c.company || '—'}</td>
                <td className="px-3 py-3 text-stone-500">{c.email || '—'}</td>
                <td className="px-3 py-3 text-stone-500">{c.phone || '—'}</td>
                <td className="px-3 py-3 text-stone-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={e => deleteContact(c.id, e)}
                    aria-label={`Delete ${c.name}`}
                    className="text-stone-300 hover:text-red-400 text-lg leading-none transition-colors"
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
