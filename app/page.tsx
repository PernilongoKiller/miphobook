'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import Sidebar from '@/components/Sidebar'
import MomentCard from '@/components/MomentCard'
import PostCard from '@/components/PostCard'
import PostComposer from '@/components/PostComposer'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function Home() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'explore' | 'feed' | 'following' | 'trending'>('explore')
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [feedItems, setFeedItems] = useState<any[]>([])

  const fetchTrendingFeed = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    
    try {
      // Buscar posts e fotos recentes para calcular o que está em alta
      const [postsRes, photosRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('photos')
          .select(`
            *,
            photobooks (
              id, title,
              users (id, username, avatar_url)
            ),
            photo_likes(user_id),
            photo_comments(id)
          `)
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      let finalPosts = postsRes.data || []
      let postLikes: any[] = []

      if (finalPosts.length > 0) {
        const postIds = finalPosts.map(p => p.id)
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('*')
          .in('post_id', postIds)
        postLikes = likesData || []
      }

      const processedPosts = finalPosts.map((p: any) => {
        const currentPostLikes = postLikes.filter(l => l.post_id === p.id)
        return {
          ...p,
          type: 'post',
          likes_count: currentPostLikes.length,
          is_liked: user ? currentPostLikes.some((l: any) => l.user_id === user.id) : false,
          score: currentPostLikes.length * 2 // Score básico para trending
        }
      })

      const momentGroups: any[] = [];
      let currentGroup: any = null;

      for (const photo of photosRes.data || []) {
        const photoTime = new Date(photo.created_at).getTime();
        if (!currentGroup || currentGroup.photobook_id !== photo.photobook_id || currentGroup.description !== photo.description || Math.abs(photoTime - new Date(currentGroup.created_at).getTime()) > 5000) {
          currentGroup = { 
            ...photo, 
            photos: [photo], 
            type: 'moment',
            likes_count: photo.photo_likes?.length || 0,
            is_liked: user ? photo.photo_likes?.some((l: any) => l.user_id === user.id) : false,
            comments_count: photo.photo_comments?.length || 0,
            score: (photo.photo_likes?.length || 0) * 2 + (photo.photo_comments?.length || 0) * 3
          };
          momentGroups.push(currentGroup);
        } else {
          currentGroup.photos.push(photo);
        }
      }

      const combined = [
        ...processedPosts,
        ...momentGroups
      ].sort((a, b) => b.score - a.score) // Ordena pelo score (engajamento)

      setFeedItems(combined)
    } catch (err) {
      console.error("Erro ao buscar feed em alta:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  const fetchGlobalFeed = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    
    try {
      // Buscar posts e fotos em paralelo (removido post_likes da query inicial para evitar erro de relação)
      const [postsRes, photosRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('photos')
          .select(`
            *,
            photobooks (
              id, title,
              users (id, username, avatar_url)
            ),
            photo_likes(user_id),
            photo_comments(id)
          `)
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      let finalPosts = postsRes.data || []
      let postLikes: any[] = []

      if (finalPosts.length > 0) {
        const postIds = finalPosts.map(p => p.id)
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('*')
          .in('post_id', postIds)
        
        if (!likesError) {
          postLikes = likesData || []
        } else {
          console.warn("Erro ao buscar post_likes, talvez a tabela não exista:", likesError)
        }
      }

      const processedPosts = finalPosts.map((p: any) => {
        const currentPostLikes = postLikes.filter(l => l.post_id === p.id)
        return {
          ...p,
          type: 'post',
          likes_count: currentPostLikes.length,
          is_liked: user ? currentPostLikes.some((l: any) => l.user_id === user.id) : false
        }
      })

      const momentGroups: any[] = [];
      let currentGroup: any = null;

      for (const photo of photosRes.data || []) {
        const photoTime = new Date(photo.created_at).getTime();
        if (!currentGroup || currentGroup.photobook_id !== photo.photobook_id || currentGroup.description !== photo.description || Math.abs(photoTime - new Date(currentGroup.created_at).getTime()) > 5000) {
          currentGroup = { 
            ...photo, 
            photos: [photo], 
            type: 'moment',
            likes_count: photo.photo_likes?.length || 0,
            is_liked: user ? photo.photo_likes?.some((l: any) => l.user_id === user.id) : false,
            comments_count: photo.photo_comments?.length || 0
          };
          momentGroups.push(currentGroup);
        } else {
          currentGroup.photos.push(photo);
        }
      }

      const combined = [
        ...processedPosts,
        ...momentGroups
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setFeedItems(combined)
    } catch (err) {
      console.error("Erro ao buscar feed global:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  const fetchFollowedMoments = useCallback(async (currentId: string) => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentId)
      
      const followingIds = (follows || []).map(f => f.following_id)
      
      if (followingIds.length === 0) {
        setFeedItems([])
        setLoading(false)
        return
      }

      const [postsRes, photosRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users(username, avatar_url)')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('photos')
          .select(`
            *,
            photobooks (
              id, title,
              users (id, username, avatar_url)
            ),
            photo_likes(user_id),
            photo_comments(id)
          `)
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      let finalPosts = postsRes.data || []
      let postLikes: any[] = []

      if (finalPosts.length > 0) {
        const postIds = finalPosts.map(p => p.id)
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('*')
          .in('post_id', postIds)
        
        if (!likesError) {
          postLikes = likesData || []
        } else {
          console.warn("Erro ao buscar post_likes no feed seguindo:", likesError)
        }
      }

      const processedPosts = finalPosts.map((p: any) => {
        const currentPostLikes = postLikes.filter(l => l.post_id === p.id)
        return {
          ...p,
          type: 'post',
          likes_count: currentPostLikes.length,
          is_liked: user ? currentPostLikes.some((l: any) => l.user_id === user.id) : false
        }
      })

      const momentGroups: any[] = [];
      let currentGroup: any = null;

      for (const photo of photosRes.data || []) {
        const photoTime = new Date(photo.created_at).getTime();
        if (!currentGroup || currentGroup.photobook_id !== photo.photobook_id || currentGroup.description !== photo.description || Math.abs(photoTime - new Date(currentGroup.created_at).getTime()) > 5000) {
          currentGroup = { 
            ...photo, 
            photos: [photo], 
            type: 'moment',
            likes_count: photo.photo_likes?.length || 0,
            is_liked: user ? photo.photo_likes?.some((l: any) => l.user_id === user.id) : false,
            comments_count: photo.photo_comments?.length || 0
          };
          momentGroups.push(currentGroup);
        } else {
          currentGroup.photos.push(photo);
        }
      }

      const combined = [
        ...processedPosts,
        ...momentGroups
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setFeedItems(combined)
    } catch (err) {
      console.error("Erro ao buscar feed seguindo:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  const fetchPhotobooks = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('photobooks')
        .select(`id, title, users(username, avatar_url), photos(image_url, created_at)`)
        .order('created_at', { ascending: false })
        .limit(12)
      setPhotobooks(data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => {
    if (activeTab === 'explore') fetchPhotobooks()
    else if (activeTab === 'feed') fetchGlobalFeed()
    else if (activeTab === 'following' && user) fetchFollowedMoments(user.id)
    else if (activeTab === 'trending') fetchTrendingFeed()
  }, [activeTab, fetchPhotobooks, fetchGlobalFeed, fetchFollowedMoments, fetchTrendingFeed, user])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main className="main-container" style={{ display: 'flex', justifyContent: 'center' }}>
        
        <div style={{ flexGrow: 1, maxWidth: activeTab !== 'explore' ? '600px' : '1000px' }}>
          
          <div style={{ display: 'flex', gap: '25px', marginBottom: '30px', borderBottom: '1px solid var(--border)', padding: '0 15px', justifyContent: 'center' }}>
            <span 
              onClick={() => setActiveTab('explore')} 
              style={{ 
                padding: '12px 0', fontSize: '11px', fontWeight: activeTab === 'explore' ? '700' : '400',
                cursor: 'pointer', color: activeTab === 'explore' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'explore' ? '2px solid var(--text)' : 'none',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >Biblioteca</span>
            
            <span 
              onClick={() => setActiveTab('feed')} 
              style={{ 
                padding: '12px 0', fontSize: '11px', fontWeight: activeTab === 'feed' ? '700' : '400',
                cursor: 'pointer', color: activeTab === 'feed' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'feed' ? '2px solid var(--text)' : 'none',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >Feed</span>

            <span 
              onClick={() => setActiveTab('trending')} 
              style={{ 
                padding: '12px 0', fontSize: '11px', fontWeight: activeTab === 'trending' ? '700' : '400',
                cursor: 'pointer', color: activeTab === 'trending' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'trending' ? '2px solid var(--text)' : 'none',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >Em Alta</span>

            {user && (
              <span 
                onClick={() => setActiveTab('following')} 
                style={{ 
                  padding: '12px 0', fontSize: '11px', fontWeight: activeTab === 'following' ? '700' : '400',
                  cursor: 'pointer', color: activeTab === 'following' ? 'var(--text)' : 'var(--muted)',
                  borderBottom: activeTab === 'following' ? '2px solid var(--text)' : 'none',
                  textTransform: 'uppercase', letterSpacing: '1px'
                }}
              >Seguindo</span>
            )}
          </div>

          {(activeTab === 'feed' || activeTab === 'trending') && (
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px', 
              overflowX: 'auto', 
              padding: '0 5px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '10px'
            }} className="no-scrollbar">
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Vibes:</span>
              {['#casual', '#arte', '#viagem', '#natureza', '#memoria'].map(vibe => (
                <span 
                  key={vibe}
                  style={{ 
                    fontSize: '11px',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onClick={() => toast(`Filtrando por ${vibe}`, 'success')}
                >
                  {vibe}
                </span>
              ))}
            </div>
          )}

          {activeTab === 'feed' && user && (
            <PostComposer onPostCreated={fetchGlobalFeed} />
          )}

          {loading ? (
            <div className={activeTab === 'explore' ? "responsive-grid" : ""}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ marginBottom: '40px', height: activeTab === 'explore' ? '300px' : '500px' }}>
                  <Skeleton height="100%" width="100%" />
                </div>
              ))}
            </div>
          ) : activeTab === 'explore' ? (
            <div className="responsive-grid">
              {photobooks.map((pb) => {
                const photos = pb.photos || [];
                const cover = photos.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.image_url;
                
                return (
                  <div key={pb.id} className="book-card" onClick={() => router.push(`/photobook/${pb.id}`)}>
                    <div className="book-cover">
                      <div className="book-cover-photo-wrapper">
                        {cover ? (
                          <img 
                            src={getOptimizedCloudinaryUrl(cover, { width: 300, height: 400 })} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            loading="lazy"
                            alt={pb.title}
                          />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--border)' }}>photo_library</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="book-info">
                      <h4 className="book-title">{pb.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>{pb.users?.username}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feedItems.length > 0 ? (
                feedItems.map((item, index) => (
                  item.type === 'post' ? (
                    <PostCard key={item.id} post={item} />
                  ) : (
                    <MomentCard key={item.id} moment={item} />
                  )
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <p className="meta">Nada para ver aqui por enquanto.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
