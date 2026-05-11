'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import { getOptimizedCloudinaryUrl, DEFAULT_AVATAR } from '@/lib/cloudinary'

import Navigation from '@/components/Navigation'
import Sidebar from '@/components/Sidebar'

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
      
      <div className="app-layout">
        <Navigation />

        <main className="main-feed">
          <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Comunidade
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Explore e descubra novas histórias através das pessoas que compõem o miphobook.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="social-card" style={{ padding: '16px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <Skeleton width="48px" height="48px" style={{ borderRadius: '50%' }} />
                  <div style={{ flexGrow: 1 }}>
                    <Skeleton width="100px" height="12px" style={{ marginBottom: '8px' }} />
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
                  padding: '16px', 
                  display: 'flex', 
                  gap: '15px', 
                  alignItems: 'center', 
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, backgroundColor: 'var(--border)' }}>
                  <img 
                    src={u.avatar_url ? getOptimizedCloudinaryUrl(u.avatar_url, { width: 96, height: 96 }) : DEFAULT_AVATAR} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    loading="lazy"
                    alt={u.username}
                  />
                </div>
                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{u.username}</h3>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--muted)', 
                    margin: '2px 0 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {u.bio || 'Sem biografia disponível.'}
                  </p>
                </div>
                <button className="button-primary" style={{ padding: '6px 16px', fontSize: '10px' }}>VER PERFIL</button>
              </div>
            ))}
          </div>
        </main>

        <Sidebar />
      </div>
    </div>
  )
}
