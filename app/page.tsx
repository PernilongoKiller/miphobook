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
  const [activeTab, setActiveTab] = useState<'explore' | 'feed' | 'following'>('explore')
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [feedItems, setFeedItems] = useState<any[]>([])

  const fetchGlobalFeed = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    
    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, users(username, avatar_url), post_likes(user_id)')
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: photosData } = await supabase
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

      const processedPosts = (postsData || []).map(p => ({
        ...p,
        type: 'post',
        likes_count: p.post_likes?.length || 0,
        is_liked: user ? p.post_likes?.some((l: any) => l.user_id === user.id) : false
      }))

      const momentGroups: any[] = [];
      let currentGroup: any = null;

      for (const photo of photosData || []) {
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
      // Buscar IDs das pessoas que eu sigo
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

      // Buscar posts e fotos dessas pessoas
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, users(username, avatar_url), post_likes(user_id)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: photosData } = await supabase
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

      const processedPosts = (postsData || []).map(p => ({
        ...p,
        type: 'post',
        likes_count: p.post_likes?.length || 0,
        is_liked: user ? p.post_likes?.some((l: any) => l.user_id === user.id) : false
      }))

      const momentGroups: any[] = [];
      let currentGroup: any = null;

      for (const photo of photosData || []) {
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
  }, [activeTab, fetchPhotobooks, fetchGlobalFeed, fetchFollowedMoments, user])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main className="main-container" style={{ display: 'flex', justifyContent: 'center' }}>
        
        <div style={{ flexGrow: 1, maxWidth: activeTab !== 'explore' ? '600px' : '1000px', margin: '0 auto' }}>
          
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
