'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import PostCard from '@/components/PostCard'
import MomentCard from '@/components/MomentCard'
import FormattedText from '@/components/FormattedText'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function UserProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  
  const [profile, setProfile] = useState<any>(null)
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [moments, setMoments] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'books' | 'moments' | 'posts'>('books')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [social, setSocial] = useState({ isFollowing: false, followers: 0, following: 0 })
  const [followLoading, setFollowLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    if (!supabase || !id) return
    try {
      const { data } = await supabase
        .from('posts')
        .select('*, users(username, avatar_url)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
      setPosts(data || [])
    } catch (err) { console.error(err) }
  }, [supabase, id])

  const fetchMoments = useCallback(async () => {
    // ... (lógica existente mantida)
    if (!supabase || !id) return
    try {
      const { data: photosData } = await supabase
        .from('photos')
        .select(`
          *,
          photobooks (
            id, title,
            users (id, username, avatar_url)
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(30)

      const groups: any[] = [];
      let currentGroup: any = null;

      for (const photo of photosData || []) {
        const photoTime = new Date(photo.created_at).getTime();
        if (!currentGroup || currentGroup.photobook_id !== photo.photobook_id || currentGroup.description !== photo.description || Math.abs(photoTime - new Date(currentGroup.created_at).getTime()) > 5000) {
          const [likesRes, userLikeRes, commentsRes] = await Promise.all([
            supabase.from('photo_likes').select('id', { count: 'exact', head: true }).eq('photo_id', photo.id),
            currentUser ? supabase.from('photo_likes').select('id').eq('photo_id', photo.id).eq('user_id', currentUser.id).limit(1) : Promise.resolve({ data: [] }),
            supabase.from('photo_comments').select('id', { count: 'exact', head: true }).eq('photo_id', photo.id)
          ])
          currentGroup = { ...photo, photos: [photo], likes_count: likesRes.count || 0, is_liked: !!(userLikeRes.data && userLikeRes.data.length > 0), comments_count: commentsRes.count || 0 };
          groups.push(currentGroup);
        } else {
          currentGroup.photos.push(photo);
        }
      }
      setMoments(groups)
    } catch (err) { console.error(err) }
  }, [supabase, id, currentUser])

  const fetchData = useCallback(async () => {
    if (!supabase || !id || id === 'null' || id === 'undefined') return
    setLoading(true)
    setError(null)

    try {
      const authId = currentUser?.id || null
      const { data: pData, error: pError } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
      
      if (pError) throw pError
      if (!pData) {
        setError("Perfil não encontrado.")
        return
      }
      setProfile(pData)

      const [pbRes, followersRes, followingRes, isFollowingRes] = await Promise.allSettled([
        supabase.from('photobooks').select('*, photos(image_url)').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
        authId ? supabase.from('follows').select('*').eq('follower_id', authId).eq('following_id', id).maybeSingle() : Promise.resolve({ data: null })
      ])

      if (pbRes.status === 'fulfilled') setPhotobooks(pbRes.value.data || [])
      
      setSocial({
        followers: (followersRes.status === 'fulfilled' ? followersRes.value.count : 0) || 0,
        following: (followingRes.status === 'fulfilled' ? followingRes.value.count : 0) || 0,
        isFollowing: (isFollowingRes.status === 'fulfilled' ? !!isFollowingRes.value.data : false)
      })

      fetchMoments()
      fetchPosts()
    } catch (err: any) {
      console.error("Erro no Perfil:", err)
      setError("Erro ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }, [supabase, id, currentUser, fetchMoments, fetchPosts])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFollow = async () => {
    if (!supabase || !currentUser || followLoading) return
    setFollowLoading(true)
    try {
      if (social.isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id)
        setSocial(s => ({ ...s, isFollowing: false, followers: Math.max(0, s.followers - 1) }))
      } else {
        await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id })
        setSocial(s => ({ ...s, isFollowing: true, followers: s.followers + 1 }))
      }
    } catch (err) { console.error(err) } finally { setFollowLoading(false) }
  }

  const isOwner = !!(currentUser && profile && currentUser.id === profile.id)

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <main className="main-container">
        <Skeleton height="200px" width="100%" style={{ marginBottom: '20px' }} />
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <Skeleton width="100px" height="100px" />
          <Skeleton width="200px" height="40px" />
        </div>
        <div className="responsive-grid">
           {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="240px" width="100%" />)}
        </div>
      </main>
    </div>
  )

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      <main className="main-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p className="meta">{error || "Não encontrado"}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px' }}>Voltar</button>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main className="main-container">
        
        {/* Banner Noir */}
        <div className="card-border" style={{ 
          width: '100%', 
          height: '200px', 
          backgroundColor: 'var(--border)', 
          overflow: 'hidden', 
          marginBottom: '20px',
          borderWidth: '2px'
        }}>
          {profile.banner_url && (
            <img 
              src={getOptimizedCloudinaryUrl(profile.banner_url, { width: 1200 })} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}
        </div>

        {/* Informações do Perfil */}
        <div style={{ paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* Avatar Quadrado Are.na */}
            <div className="card-border" style={{ width: '100px', height: '100px', backgroundColor: 'var(--bg)', flexShrink: 0, borderWidth: '2px' }}>
              {profile.avatar_url ? (
                <img src={getOptimizedCloudinaryUrl(profile.avatar_url, { width: 200, height: 200, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>person</span>
                </div>
              )}
            </div>

            <div style={{ flexGrow: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>{profile.username}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isOwner ? (
                    <button onClick={() => router.push(`/profile/${id}/edit`)} style={{ height: '32px', fontSize: '10px' }}>EDITAR PERFIL</button>
                  ) : (
                    <button onClick={handleFollow} disabled={followLoading} style={{ height: '32px', fontSize: '10px', backgroundColor: social.isFollowing ? 'transparent' : 'var(--text)', color: social.isFollowing ? 'var(--text)' : 'var(--bg)' }}>
                      {social.isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <span className="meta">{social.followers} SEGUIDORES</span>
                <span className="meta">{social.following} SEGUINDO</span>
                <span className="meta">{photobooks.length} ÁLBUNS</span>
              </div>

              {profile.bio && (
                <p style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '20px', maxWidth: '600px' }}>
                  <FormattedText text={profile.bio} />
                </p>
              )}

              {/* Links Pessoais Minimalistas */}
              {profile.links && profile.links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="meta" style={{ textDecoration: 'underline', color: 'var(--text)' }}>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ABAS */}
        <div style={{ display: 'flex', gap: '30px', borderBottom: '2px solid var(--border)', marginBottom: '30px' }}>
          <button 
            onClick={() => setActiveTab('books')}
            style={{ 
              border: 'none', padding: '15px 0', backgroundColor: 'transparent', 
              color: activeTab === 'books' ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === 'books' ? '2px solid var(--text)' : 'none',
              borderRadius: 0, fontSize: '11px', fontWeight: '800'
            }}
          >
            ÁLBUNS
          </button>
          <button 
            onClick={() => setActiveTab('moments')}
            style={{ 
              border: 'none', padding: '15px 0', backgroundColor: 'transparent', 
              color: activeTab === 'moments' ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === 'moments' ? '2px solid var(--text)' : 'none',
              borderRadius: 0, fontSize: '11px', fontWeight: '800'
            }}
          >
            MOMENTOS
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            style={{ 
              border: 'none', padding: '15px 0', backgroundColor: 'transparent', 
              color: activeTab === 'posts' ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === 'posts' ? '2px solid var(--text)' : 'none',
              borderRadius: 0, fontSize: '11px', fontWeight: '800'
            }}
          >
            POSTS
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        {activeTab === 'books' ? (
          <div className="responsive-grid">
            {photobooks.map((pb) => {
              const cover = pb.photos?.[0]?.image_url;
              return (
                <div 
                  key={pb.id} 
                  className="book-card" 
                  onClick={() => router.push(`/photobook/${pb.id}`)}
                >
                  <div className="book-cover">
                    <div className="book-cover-photo-wrapper">
                      {cover ? (
                        <img src={getOptimizedCloudinaryUrl(cover, { width: 300, height: 400, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--border)' }}>photo_library</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="book-info">
                    <h4 className="book-title">{pb.title}</h4>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>{pb.photos?.length || 0} FOTOS</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : activeTab === 'moments' ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {moments.length > 0 ? (
              moments.map(moment => (
                <MomentCard key={moment.id} moment={moment} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <p className="meta">Nenhum momento compartilhado.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <p className="meta">Nenhum post publicado.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
