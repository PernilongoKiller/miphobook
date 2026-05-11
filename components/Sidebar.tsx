'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { getOptimizedCloudinaryUrl, DEFAULT_AVATAR } from '@/lib/cloudinary'
import Skeleton from '@/components/Skeleton'

export default function Sidebar() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        // Busca alguns usuários aleatórios (exceto o atual)
        let query = supabase
          .from('users')
          .select('id, username, avatar_url')
          .limit(5)
        
        if (currentUser) {
          query = query.neq('id', currentUser.id)
        }

        const { data } = await query
        setSuggestedUsers(data || [])
      } catch (err) {
        console.error("Erro ao buscar sugestões:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [supabase, currentUser])

  if (!currentUser && !loading) return null;

  return (
    <aside className="right-column hide-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="social-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Membros Sugeridos
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Skeleton width="40px" height="40px" circle />
                <div style={{ flexGrow: 1 }}>
                  <Skeleton width="100px" height="12px" />
                </div>
              </div>
            ))
          ) : suggestedUsers.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div 
                onClick={() => router.push(`/profile/${u.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexGrow: 1 }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--border)' }}>
                  <img 
                    src={u.avatar_url ? getOptimizedCloudinaryUrl(u.avatar_url, { width: 80, height: 80 }) : DEFAULT_AVATAR} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt={u.username}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{u.username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Sugestão para você</div>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/profile/${u.id}`)}
                style={{ padding: '6px 12px', fontSize: '10px', border: 'none', color: '#0095f6', fontWeight: '700' }}
              >
                VER
              </button>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => router.push('/users')}
          style={{ width: '100%', marginTop: '20px', fontSize: '10px', opacity: 0.6, border: 'none', textAlign: 'left' }}
        >
          VER TODOS OS MEMBROS
        </button>
      </div>

      <div style={{ padding: '0 20px', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.6' }}>
        <p>© 2026 MIPHOBOOK DA CUBIECLOUD</p>
        <p style={{ marginTop: '8px' }}>Nem toda foto é só uma imagem. Guarde suas memórias com carinho.</p>
      </div>
    </aside>
  )
}
