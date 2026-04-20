'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import Skeleton from '@/components/Skeleton'

export default function Sidebar() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSuggestions() {
      if (!supabase) return
      setLoading(true)
      
      try {
        // Busca usuários que o usuário atual NÃO segue
        let query = supabase.from('users').select('id, username, avatar_url').limit(5)
        
        if (currentUser) {
          const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id)
          
          const followingIds = following?.map(f => f.following_id) || []
          followingIds.push(currentUser.id) // Não sugerir a si mesmo
          
          query = query.not('id', 'in', `(${followingIds.join(',')})`)
        }

        const { data } = await query
        setSuggestedUsers(data || [])
      } catch (err) {
        console.error('Error fetching suggestions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [supabase, currentUser])

  if (!currentUser) return null;

  return (
    <aside style={{ width: '300px', position: 'sticky', top: '100px', height: 'fit-content' }} className="hide-on-mobile">
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>USUÁRIOS</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Skeleton width="32px" height="32px" />
              <Skeleton width="100px" height="12px" />
            </div>
          ))
        ) : suggestedUsers.length > 0 ? (
          suggestedUsers.map((user) => (
            <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div 
                onClick={() => router.push(`/profile/${user.id}`)}
                style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {user.avatar_url ? (
                    <img src={getOptimizedCloudinaryUrl(user.avatar_url, { width: 60, height: 60, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border)' }} />
                  )}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{user.username}</span>
              </div>
              <button 
                onClick={() => router.push(`/profile/${user.id}`)}
                style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '4px' }}
              >
                Ver
              </button>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Nenhum novo usuário.</p>
        )}
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
