'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import FormattedText from '@/components/FormattedText'
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
  const params = useParams()
  const id = params.id as string
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

      const { data: photosData } = await supabase.from('photos').select('*').eq('photobook_id', id).order('created_at', { ascending: true }).order('id', { ascending: true })
      
      const groups: PhotoGroup[] = [];
      let currentGroup: PhotoGroup | null = null;

      for (const photo of photosData || []) {
        const photoTime = new Date(photo.created_at).getTime();
        if (!currentGroup || (Math.abs(photoTime - new Date(currentGroup.createdAt).getTime()) > 5000) || (photo.description !== currentGroup.description)) {
          const [commentsRes, likesRes, userLikeRes] = await Promise.all([
            supabase.from('photo_comments').select('*, users(username, avatar_url)').eq('photo_id', photo.id).order('created_at', { ascending: true }),
            supabase.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id),
            currentUser ? supabase.from('photo_likes').select('id').eq('photo_id', photo.id).eq('user_id', currentUser.id).limit(1) : Promise.resolve({ data: [] })
          ]);
          
          if (commentsRes.error) console.error('Comments error:', commentsRes.error);
          if (likesRes.error) console.error('Likes error:', likesRes.error);
          if (userLikeRes.error) console.error('UserLike error:', userLikeRes.error);

          currentGroup = { 
            id: photo.id, description: photo.description || '', createdAt: photo.created_at, 
            photos: [photo], comments: commentsRes.data || [], likes: likesRes.count || 0, isLiked: !!(userLikeRes.data && userLikeRes.data.length > 0)
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
      console.error(err)
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

  const handlePbLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!supabase || !currentUser) return router.push('/login')
    
    try {
      if (isPbLiked) {
        const { error } = await supabase
          .from('photobook_likes')
          .delete()
          .eq('photobook_id', id)
          .eq('user_id', currentUser.id)
        
        if (error) throw error
        
        setPbLikes(prev => Math.max(0, prev - 1)); 
        setIsPbLiked(false)
      } else {
        const { error } = await supabase
          .from('photobook_likes')
          .insert({ photobook_id: id, user_id: currentUser.id })
        
        if (error) throw error
        
        setPbLikes(prev => prev + 1); 
        setIsPbLiked(true)
        if (photobook?.user_id) sendNotification('like_pb', photobook.user_id, id)
      }
    } catch (err: any) { 
      console.error('Erro detalhado no like do photobook:', err.message || err.details || err)
      toast(`Erro: ${err.message || 'Não foi possível curtir o álbum.'}`, 'error')
    }
  }

  const handleMomentLike = async (groupId: string) => {
    if (!supabase || !currentUser) return router.push('/login')
    const group = photoGroups.find(g => g.id === groupId)
    if (!group) return

    try {
      if (group.isLiked) {
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', groupId)
          .eq('user_id', currentUser.id)
        
        if (error) throw error
        
        setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isLiked: false, likes: Math.max(0, g.likes - 1) } : g))
      } else {
        const { error } = await supabase
          .from('photo_likes')
          .insert({ photo_id: groupId, user_id: currentUser.id })
        
        if (error) throw error
        
        setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isLiked: true, likes: g.likes + 1 } : g))
      }
    } catch (err: any) { 
      console.error('Erro detalhado ao processar like:', err.message || err.details || err)
      toast(`Erro: ${err.message || 'Não foi possível processar a curtida.'}`, 'error')
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
    }
  }

  const handleDeleteComment = async (groupId: string, commentId: string) => {
    if (!supabase || !window.confirm("Apagar comentário?")) return
    const { error } = await supabase.from('photo_comments').delete().eq('id', commentId)
    if (!error) {
      setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, comments: g.comments.filter((c: any) => c.id !== commentId) } : g))
      toast('Comentário removido.', 'success')
    }
  }

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    if (!supabase || !window.confirm("Apagar foto?")) return
    try {
      const publicId = imageUrl.split('/').pop()?.split('.')[0]
      if (publicId) await fetch('/api/cloudinary/delete', { method: 'POST', body: JSON.stringify({ publicId }) })
      await supabase.from('photos').delete().eq('id', photoId)
      fetchPhotobookDetails()
      toast('Foto removida.', 'success')
    } catch (err) { toast('Erro ao apagar.', 'error') }
  }

  const isOwner = currentUser && photobook && currentUser.id === photobook.user_id

  if (loading && !photobook) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <main className="main-container">
        <Skeleton height="30px" width="200px" style={{ marginBottom: '40px' }} />
        <div className="responsive-grid">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="200px" width="100%" />)}
        </div>
      </main>
    </div>
  )

  if (!photobook) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      <main className="main-container">
        
        {/* HEADER */}
        <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '30px', marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', letterSpacing: '-0.5px' }}>{photobook.title}</h1>
            <div className="meta" style={{ display: 'flex', gap: '15px' }}>
              <span onClick={() => router.push(`/profile/${photobook.user_id}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{photobook.users?.username}</span>
              <span>{pbLikes} APRECIAÇÕES</span>
            </div>
            {photobook.description && (
              <p style={{ marginTop: '15px', fontSize: '14px', lineHeight: '1.5', maxWidth: '600px', opacity: 0.8 }}>
                <FormattedText text={photobook.description} />
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast('Link do photobook copiado!', 'success');
              }}
              style={{ height: '36px', padding: '0 15px', fontSize: '11px', border: '1px solid var(--border)' }}
            >
              COMPARTILHAR
            </button>
            <button onClick={handlePbLike} style={{ height: '36px', padding: '0 15px', fontSize: '11px', backgroundColor: isPbLiked ? 'transparent' : 'var(--text)', color: isPbLiked ? 'var(--text)' : 'var(--bg)' }}>
              {isPbLiked ? 'APRECIADO' : 'APRECIAR'}
            </button>
            {isOwner && (
              <>
                <button onClick={() => router.push(`/photobook/${id}/edit`)} style={{ height: '36px', padding: '0 15px', fontSize: '11px' }}>
                  EDITAR
                </button>
                <button onClick={() => router.push(`/photobook/${id}/upload`)} style={{ height: '36px', padding: '0 15px', fontSize: '11px' }}>
                  ADICIONAR
                </button>
              </>
            )}
          </div>
        </header>

        {/* TIMELINE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
          {photoGroups.map((group) => (
            <article key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              <div className="responsive-grid" style={{ gap: '10px', background: 'none', border: 'none' }}>
                {group.photos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', border: '1px solid var(--border)', padding: '6px', backgroundColor: 'var(--bg)' }}>
                    <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                      <img 
                        src={getOptimizedCloudinaryUrl(photo.image_url, { width: 600, height: 600, crop: 'fill' })} 
                        alt="Moment" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }} 
                        onClick={() => window.open(photo.image_url, '_blank')}
                      />
                    </div>
                    {isOwner && (
                      <span 
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, photo.image_url); }} 
                        style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', background: 'var(--text)', color: 'var(--bg)', padding: '4px 8px', zIndex: 10, border: 'none' }}
                      >APAGAR</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '0 5px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="meta">{new Date(group.createdAt).toLocaleDateString()}</span>
                  <span 
                    onClick={() => handleMomentLike(group.id)} 
                    className="meta" 
                    style={{ 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      color: group.isLiked ? '#ff4d4f' : 'inherit',
                      textDecoration: group.isLiked ? 'underline' : 'none'
                    }}
                  >
                    {group.likes} {group.likes === 1 ? 'LIKE' : 'LIKES'}
                  </span>
                </div>
                
                {group.description && <p style={{ fontSize: '15px', lineHeight: '1.5', marginBottom: '15px', fontWeight: '500' }}><FormattedText text={group.description} /></p>}

                {/* COMENTÁRIOS */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.comments.map((c: any) => (
                    <div key={c.id} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>{c.users?.username}</strong> {c.content}</span>
                      {(currentUser?.id === c.user_id || isOwner) && (
                        <span onClick={() => handleDeleteComment(group.id, c.id)} style={{ cursor: 'pointer', opacity: 0.5, fontSize: '10px', padding: '2px 5px' }}>APAGAR</span>
                      )}
                    </div>
                  ))}
                  
                  {currentUser && (
                    <input 
                      type="text" 
                      placeholder="+ comentar" 
                      value={newComment[group.id] || ''} 
                      onChange={(e) => setNewComment(prev => ({ ...prev, [group.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(group.id)}
                      style={{ border: 'none', borderBottom: '1px solid var(--border)', padding: '5px 0', fontSize: '12px', outline: 'none', width: '150px', backgroundColor: 'transparent' }}
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
