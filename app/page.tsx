'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function Home() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'explore' | 'following'>('explore')
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])

  const fetchPhotobooks = useCallback(async (currentId: string | null, tab: 'explore' | 'following') => {
    if (!supabase) return
    setLoading(true)
    
    try {
      if (tab === 'following' && currentId) {
        const { data: followingData } = await supabase.from('follows').select('following_id').eq('follower_id', currentId)
        const followingIds = followingData?.map(f => f.following_id) || []
        
        if (followingIds.length === 0) {
          const { data: popularUsers } = await supabase.from('users').select('id, username, avatar_url').limit(5)
          setSuggestedUsers(popularUsers || [])
          setPhotobooks([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('photobooks')
          .select(`
            id, title, description, user_id, created_at,
            users (username, avatar_url),
            photos (image_url, created_at)
          `)
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(12)
        
        if (error) throw error
        setPhotobooks(data || [])
      } else {
        const { data, error } = await supabase
          .from('photobooks')
          .select(`
            id, title, description, user_id, created_at,
            users (username, avatar_url),
            photos (image_url, created_at)
          `)
          .order('created_at', { ascending: false })
          .limit(12)

        if (error) throw error
        setPhotobooks(data || [])
      }
    } catch (err: any) { 
      console.error("Erro na busca de photobooks:", err?.message || err) 
    } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => {
    fetchPhotobooks(user?.id || null, activeTab)
  }, [user, activeTab, fetchPhotobooks])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main className="main-container">
        
        {/* ABAS MINIMALISTAS */}
        <div style={{ display: 'flex', gap: '25px', marginBottom: '30px', borderBottom: '1px solid var(--border)' }}>
          <span 
            onClick={() => setActiveTab('explore')} 
            style={{ 
              padding: '12px 0', fontSize: '11px', fontWeight: activeTab === 'explore' ? '600' : '400',
              cursor: 'pointer', color: activeTab === 'explore' ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === 'explore' ? '1px solid var(--text)' : 'none'
            }}
          >Explorar</span>
          {user && (
            <span 
              onClick={() => setActiveTab('following')} 
              style={{ 
                padding: '12px 0', fontSize: '11px', fontWeight: activeTab === 'following' ? '600' : '400',
                cursor: 'pointer', color: activeTab === 'following' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'following' ? '1px solid var(--text)' : 'none'
              }}
            >Seguindo</span>
          )}
        </div>

        {loading ? (
          <div className="responsive-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton height="200px" width="100%" />
                <div style={{ padding: '10px 0' }}><Skeleton height="15px" width="70%" /></div>
              </div>
            ))}
          </div>
        ) : photobooks.length > 0 ? (
          <div className="responsive-grid">
            {photobooks.map((pb) => {
              const cover = pb.photos?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.image_url;
              return (
                <div 
                  key={pb.id} 
                  className="card-border" 
                  onClick={() => router.push(`/photobook/${pb.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                    {cover && (
                      <img src={getOptimizedCloudinaryUrl(cover, { width: 400, height: 400, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ padding: '10px 0' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '500' }}>{pb.title}</h4>
                    <span className="meta">{pb.users?.username}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <p className="meta">Nada por aqui.</p>
          </div>
        )}
      </main>
    </div>
  )
}
