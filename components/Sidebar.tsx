'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/SupabaseProvider'

export default function Sidebar() {
  const router = useRouter()
  const { user: currentUser } = useUser()

  if (!currentUser) return null;

  return (
    <aside style={{ width: '300px', position: 'sticky', top: '100px', height: 'fit-content' }} className="hide-on-mobile">
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '20px' }}>
        <h3 
          onClick={() => router.push('/users')}
          style={{ margin: 0, fontSize: '11px', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer', color: 'var(--muted)' }}
        >
          EXPLORAR MEMBROS
        </h3>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => router.push('/about')}>Sobre</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }}>Privacidade</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }}>Termos</span>
        </div>
        <p style={{ fontSize: '10px', marginTop: '15px', color: 'var(--muted)', opacity: 0.6 }}>© 2026 MIPHOBOOK</p>
      </div>
    </aside>
  )
}
