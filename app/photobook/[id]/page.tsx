'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

interface PhotoGroup {
  id: string; 
  description: string;
  createdAt: string;
  photos: any[];
  comments: any[];
  likes: number;
  isLiked: boolean;
}

export default function PhotobookDetailPage() {
  const router = useRouter()
  const { id } = useParams();
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  
  const [photobook, setPhotobook] = useState<any>(null)
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [pbLikes, setPbLikes] = useState<number>(0)
  const [isPbLiked, setIsPbLiked] = useState(false)

  const fetchPhotobookDetails = useCallback(async () => {
    if (!supabase || !id) return
    setLoading(true)

    try {
      const { data: photobookData } = await supabase.from('photobooks').select('*, users(username, avatar_url)').eq('id', id).single()
      setPhotobook(photobookData)

      const { data: photosData } = await supabase.from('photos').select('*').eq('photobook_id', id).order('created_at', { ascending: true })
      
      const groups: PhotoGroup[] = [];
      let currentGroup: PhotoGroup | null = null;

      for (const photo of photosData || []) {
        const photoTime = new Date(photo.created_at).getTime();
        if (!currentGroup || (Math.abs(photoTime - new Date(currentGroup.createdAt).getTime()) > 5000) || (photo.description !== currentGroup.description)) {
          const [commentsRes, likesRes, userLikeRes] = await Promise.all([
            supabase.from('photo_comments').select('*, users(username, avatar_url)').eq('photo_id', photo.id).order('created_at', { ascending: true }),
            supabase.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id),
            currentUser ? supabase.from('photo_likes').select('*').eq('photo_id', photo.id).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null })
          ]);
          
          currentGroup = { 
            id: photo.id, description: photo.description || '', createdAt: photo.created_at, 
            photos: [photo], comments: commentsRes.data || [], likes: likesRes.count || 0, isLiked: !!userLikeRes.data
          };
          groups.push(currentGroup);
        } else {
          currentGroup.photos.push(photo);
        }
      }
      setPhotoGroups(groups);

      const { count: pbLikesCount } = await supabase.from('photobook_likes').select('*', { count: 'exact', head: true }).eq('photobook_id', id)
      setPbLikes(pbLikesCount || 0)
      if (currentUser) {
        const { data: userPbLike } = await supabase.from('photobook_likes').select('*').eq('photobook_id', id).eq('user_id', currentUser.id).maybeSingle()
        setIsPbLiked(!!userPbLike)
      }
    } catch (err: any) {
      toast(`Erro ao carregar photobook.`, 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase, id, currentUser, toast])

  useEffect(() => { fetchPhotobookDetails() }, [fetchPhotobookDetails])

  const sendNotification = async (type: string, targetUserId: string, entityId: string | null) => {
    if (!supabase || !currentUser || currentUser.id === targetUserId) return
    await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: currentUser.id, type, entity_id: entityId })
  }

  const handlePbLike = async () => {
    if (!supabase || !currentUser) return router.push('/login')
    if (isPbLiked) {
      await supabase.from('photobook_likes').delete().eq('photobook_id', id).eq('user_id', currentUser.id)
      setPbLikes(prev => prev - 1); setIsPbLiked(false)
    } else {
      await supabase.from('photobook_likes').insert({ photobook_id: id, user_id: currentUser.id })
      setPbLikes(prev => prev + 1); setIsPbLiked(true)
      sendNotification('like_pb', photobook.user_id, id as string)
    }
  }

  const handleMomentLike = async (groupId: string) => {
    if (!supabase || !currentUser) return router.push('/login')
    const group = photoGroups.find(g => g.id === groupId)
    if (!group) return
    if (group.isLiked) {
      await supabase.from('photo_likes').delete().eq('photo_id', groupId).eq('user_id', currentUser.id)
      setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isLiked: false, likes: Math.max(0, g.likes - 1) } : g))
    } else {
      await supabase.from('photo_likes').insert({ photo_id: groupId, user_id: currentUser.id })
      setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isLiked: true, likes: g.likes + 1 } : g))
      sendNotification('like_moment', photobook.user_id, id as string)
    }
  }

  const handleAddComment = async (groupId: string) => {
    if (!supabase || !currentUser) return
    const content = newComment[groupId]?.trim()
    if (!content || content.length < 2) return
    const { data, error } = await supabase.from('photo_comments').insert({ photo_id: groupId, user_id: currentUser.id, content }).select('*, users(username, avatar_url)').single()
    if (!error && data) {
      setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, comments: [...g.comments, data] } : g));
      setNewComment(prev => ({ ...prev, [groupId]: '' }))
      sendNotification('comment', photobook.user_id, id as string)
    }
  }

  const handleDeleteComment = async (groupId: string, commentId: string) => {
    if (!supabase || !window.confirm("Apagar comentário?")) return
    const { error } = await supabase.from('photo_comments').delete().eq('id', commentId)
    if (!error) {
      setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, comments: g.comments.filter((c: any) => c.id !== commentId) } : g))
    }
  }

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    if (!supabase || !window.confirm("Apagar foto?")) return
    try {
      const publicId = imageUrl.split('/').pop()?.split('.')[0]
      await fetch('/api/cloudinary/delete', { method: 'POST', body: JSON.stringify({ publicId }) })
      await supabase.from('photos').delete().eq('id', photoId)
      fetchPhotobookDetails()
    } catch (err) { toast('Erro ao apagar.', 'error') }
  }

  const isOwner = currentUser && photobook && currentUser.id === photobook.user_id

  if (loading && !photobook) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <main style={{ flexGrow: 1, maxWidth: '600px', margin: '0 auto', width: '100%', padding: '60px 20px' }}>
        <Skeleton height="30px" width="40%" style={{ marginBottom: '40px' }} />
        <Skeleton height="300px" width="100%" />
      </main>
    </div>
  )

  if (!photobook) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      <main style={{ flexGrow: 1, maxWidth: '600px', margin: '0 auto', width: '100%', padding: '80px 20px' }}>
        
        {/* HEADER ARE.NA STYLE */}
        <header style={{ marginBottom: '100px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-1px' }}>{photobook.title}</h1>
          <div className="meta" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center' }}>
            <span onClick={() => router.push(`/profile/${photobook.user_id}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{photobook.users?.username}</span>
            <span>•</span>
            <span onClick={handlePbLike} style={{ cursor: 'pointer', textDecoration: isPbLiked ? 'underline' : 'none' }}>{pbLikes} APRECIAÇÕES</span>
          </div>
          {isOwner && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
               <span onClick={() => router.push(`/photobook/${id}/edit`)} className="meta" style={{ cursor: 'pointer', textDecoration: 'underline' }}>EDITAR ÁLBUM</span>
               <span onClick={() => router.push(`/photobook/${id}/upload`)} className="meta" style={{ cursor: 'pointer', textDecoration: 'underline' }}>+ ADICIONAR MOMENTO</span>
            </div>
          )}
          {photobook.description && (
            <p style={{ marginTop: '30px', fontSize: '14px', lineHeight: '1.6', color: 'var(--muted)', maxWidth: '500px', margin: '30px auto 0 auto' }}>
              {photobook.description}
            </p>
          )}
        </header>

        {/* TIMELINE DE MOMENTOS (ESCALA HUMANA) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
          {photoGroups.map((group) => (
            <article key={group.id} className="parent-hover" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              
              {/* GRADE FLEXÍVEL E COMPORTADA */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: group.photos.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: '2px',
                width: '100%',
                maxWidth: group.photos.length === 1 ? '100%' : '100%'
              }}>
                {group.photos.map((photo) => (
                  <div key={photo.id} className="parent-hover" style={{ border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1/1', backgroundColor: 'var(--border)' }}>
                      <img 
                        src={getOptimizedCloudinaryUrl(photo.image_url, { width: 800, height: 800, crop: 'fill' })} 
                        alt="Moment" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }} 
                        onClick={() => window.open(photo.image_url, '_blank')}
                      />
                    </div>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, photo.image_url); }} 
                        className="show-on-hover"
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--bg)', padding: '2px 6px', fontSize: '9px', fontWeight: 'bold' }}
                      >APAGAR</button>
                    )}
                  </div>
                ))}
              </div>

              {/* INFO DO MOMENTO */}
              <div style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span className="meta">{new Date(group.createdAt).toLocaleDateString()}</span>
                  <span 
                    onClick={() => handleMomentLike(group.id)} 
                    className="meta show-on-hover" 
                    style={{ cursor: 'pointer', textDecoration: group.isLiked ? 'underline' : 'none', color: group.isLiked ? '#ff4d4f' : 'var(--muted)' }}
                  >
                    {group.likes} LIKES
                  </span>
                </div>
                
                {group.description && <p style={{ fontSize: '14px', lineHeight: '1.6', margin: '0 0 15px 0', color: 'var(--text)' }}>{group.description}</p>}

                {/* CONVERSAS DISCRETAS */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {group.comments.map((c: any) => (
                      <div key={c.id} className="parent-hover" style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <strong style={{ color: 'var(--text)' }}>{c.users?.username}</strong> {c.content}
                        </span>
                        {(currentUser?.id === c.user_id || isOwner) && (
                          <span 
                            onClick={() => handleDeleteComment(group.id, c.id)} 
                            className="show-on-hover" 
                            style={{ cursor: 'pointer', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px' }}
                          >
                            [X]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentUser && (
                    <input 
                      type="text" 
                      placeholder="+ comentar" 
                      value={newComment[group.id] || ''} 
                      onChange={(e) => setNewComment(prev => ({ ...prev, [group.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(group.id)}
                      className="show-on-hover"
                      style={{ fontSize: '11px', width: '100%', border: 'none', borderBottom: '1px solid var(--border)', padding: '4px 0', color: 'var(--muted)' }}
                    />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
