'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/SupabaseProvider'

export default function Sidebar() {
  const router = useRouter()
  const { user: currentUser } = useUser()

  if (!currentUser) return null;

  return (
    <aside className="right-column hide-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '0 20px', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.6' }}>
        <p>© 2026 MIPHOBOOK</p>
        <p style={{ marginTop: '8px' }}>Nem toda foto é só uma imagem.</p>
      </div>
    </aside>
  )
}
