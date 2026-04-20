'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import { getOptimizedCloudinaryUrl, DEFAULT_AVATAR } from '@/lib/cloudinary'

export default function UsersPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      if (!supabase) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url, bio')
          .order('username', { ascending: true })
        
        if (error) throw error
        setUsers(data || [])
      } catch (err) {
        console.error('Erro ao buscar usuários:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [supabase])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      
      <main className="main-container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-1px' }}>
            Membros da Comunidade
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
            Explore e descubra novas histórias através das pessoas que compõem o miphobook.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="social-card" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <Skeleton width="50px" height="50px" style={{ borderRadius: '50%' }} />
                <div style={{ flexGrow: 1 }}>
                  <Skeleton width="100px" height="15px" style={{ marginBottom: '8px' }} />
                  <Skeleton width="150px" height="10px" />
                </div>
              </div>
            ))
          ) : users.map((u) => (
            <div 
              key={u.id} 
              className="social-card" 
              onClick={() => router.push(`/profile/${u.id}`)}
              style={{ 
                padding: '20px', 
                display: 'flex', 
                gap: '15px', 
                alignItems: 'center', 
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, backgroundColor: 'var(--border)' }}>
                <img 
                  src={u.avatar_url ? getOptimizedCloudinaryUrl(u.avatar_url, { width: 100, height: 100 }) : DEFAULT_AVATAR} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  loading="lazy"
                  alt={u.username}
                />
              </div>
              <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{u.username}</h3>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--muted)', 
                  margin: '4px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {u.bio || 'Sem bio.'}
                </p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--border)' }}>
                chevron_right
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
