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
import MemoryPrompt from '@/components/MemoryPrompt'
import Navigation from '@/components/Navigation'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function Home() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'explore' | 'feed' | 'following'>('feed')
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [composerPrefill, setComposerPrefill] = useState('')

  const fetchGlobalFeed = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    try {
      const [postsRes, photosRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users(username, avatar_url)')
          .gt('created_at', yesterday)
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
          .gt('created_at', yesterday)
          .order('created_at', { ascending: false })
          .limit(50)
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
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
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
          .gt('created_at', yesterday)
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
          .in('user_id', followingIds)
          .gt('created_at', yesterday)
          .order('created_at', { ascending: false })
          .limit(50)
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
  }, [activeTab, fetchPhotobooks, fetchGlobalFeed, fetchFollowedMoments, user])

  // Lógica para mudar aba via hash (vindo da navegação)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#explore') setActiveTab('explore');
      else if (hash === '#feed') setActiveTab('feed');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <div className="app-layout">
        <Navigation />

        <main className="main-feed">
          
          <div style={{ display: 'flex', gap: '25px', marginBottom: '20px', borderBottom: '1px solid var(--border)', padding: '0 5px' }}>
            <span 
              onClick={() => setActiveTab('feed')} 
              style={{ 
                padding: '12px 0', fontSize: '12px', fontWeight: activeTab === 'feed' ? '700' : '500',
                cursor: 'pointer', color: activeTab === 'feed' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'feed' ? '2px solid var(--text)' : 'none',
              }}
            >Para você</span>

            {user && (
              <span 
                onClick={() => setActiveTab('following')} 
                style={{ 
                  padding: '12px 0', fontSize: '12px', fontWeight: activeTab === 'following' ? '700' : '500',
                  cursor: 'pointer', color: activeTab === 'following' ? 'var(--text)' : 'var(--muted)',
                  borderBottom: activeTab === 'following' ? '2px solid var(--text)' : 'none',
                }}
              >Seguindo</span>
            )}

            <span 
              onClick={() => setActiveTab('explore')} 
              style={{ 
                padding: '12px 0', fontSize: '12px', fontWeight: activeTab === 'explore' ? '700' : '500',
                cursor: 'pointer', color: activeTab === 'explore' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'explore' ? '2px solid var(--text)' : 'none',
              }}
            >Biblioteca</span>
          </div>

          {activeTab !== 'explore' && user && (
            <div style={{ marginBottom: '24px' }}>
              <PostComposer onPostCreated={fetchGlobalFeed} prefilledContent={composerPrefill} />
              <MemoryPrompt onSelectPrompt={(prompt) => {
                setComposerPrefill(`**${prompt}**\n`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: '300px' }}>
                  <Skeleton height="100%" width="100%" />
                </div>
              ))}
            </div>
          ) : activeTab === 'explore' ? (
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {photobooks.map((pb) => {
                const photos = pb.photos || [];
                const cover = photos.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.image_url;
                
                return (
                  <div key={pb.id} className="book-card" onClick={() => router.push(`/photobook/${pb.id}`)}>
                    <div className="book-cover" style={{ padding: '20px 10px 10px 25px' }}>
                      <div className="book-cover-photo-wrapper" style={{ maxHeight: '120px' }}>
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
                    <div className="book-info" style={{ padding: '10px 10px 20px 25px' }}>
                      <h4 className="book-title" style={{ fontSize: '11px' }}>{pb.title}</h4>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600' }}>{pb.users?.username}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feedItems.length > 0 ? (
                feedItems.map((item) => (
                  item.type === 'post' ? (
                    <PostCard key={item.id} post={item} />
                  ) : (
                    <MomentCard key={item.id} moment={item} />
                  )
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <p className="meta">Nada para ver aqui por enquanto.</p>
                  {!user && <button onClick={() => router.push('/login')} className="button-primary" style={{ marginTop: '20px' }}>CRIAR CONTA</button>}
                </div>
              )}
            </div>
          )}
        </main>

      </div>
    </div>
  )
}
