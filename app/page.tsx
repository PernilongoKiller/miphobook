'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function Home() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'explore' | 'following'>('explore')
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])

  const fetchPhotobooks = useCallback(async (currentId: string | null, tab: 'explore' | 'following', abortSignal?: AbortController) => {
    if (!supabase) return
    setLoading(true)
    
    try {
      let query = supabase
        .from('photobooks')
        .select(`
          id, title, description, user_id, created_at,
          users (username, avatar_url),
          photos (image_url, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(12)

      if (tab === 'following' && currentId) {
        // Primeiro pegamos quem o usuário segue para filtrar
        const { data: followingData, error: followError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentId)
        
        if (followError) throw followError
        
        const followingIds = followingData?.map(f => f.following_id) || []
        
        if (followingIds.length === 0) {
          const { data: popularUsers } = await supabase.from('users').select('id, username, avatar_url').limit(5)
          setSuggestedUsers(popularUsers || [])
          setPhotobooks([])
          return
        }
        
        query = query.in('user_id', followingIds)
      }

      const { data, error } = await query
      
      if (abortSignal?.signal.aborted) return
      if (error) throw error
      setPhotobooks(data || [])
    } catch (err: any) { 
      if (err?.name === 'AbortError') return;
      
      console.error("Erro na busca de photobooks:", err?.message || err)
      if (err?.message?.includes('fetch')) {
        toast('Erro de conexão. Verifique sua internet.', 'error')
      }
    } finally { 
      if (!abortSignal?.signal.aborted) setLoading(false) 
    }
  }, [supabase])

  useEffect(() => {
    const controller = new AbortController()
    
    // Aumentamos o delay para evitar colisões de requisições de rede
    const timer = setTimeout(() => {
      fetchPhotobooks(user?.id || null, activeTab, controller)
    }, 150)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [user?.id, activeTab, fetchPhotobooks])

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
              >biblioteca</span>
              {user && (            <span 
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
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="book-card">
                <Skeleton height="100%" width="100%" />
              </div>
            ))}
          </div>
        ) : photobooks.length > 0 ? (
          <div className="responsive-grid">
            {photobooks.map((pb) => {
              const photos = pb.photos || [];
              const cover = photos.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.image_url;
              
              return (
                <div 
                  key={pb.id} 
                  className="book-card"
                  onClick={() => router.push(`/photobook/${pb.id}`)}
                >
                  <div className="book-cover">
                    {cover ? (
                      <img 
                        src={getOptimizedCloudinaryUrl(cover, { width: 400, height: 600, crop: 'fill' })} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                        alt={pb.title}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--border)' }}>
                         <span className="meta">Vazio</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="book-info">
                    <h4 className="book-title">{pb.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="meta" style={{ fontSize: '9px' }}>{pb.users?.username}</span>
                      <span className="meta" style={{ fontSize: '8px' }}>{photos.length} {photos.length === 1 ? 'MOMENTO' : 'MOMENTOS'}</span>
                    </div>
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
