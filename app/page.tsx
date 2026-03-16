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
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => {
    fetchPhotobooks(user?.id || null, activeTab)
  }, [user, activeTab, fetchPhotobooks])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main style={{ flexGrow: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '40px 15px' }}>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('explore')} 
            style={{ 
              background: 'none', border: 'none', borderBottom: activeTab === 'explore' ? '2px solid var(--text)' : 'none',
              padding: '12px 0', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: activeTab === 'explore' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer', flexGrow: user ? 1 : 0
            }}
          >Explorar</button>
          {user && (
            <button 
              onClick={() => setActiveTab('following')} 
              style={{ 
                background: 'none', border: 'none', borderBottom: activeTab === 'following' ? '2px solid var(--text)' : 'none',
                padding: '12px 0', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: activeTab === 'following' ? 'var(--text)' : 'var(--muted)',
                cursor: 'pointer', flexGrow: 1
              }}
            >Seguindo</button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-border">
                <Skeleton height="280px" width="100%" />
                <div style={{ padding: '15px' }}><Skeleton height="20px" width="70%" /></div>
              </div>
            ))}
          </div>
        ) : photobooks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {photobooks.map((pb) => {
              // Get the most recent photo for the cover
              const sortedPhotos = pb.photos?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              const cover = sortedPhotos?.[0]?.image_url;
              return (
                <div key={pb.id} className="card-border parent-hover" style={{ backgroundColor: 'var(--bg)', position: 'relative' }}>
                  <div 
                    onClick={() => router.push(`/photobook/${pb.id}`)} 
                    style={{ cursor: 'pointer', aspectRatio: '1/1', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}
                  >
                    {cover ? (
                      <img src={getOptimizedCloudinaryUrl(cover, { width: 600, height: 600, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--muted)' }}>photo_library</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h4 onClick={() => router.push(`/photobook/${pb.id}`)} style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>{pb.title}</h4>
                      <div onClick={(e) => { e.stopPropagation(); router.push(`/profile/${pb.user_id}`); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        {pb.users?.avatar_url ? (
                          <img src={getOptimizedCloudinaryUrl(pb.users.avatar_url, { width: 40, height: 40, crop: 'fill' })} style={{ width: '18px', height: '18px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--muted)' }}>{pb.users?.username}</span>
                      </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : activeTab === 'following' ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '14px', marginBottom: '30px', color: 'var(--muted)' }}>Você ainda não segue ninguém ou não há novos momentos.</p>
            <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '40px' }}>Sugestões para curadoria</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
              {suggestedUsers.map(u => (
                <div key={u.id} onClick={() => router.push(`/profile/${u.id}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {u.avatar_url ? (
                    <img src={getOptimizedCloudinaryUrl(u.avatar_url, { width: 80, height: 80, crop: 'fill' })} style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>person</span>
                    </div>
                  )}
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Nenhum álbum encontrado no momento.</p>
          </div>
        )}
      </main>
    </div>
  )
}
