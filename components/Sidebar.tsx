'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/SupabaseProvider'

export default function Sidebar() {
  const router = useRouter()
  const { user: currentUser } = useUser()

  if (!currentUser) return null;

  return (
    <aside style={{ width: '300px', position: 'sticky', top: '100px', height: 'fit-content' }} className="hide-on-mobile">
      <div style={{ marginTop: '0', paddingTop: '0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => router.push('/about')}>Sobre</span>
        </div>
        <p style={{ fontSize: '10px', marginTop: '15px', color: 'var(--muted)', opacity: 0.6 }}>© 2026 MIPHOBOOK</p>
      </div>
    </aside>
  )
}
