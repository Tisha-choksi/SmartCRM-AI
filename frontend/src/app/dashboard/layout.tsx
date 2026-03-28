'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/contacts', label: 'Contacts' },
  { href: '/dashboard/deals', label: 'Deals' },
  { href: '/dashboard/agents', label: 'AI Agent' },
  { href: '/dashboard/email-studio', label: 'Email Studio' }, // ← ADD
]
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 200, borderRight: '0.5px solid #e5e5e0',
        padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: 4
      }}>
        <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 16 }}>SmartCRM</p>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 14, textDecoration: 'none',
            background: path === l.href ? '#e6f1fb' : 'transparent',
            color: path === l.href ? '#0c447c' : '#5f5e5a'
          }}>{l.label}</Link>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ textAlign: 'left', padding: '8px 10px', fontSize: 13, color: '#888' }}>Sign out</button>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
    </div>
  )
}