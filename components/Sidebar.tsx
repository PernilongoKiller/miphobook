'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/SupabaseProvider'

export default function Sidebar() {
  const router = useRouter()
  const { user: currentUser } = useUser()

  if (!currentUser) return null;

  return (
    <aside style={{ width: '300px', position: 'sticky', top: '100px', height: 'fit-content' }} className="hide-on-mobile">
      {/* Sidebar vazio por enquanto */}
    </aside>
  )
}
